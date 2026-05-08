import { ChangeDetectionStrategy, Component, computed, OnInit, signal, Signal, WritableSignal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { FamilyService } from '../family/services/family.service';
import { FamilyModel } from '../family/models/family.model';
import { FamilyViewStatsModel } from '../family/models/family-view-stats.model';
import { MemberService } from '../member/services/member.service';
import { MemberModel } from '../member/models/member.model';
import { UserService } from '../user/services/user.service';
import { AdminService } from '../../core/services/admin.service';
import { AccountService } from '../settings/services/account.service';

interface ChartBar {
  date: string;
  label: string;
  count: number;
  /** Bar height as a fraction of the chart area (0 to 1). */
  heightRatio: number;
  /** Pixel x within the SVG viewBox (computed during build). */
  x: number;
  /** Pixel y within the SVG viewBox. */
  y: number;
  width: number;
  height: number;
}

const SVG_WIDTH = 720;
const SVG_HEIGHT = 220;
const SVG_PADDING = { top: 12, right: 12, bottom: 24, left: 36 };

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(MemberService);
  private readonly userService = inject(UserService);
  private readonly adminService = inject(AdminService);
  private readonly accountService = inject(AccountService);

  readonly families: WritableSignal<number> = signal(0);
  readonly members: WritableSignal<number> = signal(0);
  readonly users: WritableSignal<number> = signal(0);
  readonly loading: WritableSignal<boolean> = signal(false);

  /** Members with no family relations of any kind — surfaced as a dashboard warning. */
  readonly unconnectedCount: WritableSignal<number> = signal(0);
  readonly unconnectedNames: WritableSignal<string[]> = signal([]);

  // ─── Visits chart state ──────────────────────────────────────
  /** Families that the current user is allowed to see analytics for.
   *  Admin: every family in the system. Non-admin: their own family +
   *  any family they own. The list is filtered locally so the dropdown
   *  doesn't expose siblings of other tenants. */
  readonly chartFamilies: WritableSignal<FamilyModel[]> = signal([]);
  readonly selectedFamilyId: WritableSignal<string | null> = signal(null);

  /** ngx-mat-select-search wires its own input through this FormControl;
   *  the toSignal mirror lets the filtered list re-compute via Angular's
   *  signal graph without any manual subscribe/unsubscribe boilerplate. */
  readonly familySearch = new FormControl('', { nonNullable: true });
  private readonly familySearchTerm = toSignal(this.familySearch.valueChanges, { initialValue: '' });
  readonly filteredChartFamilies: Signal<FamilyModel[]> = computed(() => {
    const q = (this.familySearchTerm() ?? '').trim().toLowerCase();
    const list = this.chartFamilies();
    if (!q) return list;
    return list.filter(f => (f.name ?? '').toLowerCase().includes(q));
  });
  readonly selectedRangeDays: WritableSignal<number> = signal(30);
  readonly stats: WritableSignal<FamilyViewStatsModel | null> = signal(null);
  readonly chartLoading: WritableSignal<boolean> = signal(false);
  readonly chartError: WritableSignal<string | null> = signal(null);

  /** SVG geometry constants exposed to the template. */
  readonly svgWidth = SVG_WIDTH;
  readonly svgHeight = SVG_HEIGHT;

  readonly bars: Signal<ChartBar[]> = computed(() => {
    const points = this.stats()?.points ?? [];
    if (points.length === 0) return [];

    const max = Math.max(1, ...points.map(p => p.count));
    const innerW = SVG_WIDTH - SVG_PADDING.left - SVG_PADDING.right;
    const innerH = SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom;
    // Bars share a slot: 70% bar, 30% gap. With 30+ bars the gap collapses
    // to a hairline which is fine — the line of bars reads as a histogram.
    const slotW = innerW / points.length;
    const barW = Math.max(2, slotW * 0.7);

    return points.map((p, i) => {
      const ratio = p.count / max;
      const h = ratio * innerH;
      return {
        date: p.date,
        label: this.formatDateLabel(p.date),
        count: p.count,
        heightRatio: ratio,
        x: SVG_PADDING.left + slotW * i + (slotW - barW) / 2,
        y: SVG_PADDING.top + (innerH - h),
        width: barW,
        height: h
      };
    });
  });

  /** Y-axis tick lines + labels. We always show 0 / mid / max. */
  readonly yTicks: Signal<{ y: number; value: number }[]> = computed(() => {
    const points = this.stats()?.points ?? [];
    if (points.length === 0) return [];
    const max = Math.max(1, ...points.map(p => p.count));
    const innerH = SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom;
    return [0, 0.5, 1].map(t => ({
      y: SVG_PADDING.top + innerH - t * innerH,
      value: Math.round(max * t)
    }));
  });

  /** X-axis labels — show every Nth bar so labels don't overlap. */
  readonly xLabels: Signal<{ x: number; label: string }[]> = computed(() => {
    const list = this.bars();
    if (list.length === 0) return [];
    const step = Math.max(1, Math.ceil(list.length / 7));
    return list
      .filter((_, i) => i % step === 0 || i === list.length - 1)
      .map(b => ({ x: b.x + b.width / 2, label: b.label }));
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      f: this.familyService.list({ pageIndex: 0, pageSize: 5000 }),
      // Full member list so we can run the unconnected check client-side. For
      // larger deployments this should move to a dedicated backend endpoint.
      m: this.memberService.list({ pageIndex: 0, pageSize: 5000 }),
      u: this.userService.list({ pageIndex: 0, pageSize: 1 })
    }).subscribe({
      next: ({ f, m, u }) => {
        this.families.set(f?.totalCount ?? 0);
        this.members.set(m?.totalCount ?? 0);
        this.users.set(u?.totalCount ?? 0);

        const all = m?.data ?? [];
        const unconnected = this.findUnconnected(all);
        this.unconnectedCount.set(unconnected.length);
        this.unconnectedNames.set(
          unconnected.slice(0, 5).map(x => `${x.firstName ?? ''} ${x.lastName ?? ''}`.trim() || '—')
        );

        this.populateChartFamilies(f?.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /**
   * A member is "unconnected" when no relation links them to anyone:
   *   - no father, mother or spouse pointer of their own, AND
   *   - nobody else points to them as a parent or spouse.
   * The second leg is what catches family heads — Bobo without parents but
   * with grand-children — so they aren't flagged as orphans.
   */
  private findUnconnected(members: MemberModel[]): MemberModel[] {
    const referenced = new Set<string>();
    for (const m of members) {
      if (m.fatherId) referenced.add(m.fatherId);
      if (m.motherId) referenced.add(m.motherId);
      if (m.spouseId) referenced.add(m.spouseId);
    }
    return members.filter(m =>
      !m.fatherId &&
      !m.motherId &&
      !m.spouseId &&
      !referenced.has(m.id)
    );
  }

  private populateChartFamilies(all: FamilyModel[]): void {
    const visible = this.adminService.isAdmin() ? all : this.filterToOwnedAndJoined(all);
    this.chartFamilies.set(visible);

    // Pick the first family by default so the chart renders something on load.
    const first = visible[0]?.id ?? null;
    if (first) {
      this.selectedFamilyId.set(first);
      this.loadStats();
    }
  }

  private filterToOwnedAndJoined(all: FamilyModel[]): FamilyModel[] {
    const me = this.accountService.currentUser();
    const myId = me?.id;
    const myFamilyId = me?.familyId;
    if (!myId && !myFamilyId) return [];
    return all.filter(f =>
      (myId && f.ownerId === myId) ||
      (myFamilyId && f.id === myFamilyId)
    );
  }

  onFamilyChange(id: string | null): void {
    this.selectedFamilyId.set(id);
    if (id) this.loadStats();
    else this.stats.set(null);
  }

  setRange(days: number): void {
    if (this.selectedRangeDays() === days) return;
    this.selectedRangeDays.set(days);
    if (this.selectedFamilyId()) this.loadStats();
  }

  loadStats(): void {
    const id = this.selectedFamilyId();
    if (!id) return;

    this.chartLoading.set(true);
    this.chartError.set(null);

    this.familyService.getViewStats(id, this.selectedRangeDays())
      .pipe(finalize(() => this.chartLoading.set(false)))
      .subscribe({
        next: response => this.stats.set(response?.data ?? null),
        error: err => {
          this.stats.set(null);
          if (err?.status === 403) {
            this.chartError.set('forbidden');
          } else {
            this.chartError.set(err?.error?.message ?? err?.message ?? 'error');
          }
        }
      });
  }

  /** Compact "Apr 12" / "12.04" style label. Falls back to the raw string
   *  if Date parsing fails so we never render `Invalid Date`. */
  private formatDateLabel(iso: string): string {
    const d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}`;
  }
}

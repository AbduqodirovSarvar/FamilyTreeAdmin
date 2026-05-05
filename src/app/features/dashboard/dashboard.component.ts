import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FamilyService } from '../family/services/family.service';
import { MemberService } from '../member/services/member.service';
import { MemberModel } from '../member/models/member.model';
import { UserService } from '../user/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  readonly families: WritableSignal<number> = signal(0);
  readonly members: WritableSignal<number> = signal(0);
  readonly users: WritableSignal<number> = signal(0);
  readonly loading: WritableSignal<boolean> = signal(false);

  /** Members with no family relations of any kind — surfaced as a dashboard warning. */
  readonly unconnectedCount: WritableSignal<number> = signal(0);
  readonly unconnectedNames: WritableSignal<string[]> = signal([]);

  constructor(
    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      f: this.familyService.list({ pageIndex: 0, pageSize: 1 }),
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
}

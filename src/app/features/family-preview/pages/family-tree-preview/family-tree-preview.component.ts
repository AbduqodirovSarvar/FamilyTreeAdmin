import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
  computed,
  Signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { FamilyTreeModel, TreeNodeModel } from '../../models/family-tree.model';
import { FamilyWebUrlService } from '../../../../core/services/family-web-url.service';

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

@Component({
  selector: 'app-family-tree-preview',
  standalone: false,
  templateUrl: './family-tree-preview.component.html',
  styleUrls: ['./family-tree-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamilyTreePreviewComponent implements OnInit {
  @ViewChild('viewport', { static: false }) viewportRef?: ElementRef<HTMLDivElement>;

  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly selectedFamilyId: WritableSignal<string | null> = signal(null);
  readonly tree: WritableSignal<FamilyTreeModel | null> = signal(null);

  readonly loadingFamilies: WritableSignal<boolean> = signal(false);
  readonly loadingTree: WritableSignal<boolean> = signal(false);

  readonly zoom: WritableSignal<number> = signal(1);
  readonly panX: WritableSignal<number> = signal(0);
  readonly panY: WritableSignal<number> = signal(0);

  readonly transform: Signal<string> = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`
  );

  readonly forest: Signal<TreeNodeModel[]> = computed(() => this.tree()?.roots ?? []);
  readonly totalMembers: Signal<number> = computed(() => this.tree()?.totalMembers ?? 0);

  readonly selectedFamily: Signal<FamilyModel | null> = computed(() => {
    const id = this.selectedFamilyId();
    return id ? this.families().find(f => f.id === id) ?? null : null;
  });

  /** Search box wired into <ngx-mat-select-search>. */
  readonly familySearch = new FormControl('', { nonNullable: true });
  private readonly familySearchTerm = toSignal(this.familySearch.valueChanges, { initialValue: '' });
  readonly filteredFamilies: Signal<FamilyModel[]> = computed(() => {
    const q = (this.familySearchTerm() ?? '').trim().toLowerCase();
    const list = this.families();
    if (!q) return list;
    return list.filter(f => (f.name ?? '').toLowerCase().includes(q));
  });

  /**
   * Public family-page URL for the currently-selected family. Prefers the
   * tree response's `familyName` (it's the freshest source after a load),
   * falling back to the list-row name so the button stays usable while the
   * tree is still fetching.
   */
  readonly webUrl: Signal<string | null> = computed(() => {
    const name = this.tree()?.familyName ?? this.selectedFamily()?.familyName;
    return this.familyWebUrl.build(name);
  });

  // Active pointers for unified mouse/touch handling. Map keyed by pointerId
  // so each touch is tracked independently — single = pan, two = pinch.
  private readonly activePointers = new Map<number, { x: number; y: number }>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private lastPinchDistance = 0;

  constructor(
    private readonly familyService: FamilyService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly familyWebUrl: FamilyWebUrlService
  ) {}

  /** Opens the public family page in a new tab. */
  openWebPage(): void {
    const url = this.webUrl();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  ngOnInit(): void {
    this.loadFamilies();

    const initial = this.route.snapshot.paramMap.get('familyId');
    if (initial) {
      this.selectedFamilyId.set(initial);
      this.loadTree(initial);
    }
  }

  loadFamilies(): void {
    this.loadingFamilies.set(true);
    this.familyService.list({ pageIndex: 0, pageSize: 200 })
      .pipe(finalize(() => this.loadingFamilies.set(false)))
      .subscribe({
        next: response => this.families.set(response?.data ?? []),
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load families';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  onFamilyChange(id: string | null): void {
    this.selectedFamilyId.set(id);
    this.resetView();
    if (!id) {
      this.tree.set(null);
      this.router.navigate(['/preview']);
      return;
    }
    this.router.navigate(['/preview', id]);
    this.loadTree(id);
  }

  loadTree(familyId: string): void {
    this.loadingTree.set(true);
    this.familyService.getTree(familyId)
      .pipe(finalize(() => this.loadingTree.set(false)))
      .subscribe({
        next: response => this.tree.set(response?.data ?? null),
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load tree';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  refresh(): void {
    const id = this.selectedFamilyId();
    if (id) this.loadTree(id);
  }

  // ─── Zoom controls ─────────────────────────────────────────────
  zoomIn(): void { this.zoom.update(z => Math.min(z + ZOOM_STEP, ZOOM_MAX)); }
  zoomOut(): void { this.zoom.update(z => Math.max(z - ZOOM_STEP, ZOOM_MIN)); }
  resetView(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  /**
   * Zoom around an arbitrary viewport point (cx, cy in viewport-centre
   * coordinates) so the world point under it stays still — the same trick
   * used by every map app.
   */
  private zoomAt(cx: number, cy: number, newZoom: number): void {
    const oldZoom = this.zoom();
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
    if (clamped === oldZoom) return;
    const ratio = clamped / oldZoom;
    this.panX.update(p => cx - (cx - p) * ratio);
    this.panY.update(p => cy - (cy - p) * ratio);
    this.zoom.set(clamped);
  }

  /** Convert a client-space coordinate into viewport-centre coordinates. */
  private toViewportCoords(clientX: number, clientY: number): { x: number; y: number } | null {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }

  // ─── Wheel (desktop / trackpad) ────────────────────────────────
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const point = this.toViewportCoords(event.clientX, event.clientY);
    if (!point) return;
    const direction = event.deltaY > 0 ? -1 : 1;
    this.zoomAt(point.x, point.y, this.zoom() + direction * ZOOM_STEP);
  }

  // ─── Pointer events (mouse + touch + pen, unified) ─────────────
  onPointerDown(event: PointerEvent): void {
    // Ignore non-primary mouse buttons; touches always come through.
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    if (this.activePointers.size === 1) {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    } else if (this.activePointers.size === 2) {
      this.dragging = false;
      this.lastPinchDistance = this.currentPinchDistance();
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size >= 2) {
      // Pinch — zoom toward the midpoint of the two touches.
      const newDistance = this.currentPinchDistance();
      if (this.lastPinchDistance > 0 && newDistance > 0) {
        const ratio = newDistance / this.lastPinchDistance;
        const mid = this.currentPinchMidpoint();
        if (mid) this.zoomAt(mid.x, mid.y, this.zoom() * ratio);
      }
      this.lastPinchDistance = newDistance;
      return;
    }

    if (this.dragging) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.panX.update(p => p + dx);
      this.panY.update(p => p + dy);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    this.activePointers.delete(event.pointerId);
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    if (this.activePointers.size === 0) {
      this.dragging = false;
      this.lastPinchDistance = 0;
    } else if (this.activePointers.size === 1) {
      // Coming out of a pinch — reseat the drag anchor on the surviving
      // finger so the world doesn't jump on the next move.
      const remaining = Array.from(this.activePointers.values())[0];
      this.lastX = remaining.x;
      this.lastY = remaining.y;
      this.lastPinchDistance = 0;
      this.dragging = true;
    }
  }

  private currentPinchDistance(): number {
    const pts = Array.from(this.activePointers.values());
    if (pts.length < 2) return 0;
    const [a, b] = pts;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private currentPinchMidpoint(): { x: number; y: number } | null {
    const pts = Array.from(this.activePointers.values());
    if (pts.length < 2) return null;
    const [a, b] = pts;
    return this.toViewportCoords((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === '+' || event.key === '=') { this.zoomIn(); event.preventDefault(); }
    else if (event.key === '-' || event.key === '_') { this.zoomOut(); event.preventDefault(); }
    else if (event.key === '0') { this.resetView(); event.preventDefault(); }
  }
}

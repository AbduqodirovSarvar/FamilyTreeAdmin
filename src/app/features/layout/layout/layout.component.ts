import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  /** True when the viewport is phone/small-tablet sized (<768px). Drives
   *  the sidenav mode switch: desktop = always-open `side`, mobile =
   *  off-canvas `over` drawer. Recomputed on resize so rotating a tablet
   *  doesn't strand the sidebar in the wrong mode. */
  readonly isMobile: WritableSignal<boolean> = signal(false);

  /** Whether the sidenav is currently visible. On desktop this is always
   *  true (the sidebar is part of the page); on mobile the user toggles
   *  it via the topbar menu button. */
  readonly sidenavOpened: WritableSignal<boolean> = signal(true);

  /** "side" on desktop = inline column; "over" on mobile = drawer that
   *  slides over the content and dims the rest of the screen. */
  readonly sidenavMode: Signal<'side' | 'over'> = computed(() =>
    this.isMobile() ? 'over' : 'side'
  );

  /** Mobile-drawer behavior: clicking outside the sidenav dismisses it.
   *  Disabled on desktop where the sidebar is a layout column. */
  readonly hasBackdrop: Signal<boolean> = computed(() => this.isMobile());

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        const wasMobile = this.isMobile();
        const isMobile = state.matches;
        this.isMobile.set(isMobile);

        // Auto-open on desktop, auto-close when shrinking into mobile —
        // without this, a desktop user shrinking their window suddenly
        // gets a sidebar drawer covering half the screen.
        if (wasMobile !== isMobile) {
          this.sidenavOpened.set(!isMobile);
        }
      });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  /** Keeps the signal in sync when the sidenav is dismissed by the user
   *  via backdrop tap, ESC, or swipe — without this the next toggle
   *  click would do the wrong thing. */
  onSidenavClosed(): void {
    this.sidenavOpened.set(false);
  }
}

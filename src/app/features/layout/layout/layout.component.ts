import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  readonly sidenavOpened: WritableSignal<boolean> = signal(true);

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }
}

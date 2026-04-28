import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeMode, ThemeService } from '../../../../core/services/theme.service';

interface ModeOption {
  value: ThemeMode;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'app-appearance-settings',
  standalone: false,
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppearanceSettingsComponent {
  readonly modes: ModeOption[] = [
    { value: 'light',  labelKey: 'appearance.light',  icon: 'light_mode' },
    { value: 'dark',   labelKey: 'appearance.dark',   icon: 'dark_mode' },
    { value: 'system', labelKey: 'appearance.system', icon: 'computer' }
  ];

  constructor(public readonly theme: ThemeService) {}

  setMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }

  resolvedLabelKey(mode: 'light' | 'dark'): string {
    return mode === 'dark' ? 'appearance.dark' : 'appearance.light';
  }
}

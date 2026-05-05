import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsLayoutComponent } from './pages/settings-layout/settings-layout.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { PasswordSettingsComponent } from './pages/password-settings/password-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';
import { ConfirmEmailService } from '../auth/pages/confirm-email/services/confirm-email.service';

@NgModule({
  declarations: [
    SettingsLayoutComponent,
    ProfileSettingsComponent,
    PasswordSettingsComponent,
    AppearanceSettingsComponent
  ],
  imports: [
    SharedModule,
    SettingsRoutingModule,
    MatTabsModule,
    MatButtonToggleModule
  ],
  providers: [
    // ProfileSettings injects this for the "Resend confirmation" button —
    // the auth module doesn't load eagerly, so the service has to be
    // re-provided here for lazy-loaded settings to construct it.
    ConfirmEmailService
  ]
})
export class SettingsModule { }

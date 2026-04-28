import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsLayoutComponent } from './pages/settings-layout/settings-layout.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { PasswordSettingsComponent } from './pages/password-settings/password-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';

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
  ]
})
export class SettingsModule { }

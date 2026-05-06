import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsLayoutComponent } from './pages/settings-layout/settings-layout.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { PasswordSettingsComponent } from './pages/password-settings/password-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';
import { AdminNotificationsComponent } from './pages/admin-notifications/admin-notifications.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileSettingsComponent },
      { path: 'password', component: PasswordSettingsComponent },
      { path: 'appearance', component: AppearanceSettingsComponent },
      // Route is always registered; the layout component hides the tab
      // for non-admins. A non-admin who knows the URL still gets 403
      // from the backend when they click — UI gating is UX, not security.
      { path: 'admin-notifications', component: AdminNotificationsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsLayoutComponent } from './pages/settings-layout/settings-layout.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { PasswordSettingsComponent } from './pages/password-settings/password-settings.component';
import { AppearanceSettingsComponent } from './pages/appearance-settings/appearance-settings.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileSettingsComponent },
      { path: 'password', component: PasswordSettingsComponent },
      { path: 'appearance', component: AppearanceSettingsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }

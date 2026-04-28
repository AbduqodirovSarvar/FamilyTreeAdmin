import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'family',
        loadChildren: () => import('../family/family.module').then(m => m.FamilyModule)
      },
      {
        path: 'member',
        loadChildren: () => import('../member/member.module').then(m => m.MemberModule)
      },
      {
        path: 'user',
        loadChildren: () => import('../user/user-module').then(m => m.UserModule)
      },
      {
        path: 'preview',
        loadChildren: () => import('../family-preview/family-preview.module').then(m => m.FamilyPreviewModule)
      },
      {
        path: 'documents',
        loadChildren: () => import('../documents/documents.module').then(m => m.DocumentsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../settings/settings.module').then(m => m.SettingsModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }

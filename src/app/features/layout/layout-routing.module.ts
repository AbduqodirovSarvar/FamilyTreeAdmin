import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { hasPermission } from '../../core/guards/permission.guard';
import { Permission } from '../../core/enums/permission.enum';

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
        canActivate: [hasPermission(Permission.GET_FAMILY)],
        loadChildren: () => import('../family/family.module').then(m => m.FamilyModule)
      },
      {
        path: 'member',
        canActivate: [hasPermission(Permission.GET_MEMBER)],
        loadChildren: () => import('../member/member.module').then(m => m.MemberModule)
      },
      {
        path: 'user',
        canActivate: [hasPermission(Permission.GET_USER)],
        loadChildren: () => import('../user/user-module').then(m => m.UserModule)
      },
      {
        path: 'role',
        canActivate: [hasPermission(Permission.GET_ROLE)],
        loadChildren: () => import('../role/role-module').then(m => m.RoleModule)
      },
      {
        path: 'preview',
        loadChildren: () => import('../family-preview/family-preview.module').then(m => m.FamilyPreviewModule)
      },
      {
        path: 'documents',
        canActivate: [hasPermission(Permission.GET_FILE)],
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

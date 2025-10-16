import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/sign-in',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'family',
    loadChildren: () => import('./features/family/family.module').then(m => m.FamilyModule)
  },
  {
    path: 'member',
    loadChildren: () => import('./features/member/member.module').then(m => m.MemberModule)
  }
];

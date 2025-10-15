import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'sign-in',
    loadChildren: () => import('./pages/sign-in/sign-in').then(m => m.SignIn)
  },
  {
    path: 'sign-up',
    loadChildren: () => import('./pages/sign-up/sign-up').then(m => m.SignUp)
  },
  {
    path: 'forget-password',
    loadChildren: () => import('./pages/forget-password/forget-password').then(m => m.ForgetPassword)
  },
  {
    path: 'reset-sign-in',
    loadChildren: () => import('./pages/reset-sign-in/reset-sign-in').then(m => m.ResetSignIn)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

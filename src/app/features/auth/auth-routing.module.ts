import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInComponent} from './pages/sign-in/page/sign-in.component';
import { SignUpComponent } from './pages/sign-up/page/sign-up.component';
import { ForgetPasswordComponent } from './pages/forget-password/page/forget-password.component';
import { ResetSignInComponent } from './pages/reset-sign-in/page/reset-sign-in.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full'
  },
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'sign-up',
    component: SignUpComponent
  },
  {
    path: 'forget-password',
    component: ForgetPasswordComponent
  },
  {
    path: 'reset-sign-in',
    component: ResetSignInComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

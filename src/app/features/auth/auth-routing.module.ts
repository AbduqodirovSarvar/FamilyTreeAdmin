import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInComponent} from './pages/sign-in/page/sign-in.component';
import {ResetSignIn} from './pages/reset-sign-in/reset-sign-in';
import { SignUpComponent } from './pages/sign-up/page/sign-up.component';
import { ForgetPasswordComponent } from './pages/forget-password/page/forget-password.component';

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
    component: ResetSignIn
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

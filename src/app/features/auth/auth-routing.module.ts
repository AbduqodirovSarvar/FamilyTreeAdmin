import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInComponent} from './pages/sign-in/page/sign-in.component';
import {SignUp} from './pages/sign-up/sign-up';
import {ForgetPassword} from './pages/forget-password/forget-password';
import {ResetSignIn} from './pages/reset-sign-in/reset-sign-in';

const routes: Routes = [
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'sign-up',
    component: SignUp
  },
  {
    path: 'forget-password',
    component: ForgetPassword
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

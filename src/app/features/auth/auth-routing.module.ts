import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInComponent} from './pages/sign-in/page/sign-in.component';
import { SignUpComponent } from './pages/sign-up/page/sign-up.component';
import { ForgetPasswordComponent } from './pages/forget-password/page/forget-password.component';
import { ResetSignInComponent } from './pages/reset-sign-in/page/reset-sign-in.component';
import { ConfirmEmailComponent } from './pages/confirm-email/page/confirm-email.component';

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
  },
  {
    // The link in the welcome email lands here. Anonymous — the user
    // hasn't signed in yet (and might not have an account they remember).
    path: 'confirm-email',
    component: ConfirmEmailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

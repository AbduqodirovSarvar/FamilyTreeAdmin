import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthRoutingModule} from './auth-routing.module';
import {SignInComponent} from './pages/sign-in/page/sign-in.component';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {SignInService} from './pages/sign-in/services/sign-in.service';
import {HttpClientModule} from '@angular/common/http';
import { SignUpComponent } from './pages/sign-up/page/sign-up.component';
import { SignUpService } from './pages/sign-up/services/sign-up.service';
import { RouterModule } from '@angular/router';
import { ForgetPasswordComponent } from './pages/forget-password/page/forget-password.component';
import { ForgetPasswordService } from './pages/forget-password/services/forget-password.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResetSignInComponent } from './pages/reset-sign-in/page/reset-sign-in.component';
import { ResetSignInService } from './pages/reset-sign-in/services/reset-sign-in.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@NgModule({
  declarations: [
    SignInComponent,
    SignUpComponent,
    ForgetPasswordComponent,
    ResetSignInComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIcon,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe
  ],
  exports: [
    SignInComponent,
    SignUpComponent,
    ForgetPasswordComponent,
    ResetSignInComponent
  ],
  providers: [
    SignInService,
    SignUpService,
    ForgetPasswordService,
    ResetSignInService
  ]
})
export class AuthModule { }

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


@NgModule({
  declarations: [
    SignInComponent
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
    HttpClientModule
  ],
  exports: [
    SignInComponent
  ],
  providers: [
    SignInService
  ]
})
export class AuthModule { }

import {ChangeDetectionStrategy, Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {SignInService} from '../services/sign-in.service';
import {SignInRequest} from '../models/sign-in-request.model';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {TokenResponseModel} from '../../../../../core/models/base-response-models/token-response.model';
import {BaseRouterService} from '../../../../../core/services/base-router.service';

@Component({
  selector: 'sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {

  /**
   *
   * @param signInService
   * @param routerService
   */
  constructor(private readonly signInService: SignInService,
              private readonly routerService: BaseRouterService) { }

  /**
   * Sign in form
   */
  formGroup: FormGroup = new FormGroup({
    login: new FormControl("admin", Validators.required),
    password: new FormControl("Admin123!", Validators.required),
  });

  /**
   * Submit
   */
  submit(): void {
    if (this.formGroup.invalid) return;
    this.signInService.signIn(this.formGroup.value as SignInRequest).subscribe((response: BaseResponseModel<TokenResponseModel>): void => {
      this.onSubmitSuccess(response);
    });
  }

  onSubmitSuccess(response: BaseResponseModel<TokenResponseModel>): void {
    if(response?.data?.accessToken) this.signInService.setAccessToken(response?.data?.accessToken);
    if(response?.data?.refreshToken) this.signInService.setRefleshToken(response?.data?.refreshToken);
    this.routerService.navigateToSignInPage();
  }
}

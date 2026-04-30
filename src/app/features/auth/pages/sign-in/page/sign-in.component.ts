import {ChangeDetectionStrategy, Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {SignInService} from '../services/sign-in.service';
import {SignInRequest} from '../models/sign-in-request.model';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {TokenResponseModel} from '../../../../../core/models/base-response-models/token-response.model';
import {BaseRouterService} from '../../../../../core/services/base-router.service';
import {PermissionsService} from '../../../../../core/services/permissions.service';
import {AccountService} from '../../../../settings/services/account.service';

@Component({
  selector: 'sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {

  /**
   * @param signInService
   * @param routerService
   * @param permissionsService
   */
  constructor(private readonly signInService: SignInService,
              private readonly routerService: BaseRouterService,
              private readonly permissionsService: PermissionsService,
              private readonly accountService: AccountService) { }

  /**
   * Sign in form
   */
  formGroup: FormGroup = new FormGroup({
    login: new FormControl('admin', Validators.required),
    password: new FormControl('Admin123!', Validators.required),
  });

  hidePassword: boolean = true;

  toggleHidePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

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
    // Pre-fetch permissions AND profile before navigating, in parallel:
    // - permissions feed the sidebar / button gates
    // - profile feeds ownership checks ("did I create this family?")
    // forkJoin completes once both finish; both are wrapped with catchError
    // so a transient failure on either doesn't block navigation.
    forkJoin({
      perms: this.permissionsService.load().pipe(catchError(() => of(null))),
      me: this.accountService.loadMe().pipe(catchError(() => of(null)))
    }).subscribe(() => this.routerService.navigateToHome());
  }
}

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {SignInService} from '../services/sign-in.service';
import {SignInRequest} from '../models/sign-in-request.model';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {TokenResponseModel} from '../../../../../core/models/base-response-models/token-response.model';
import {BaseRouterService} from '../../../../../core/services/base-router.service';
import {PermissionsService} from '../../../../../core/services/permissions.service';
import {AdminService} from '../../../../../core/services/admin.service';
import {AccountService} from '../../../../settings/services/account.service';
import {GoogleIdentityService} from '../../../../../core/services/google-identity.service';
import {environment} from '../../../../../../environments/environment';

@Component({
  selector: 'sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent implements AfterViewInit {

  /** Host element for Google's rendered button. */
  @ViewChild('googleButton') googleButton?: ElementRef<HTMLDivElement>;

  /** Hides the Google block entirely when no client id is configured. */
  readonly googleEnabled: boolean = !!environment.googleClientId;

  /**
   * @param signInService
   * @param routerService
   * @param permissionsService
   */
  constructor(private readonly signInService: SignInService,
              private readonly routerService: BaseRouterService,
              private readonly permissionsService: PermissionsService,
              private readonly accountService: AccountService,
              private readonly adminService: AdminService,
              private readonly googleIdentity: GoogleIdentityService) { }

  ngAfterViewInit(): void {
    if (!this.googleEnabled || !this.googleButton) return;
    void this.googleIdentity.renderButton(
      this.googleButton.nativeElement,
      environment.googleClientId,
      (idToken: string) => this.onGoogleCredential(idToken)
    );
  }

  /** Exchanges the Google ID token for our own tokens, then reuses the
   *  standard post-login flow (tokens + permissions/profile + navigate). */
  onGoogleCredential(idToken: string): void {
    this.signInService.googleSignIn({ idToken })
      .subscribe((response: BaseResponseModel<TokenResponseModel>): void => {
        this.onSubmitSuccess(response);
      });
  }

  /**
   * Sign in form
   */
  formGroup: FormGroup = new FormGroup({
    login: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
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
      me: this.accountService.loadMe().pipe(catchError(() => of(null))),
      // isAdmin gates the admin-only settings tab; load it before navigating
      // so the post-login redirect lands on a UI that's already correctly
      // configured (avoids a flicker as the tab appears or disappears).
      isAdmin: this.adminService.check().pipe(catchError(() => of(false)))
    }).subscribe(() => this.routerService.navigateToHome());
  }
}

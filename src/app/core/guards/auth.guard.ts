import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { BaseAuthService } from '../services/global-entity-services/base-auth.service';
import { BaseRouterService } from '../services/base-router.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(BaseAuthService);
  const routerService = inject(BaseRouterService);

  if (authService.getAccessToken()) {
    return true;
  }

  routerService.navigateToSignInPage();
  return false;
};

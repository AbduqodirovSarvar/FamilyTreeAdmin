import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { BaseAuthService } from '../services/global-entity-services/base-auth.service';
import { BaseRouterService } from '../services/base-router.service';
import { PermissionsService } from '../services/permissions.service';
import { AccountService } from '../../features/settings/services/account.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(BaseAuthService);
  const routerService = inject(BaseRouterService);
  const permissionsService = inject(PermissionsService);
  const accountService = inject(AccountService);

  if (!authService.getAccessToken()) {
    routerService.navigateToSignInPage();
    return false;
  }

  // On a fresh page load both the permission set and the cached /me profile
  // are empty in memory. Kick off both refreshes so the sidebar, action
  // buttons, and ownership checks (e.g. "did I create this family?") reflect
  // the latest server-side state. Fire-and-forget.
  if (!permissionsService.loaded()) {
    permissionsService.load().subscribe();
  }
  if (!accountService.currentUser()) {
    accountService.loadMe().subscribe();
  }

  return true;
};

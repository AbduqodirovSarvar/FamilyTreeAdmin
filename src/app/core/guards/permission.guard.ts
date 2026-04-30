import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PermissionsService } from '../services/permissions.service';
import { PermissionName } from '../enums/permission.enum';

/**
 * Route guard factory: returns a CanActivateFn that lets the navigation
 * through only if the user has the given permission(s). Pass one permission
 * for "must have", or several for "must have any of".
 *
 * Usage: `canActivate: [hasPermission(Permission.GET_USER)]`
 *
 * If permissions haven't been fetched yet (deep-link page reload), the guard
 * triggers a load and waits — keeps the redirect deterministic.
 */
export function hasPermission(...required: PermissionName[]): CanActivateFn {
  return async () => {
    const permissions = inject(PermissionsService);
    const router = inject(Router);

    if (!permissions.loaded()) {
      try { await firstValueFrom(permissions.load()); } catch { /* fall through to check */ }
    }

    if (required.some(p => permissions.has(p))) return true;

    // Out of scope for this user — bounce them home rather than letting
    // the protected page render and 500 on its first API call.
    return router.createUrlTree(['/dashboard']);
  };
}

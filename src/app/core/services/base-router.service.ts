import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({ providedIn: 'root'})
export class BaseRouterService {

  /**
   * Creates an instance of the class with the provided router.
   *
   * @param {Router} router - An instance of the Router used for navigation or route management.
   */
  constructor(private readonly router: Router) {}

  /**
   * Navigates to a specified route within the application.
   *
   * @param {string | any[]} route - The route to navigate to. It can be a string representing the route as a URL or an array of route segments.
   * @return {void} This method does not return a value.
   */
  navigateTo(route: string | any[]): void {
    if (typeof route === 'string') {
      this.router.navigateByUrl(route).then((): void => {});
    } else {
      this.router.navigate(route).then((): void => {});
    }
  }

  /**
   * Navigate to sign in page
   */
  navigateToSignInPage(): void {
    this.navigateTo('/auth/sign-in');
  }
}

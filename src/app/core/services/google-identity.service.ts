import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Thin wrapper around Google Identity Services (GIS). Loads the GSI script once
 * (browser-only — no-ops during SSR), initializes the client, and renders the
 * official "Sign in with Google" button. The credential (ID token) is handed
 * back through a callback, re-entering Angular's zone so change detection runs.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  private static readonly SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
  private scriptPromise: Promise<void> | null = null;

  /**
   * Renders the Google button into `element`. `onCredential` fires with the
   * raw ID token once the user completes the Google flow.
   */
  async renderButton(
    element: HTMLElement,
    clientId: string,
    onCredential: (idToken: string) => void
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!clientId) {
      console.warn('[GoogleIdentityService] googleClientId is not configured.');
      return;
    }

    await this.loadScript();

    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (response?.credential) {
          // GIS fires its callback outside Angular's zone — re-enter so the
          // subsequent HTTP call and navigation trigger change detection.
          this.zone.run(() => onCredential(response.credential!));
        }
      },
    });

    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: element.clientWidth || 320,
      text: 'continue_with',
      logo_alignment: 'center',
    });
  }

  /** Injects the GSI script tag once; resolves when it has loaded. */
  private loadScript(): Promise<void> {
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GoogleIdentityService.SCRIPT_SRC}"]`
      );
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = GoogleIdentityService.SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}

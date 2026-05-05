import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Builds the public family-page URL the admin links to. The path is just the
 * surname, lowercased — no plural suffix. Cyrillic and the Latin-Uzbek
 * apostrophes are transliterated so a Cyrillic-input "Холмуродов" lands on
 * the same Latin slug ("xolmurodov") as a Latin-input "Xolmurodov".
 */
@Injectable({ providedIn: 'root' })
export class FamilyWebUrlService {
  private readonly baseUrl = (environment.webAppUrl ?? '').replace(/\/+$/, '');

  /** Full URL to the family page, or null when the family name is missing. */
  build(familyName?: string | null): string | null {
    const slug = this.toSlug(familyName);
    if (!slug) return null;
    return `${this.baseUrl}/${slug}`;
  }

  /** Visible-only URL builder — for cases where we have the slug already. */
  forSlug(slug: string): string {
    return `${this.baseUrl}/${slug}`;
  }

  /**
   * Lowercase + URL-safe. Cyrillic letters and Latin-Uzbek apostrophes
   * (o' / g') are transliterated; everything outside `[a-z0-9-]` is dropped.
   */
  private toSlug(name?: string | null): string | null {
    if (!name) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;

    const map: Record<string, string> = {
      // Cyrillic
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
      я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
      // Apostrophes used in Latin-Uzbek orthography (o' / g') are dropped.
      "'": '', "`": '', "ʼ": ''
    };

    const slug = trimmed
      .toLowerCase()
      .split('')
      .map(ch => map[ch] ?? ch)
      .join('')
      .replace(/[^a-z0-9-]/g, '');

    return slug || null;
  }
}

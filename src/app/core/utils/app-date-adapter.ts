import { NativeDateAdapter } from '@angular/material/core';

/**
 * Force `dd.MM.yyyy` everywhere in Material datepickers — display, parse, and
 * accessibility labels — regardless of the active browser locale. The native
 * adapter normally hands back whatever `Intl.DateTimeFormat` decides for the
 * locale, which produces inconsistent layouts (en-US: 1/15/2026, en-GB:
 * 15/01/2026, etc.).
 */
export class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date, _displayFormat: object): string {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (match) {
        const day = +match[1];
        const month = +match[2];
        const year = +match[3];
        const date = new Date(year, month - 1, day);
        // Reject "32.01.2026" → JS rolls it to next month; we want a strict reject.
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          return date;
        }
        return null;
      }
    }
    return super.parse(value);
  }
}

export const APP_DATE_FORMATS = {
  parse: { dateInput: 'dd.MM.yyyy' },
  display: {
    dateInput: 'dd.MM.yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd.MM.yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  }
};

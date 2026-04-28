import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UploadedFileShortModel } from '../models/base-response-models/uploaded-file.model';

interface HasImage {
  image?: UploadedFileShortModel | null;
}

/**
 * Resolves the full URL for an entity's avatar/image.
 * Returns `null` when there is no image so callers can fall back to a person icon.
 */
@Injectable({ providedIn: 'root' })
export class ImageUrlService {
  private readonly base = (environment.apiUrl ?? '').replace(/\/$/, '');

  resolve(entity: HasImage | null | undefined): string | null {
    const path = entity?.image?.url ?? entity?.image?.path;
    return this.resolvePath(path);
  }

  /** Build absolute URL from a raw relative path (e.g. tree API returns plain `imageUrl`). */
  resolvePath(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalised = path.startsWith('/') ? path : `/${path}`;
    return `${this.base}${normalised}`;
  }
}

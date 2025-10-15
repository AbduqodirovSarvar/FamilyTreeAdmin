import {environment} from '../../../environments/environment';
import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root' })
export abstract class BaseUrlService {
  protected readonly baseUrl = environment.apiUrl;
}

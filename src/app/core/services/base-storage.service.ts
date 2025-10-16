import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root'})
export class BaseStorageService {

  /**
   * Stores a key-value pair in local storage after serializing the value to a JSON string.
   *
   * @param {string} key - The key under which the value will be stored in local storage.
   * @param {any} value - The value to be stored in local storage. It will be serialized into a JSON string.
   * @return {void} This method does not return a value.
   */
  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieves an item from localStorage by the specified key and parses it to the expected type.
   *
   * @param {string} key - The key of the item to retrieve from localStorage.
   * @return {T | null} The parsed data of type T if the key exists, otherwise null.
   */
  getItem<T>(key: string): T | null {
    const data: string | null = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : null;
  }

  /**
   *
   * @param key
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

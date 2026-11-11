import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AboutModel } from '../models/about.model';
import { environment } from '../../environments/environment';

/*
 * =============================================================================
 * RxJS-вариант (как было изначально) — методы возвращают Observable
 * =============================================================================
 *
 * import { inject, Injectable } from '@angular/core';
 * import { HttpClient } from '@angular/common/http';
 * import { Observable } from 'rxjs';
 * import { AboutModel } from '../models/about.model';
 * import { environment } from '../../environments/environment';
 *
 * @Injectable({ providedIn: 'root' })
 * export class AboutService {
 *   private http = inject(HttpClient);
 *   private apiUrl = `${environment.apiUrl}/about`;
 *
 *   getAbout(): Observable<AboutModel> {
 *     return this.http.get<AboutModel>(this.apiUrl);
 *   }
 *
 *   updateAbout(aboutData: AboutModel): Observable<AboutModel> {
 *     return this.http.put<AboutModel>(this.apiUrl, aboutData);
 *   }
 * }
 *
 * // В компоненте:
 * // this.aboutService.getAbout().subscribe({ next: data => ..., error: ... });
 * // или: about$ = this.aboutService.getAbout(); + async pipe в шаблоне
 *
 * Что изменилось при переходе на Signal:
 * - Состояние профиля хранится в signal (about / isLoading / error)
 * - HTTP по-прежнему через HttpClient (он отдаёт Observable),
 *   но результат кладём в signal через firstValueFrom + async/await
 * - Компонентам не нужна подписка / async pipe — читают about()
 * =============================================================================
 */

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/about`;

  private readonly _about = signal<AboutModel | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly about = this._about.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadAbout(): Promise<AboutModel | null> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<AboutModel>(this.apiUrl));
      this._about.set(data);
      return data;
    } catch {
      this._error.set('Failed to load about profile.');
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateAbout(aboutData: AboutModel): Promise<AboutModel | null> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.put<AboutModel>(this.apiUrl, aboutData)
      );
      this._about.set(data);
      return data;
    } catch {
      this._error.set('Failed to update about profile.');
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }
}

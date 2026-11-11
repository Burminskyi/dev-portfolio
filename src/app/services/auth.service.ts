import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  email?: string;
  role?: string;
}

/*
 * =============================================================================
 * RxJS-вариант (как было изначально) — login() возвращает Observable + tap
 * =============================================================================
 *
 * import { inject, Injectable, signal } from '@angular/core';
 * import { HttpClient } from '@angular/common/http';
 * import { Observable, tap } from 'rxjs';
 * import { environment } from '../../environments/environment';
 *
 * @Injectable({ providedIn: 'root' })
 * export class AuthService {
 *   private http = inject(HttpClient);
 *   private apiUrl = `${environment.apiUrl}/auth`;
 *   private readonly TOKEN_KEY = 'auth_token';
 *
 *   public isAuthenticated = signal<boolean>(this.hasToken());
 *
 *   login(credentials: { email: string; password: string }): Observable<LoginResponse> {
 *     return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
 *       tap(response => {
 *         if (response?.token) {
 *           localStorage.setItem(this.TOKEN_KEY, response.token);
 *           this.isAuthenticated.set(true);
 *         }
 *       })
 *     );
 *   }
 *
 *   // В Login-компоненте:
 *   // this.authService.login(credentials).subscribe({ next: () => ..., error: ... });
 * }
 *
 * Что изменилось при переходе на Signal / async:
 * - login() стал async и возвращает Promise (firstValueFrom вместо .subscribe / tap)
 * - Состояние ошибки/загрузки логина можно держать в signals сервиса или компонента
 * - isAuthenticated уже был signal — оставлен как единый источник истины для guard/UI
 * =============================================================================
 */

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  readonly isAuthenticated = signal<boolean>(this.hasToken());

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
    );

    if (response?.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      this.isAuthenticated.set(true);
    }

    return response;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, delay } from 'rxjs/operators';
import { User, Role } from '../models';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  user:  User;
}

// ── Demo fallback (used only when API is unreachable) ─────────────────────────
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'worker1@worker.com':         { password: 'worker1',      user: { id:7,  name:'Juan dela Cruz',         email:'worker1@worker.com',         role:'worker'     } },
  'worker2@worker.com':         { password: 'worker2',      user: { id:8,  name:'Rosa Mendoza',            email:'worker2@worker.com',         role:'worker'     } },
  'supervisor1@supervisor.com': { password: 'supervisor1',  user: { id:4,  name:'Maria Santos',            email:'supervisor1@supervisor.com', role:'supervisor' } },
  'supervisor2@supervisor.com': { password: 'supervisor2',  user: { id:5,  name:'Pedro Reyes',             email:'supervisor2@supervisor.com', role:'supervisor' } },
  'manager1@manager.com':       { password: 'manager1',     user: { id:2,  name:'Rodrigo Dela Cruz',       email:'manager1@manager.com',       role:'manager'    } },
  'manager2@manager.com':       { password: 'manager2',     user: { id:3,  name:'Elena Mercado',           email:'manager2@manager.com',       role:'manager'    } },
  'admin1@admin.com':           { password: 'admin1',       user: { id:1,  name:'System Administrator',   email:'admin1@admin.com',           role:'admin'      } },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user  = signal<User | null>(this.restoreUser());
  private _token = signal<string | null>(localStorage.getItem('pfp_token'));

  readonly user            = this._user.asReadonly();
  readonly token           = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly role            = computed(() => this._user()?.role ?? null);

  hasRole(...roles: string[]): boolean {
    const r = this._user()?.role;
    return r ? roles.includes(r) : false;
  }

  // ── Login — real API first, demo fallback if offline ─────────────────────
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ token, user }) => this.persist(token, user)),
        catchError(err => {
          // If API is down (network error or 0 status), use demo users
          if (err.status === 0 || err.status === 504) {
            const demo = DEMO_USERS[email.toLowerCase()];
            if (demo && demo.password === password) {
              const res: LoginResponse = {
                token: `demo-token-${demo.user.role}-${Date.now()}`,
                user:  demo.user,
              };
              return of(res).pipe(
                delay(300),
                tap(({ token, user }) => this.persist(token, user))
              );
            }
            return throwError(() => ({ status: 401, error: { message: 'Invalid credentials.' } }));
          }
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    const token = this._token();
    if (token && !token.startsWith('demo-token-')) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    }
    localStorage.removeItem('pfp_token');
    localStorage.removeItem('pfp_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Called by JWT interceptor on token refresh */
  setToken(token: string): void {
    localStorage.setItem('pfp_token', token);
    this._token.set(token);
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, email: string, password: string) {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { token, email, password, password_confirmation: password }
    );
  }

  private persist(token: string, user: User): void {
    localStorage.setItem('pfp_token', token);
    localStorage.setItem('pfp_user', JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private restoreUser(): User | null {
    try {
      const raw = localStorage.getItem('pfp_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}

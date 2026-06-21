import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token  = localStorage.getItem('pfp_token');
  const router = inject(Router);
  const http   = inject(HttpClient);

  const isAuthRoute = req.url.includes('/auth/login')
    || req.url.includes('/auth/refresh')
    || req.url.includes('/auth/forgot-password')
    || req.url.includes('/auth/reset-password');

  // Skip all HTTP calls when in demo mode (no apiUrl configured)
  // The mock API handles data locally — no real HTTP needed for demo tokens
  const isDemo = !environment.apiUrl?.trim() || token?.startsWith('demo-token-');

  // Proactively refresh real JWT tokens approaching expiry
  if (token && !isDemo && !isAuthRoute) {
    try {
      const payload   = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = (payload.exp * 1000) - Date.now();
      if (expiresIn > 0 && expiresIn < 15 * 60 * 1000) {
        http.post<{ token: string }>(
          `${environment.apiUrl}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).pipe(catchError(() => throwError(() => null))).subscribe(res => {
          if (res?.token) localStorage.setItem('pfp_token', res.token);
        });
      }
    } catch {}
  }

  // Attach Authorization header for real (non-demo) tokens
  const authReq = token && !isDemo
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthRoute && !isDemo) {
        localStorage.removeItem('pfp_token');
        localStorage.removeItem('pfp_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};

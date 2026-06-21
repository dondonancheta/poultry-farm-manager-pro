import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token  = localStorage.getItem('pfp_token');
  const router = inject(Router);
  const http   = inject(HttpClient);

  // Skip auth endpoints
  const isAuthRoute = req.url.includes('/auth/login')
    || req.url.includes('/auth/refresh')
    || req.url.includes('/auth/forgot-password')
    || req.url.includes('/auth/reset-password');

  // Proactively refresh real JWT tokens approaching expiry (15-min threshold)
  if (token && !token.startsWith('demo-token-') && !isAuthRoute) {
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

  // Attach Authorization header for real tokens only
  const freshToken = localStorage.getItem('pfp_token');
  const authReq = freshToken && !freshToken.startsWith('demo-token-')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${freshToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthRoute) {
        localStorage.removeItem('pfp_token');
        localStorage.removeItem('pfp_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};

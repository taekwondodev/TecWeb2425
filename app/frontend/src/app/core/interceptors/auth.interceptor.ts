import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpErrorResponse, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  if (authService.isLoggedIn() && !req.url.includes('/auth/')) {
    req = addToken(req, authService);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const token = authService.getAccessToken();
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  if (!authService.refreshTokenInProgress()) {
    
    return from(authService.refreshToken()).pipe(
      switchMap(() => {
        return next(addToken(request, authService));
      }),
      catchError((refreshError) => {
        authService.logout();
        return throwError(() => refreshError);
      })
    );
  } else {
    return throwError(() => new Error('Refresh token in progress'));
  }
}
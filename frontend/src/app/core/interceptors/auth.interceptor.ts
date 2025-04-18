import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpErrorResponse, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

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
  if (!authService.refreshTokenInProgress) {
    authService.refreshTokenInProgress = true;
    
    return from(authService.refreshToken()).pipe(
      switchMap(() => {
        authService.refreshTokenInProgress = false;
        return next(addToken(request, authService));
      }),
      catchError((refreshError) => {
        authService.refreshTokenInProgress = false;
        authService.logout();
        return throwError(() => refreshError);
      })
    );
  } else {
    // Se il refresh è già in corso, aspetta e poi ritenta
    return authService.tokenRefreshed$.pipe(
      switchMap(() => next(addToken(request, authService)))
    );
  }
}
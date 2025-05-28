import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../../shared/models/auth.model';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly _accessToken = signal<string | null>(null);
  private readonly _isLoggedIn = signal<boolean>(false);
  private readonly _refreshTokenInProgress = signal<boolean>(false);

  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly refreshTokenInProgress = this._refreshTokenInProgress.asReadonly();

  readonly authStatus = computed(() => this._isLoggedIn());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    const token = this.getAccessToken();
    if (token) {
      this._accessToken.set(token);
      this._isLoggedIn.set(true);
    }

    effect(() => {
      const token = this._accessToken();
      const isLoggedIn = this._isLoggedIn();

      if (token && isLoggedIn) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    });
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/login`, loginData)
      );
      this.storeTokens(response);
      return response;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
    );
    this.router.navigate(['/login']);
    return response;
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      this._refreshTokenInProgress.set(true);

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/refresh`, {
          refreshToken,
        })
      );

      this.storeRefreshedTokens(response, refreshToken);
      return response;
    } catch (error) {
      this.logout();
      throw error;
    } finally {
      this._refreshTokenInProgress.set(false);
    }
  }

  /***************************************************************************************/

  private storeRefreshedTokens(
    response: AuthResponse,
    existingRefreshToken: string
  ): void {
    this._accessToken.set(response.accessToken);
    this._isLoggedIn.set(true);
    localStorage.setItem('accessToken', response.accessToken);

    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    } else {
      localStorage.setItem('refreshToken', existingRefreshToken);
    }
  }

  private storeTokens(response: AuthResponse): void {
    this._accessToken.set(response.accessToken);
    this._isLoggedIn.set(true);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  }

  private clearTokens(): void {
    this._accessToken.set(null);
    this._isLoggedIn.set(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

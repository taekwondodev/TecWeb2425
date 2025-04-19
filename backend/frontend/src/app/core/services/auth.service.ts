import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/auth.model';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly accessTokenSubject = new BehaviorSubject<string | null>(null);
  private readonly authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  refreshTokenInProgress = false;
  private readonly tokenRefreshedSource = new BehaviorSubject<void>(undefined);
  tokenRefreshed$ = this.tokenRefreshedSource.asObservable();
  authStatus$ = this.authStatus.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) { }

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
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
      );
      this.router.navigate(['/login']);
      return response;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
  
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      );
      
      this.storeTokens(response);
      this.tokenRefreshedSource.next();
      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /***************************************************************************************/

  private storeTokens(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    this.accessTokenSubject.next(response.accessToken);
    this.authStatus.next(true);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessTokenSubject.next(null);
    this.authStatus.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
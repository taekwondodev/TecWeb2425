export interface LoginRequest {
  username: string;
  password: string;
}
  
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
  
export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface NavigationStatus {
  username: string;
}
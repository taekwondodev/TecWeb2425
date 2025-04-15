export interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    uploadedMemes?: string[]; // Array di ID dei meme
    likedMemes?: string[]; // Array di ID dei meme votati positivamente
    dislikedMemes?: string[]; // Array di ID dei meme votati negativamente
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
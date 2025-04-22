import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'meme-of-day',
    loadComponent: () => import('./features/meme-of-day/meme-of-day.component').then(m => m.MemeOfDayComponent)
  },
  {
    path: 'meme/:memeId',
    loadComponent: () => import('./features/meme-details/meme-details.component').then(m => m.MemeDetailsComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./features/meme-upload/meme-upload.component').then(m => m.MemeUploadComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  { path: '**', redirectTo: '' }
];
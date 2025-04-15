import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { MemeOfDayComponent } from './features/meme-of-day/meme-of-day.component';
import { MemeDetailsComponent } from './features/meme-details/meme-details.component';
import { MemeUploadComponent } from './features/meme-upload/meme-upload.component';
import { SearchResultsComponent } from './features/search-results/search-results.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { AuthGuard } from './core/guards/auth.guards';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'meme-of-day', component: MemeOfDayComponent },
  { path: 'meme/:id', component: MemeDetailsComponent },
  { path: 'upload', component: MemeUploadComponent, canActivate: [AuthGuard] },
  { path: 'search', component: SearchResultsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
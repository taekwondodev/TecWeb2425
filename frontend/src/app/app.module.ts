import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.modules';
import { AppComponent } from './app.component';

// Core
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Shared Components
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { MemeCardComponent } from './shared/components/meme-card/meme-card.component';
import { CommentSectionComponent } from './shared/components/comment-section/comment-section.component';
import { UpvoteDownvoteComponent } from './shared/components/upvote-downvote/upvote-downvote.component';
import { SearchFilterComponent } from './shared/components/search-filter/search-filter.component';

// Feature Components
import { HomeComponent } from './features/home/home.component';
import { MemeOfDayComponent } from './features/meme-of-day/meme-of-day.component';
import { MemeDetailsComponent } from './features/meme-details/meme-details.component';
import { MemeUploadComponent } from './features/meme-upload/meme-upload.component';
import { SearchResultsComponent } from './features/search-results/search-results.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MemeCardComponent,
    CommentSectionComponent,
    UpvoteDownvoteComponent,
    SearchFilterComponent,
    HomeComponent,
    MemeOfDayComponent,
    MemeDetailsComponent,
    MemeUploadComponent,
    SearchResultsComponent,
    LoginComponent,
    RegisterComponent,
    UserProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
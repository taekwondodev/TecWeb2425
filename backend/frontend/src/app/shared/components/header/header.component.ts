import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy{
  isMenuOpen = false;
  searchQuery = '';
  isLoggedIn = false;
  private readonly authStatusSubscription: Subscription;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.authStatusSubscription = this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  ngOnDestroy(): void {
    this.authStatusSubscription.unsubscribe();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  search(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/'], {
        queryParams: { 
          query: this.searchQuery,
          page: 1 // Reset alla prima pagina
        },
        queryParamsHandling: 'merge'
      });
      this.searchQuery = '';
    }
  }
}
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent{
  isMenuOpen = false;
  searchQuery = '';
  isLoggedIn = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.isLoggedIn = this.authService.isLoggedIn();
    
    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
    });
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
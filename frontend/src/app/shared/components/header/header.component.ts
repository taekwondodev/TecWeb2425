import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { FlashService } from '../../../core/services/flash.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [RouterModule, FormsModule],
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly flashService = inject(FlashService);

  readonly isMenuOpen = signal(false);
  readonly searchQuery = signal('');
  readonly isLoggedIn = this.authService.isLoggedIn;

  toggleMenu(): void {
    this.isMenuOpen.update(current => !current);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']).then(() => {
      this.flashService.showMessage('Logout effettuato con successo', 'logout');
    });
  }

  search(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/'], {
        queryParams: { 
          query: query,
          page: 1
        },
        queryParamsHandling: 'merge'
      });
      this.searchQuery.set('');
    }
  }

  updateSearchQuery(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
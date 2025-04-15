import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../core/services/auth.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upvote-downvote',
  templateUrl: './upvote-downvote.component.html',
  styleUrls: ['./upvote-downvote.component.scss']
})
export class UpvoteDownvoteComponent {
  @Input() upvotes: number = 0;
  @Input() downvotes: number = 0;
  @Input() userVote: 'up' | 'down' | null = null;
  @Output() onUpvote = new EventEmitter<void>();
  @Output() onDownvote = new EventEmitter<void>();
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  
  upvote(): void {
    if (this.isLoggedIn) {
      this.onUpvote.emit();
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  downvote(): void {
    if (this.isLoggedIn) {
      this.onDownvote.emit();
    } else {
      this.router.navigate(['/login']);
    }
  }
}
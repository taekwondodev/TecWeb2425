import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Meme } from '../../models/meme.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-meme-card',
  templateUrl: './meme-card.component.html',
  styleUrls: ['./meme-card.component.scss']
})
export class MemeCardComponent {
  @Input() meme!: Meme;
  @Input() showActions = true;
  @Output() upvote = new EventEmitter<string>();
  @Output() downvote = new EventEmitter<string>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  viewMeme(): void {
    this.router.navigate(['/meme', this.meme.id]);
  }

  upvoteMeme(): void {
    if (this.isLoggedIn) {
      this.upvote.emit(this.meme.id);
    } else {
      this.router.navigate(['/login']);
    }
  }

  downvoteMeme(): void {
    if (this.isLoggedIn) {
      this.downvote.emit(this.meme.id);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
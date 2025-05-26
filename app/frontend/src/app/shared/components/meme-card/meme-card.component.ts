import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Meme } from '../../models/meme.model';
import { AuthService } from '../../../core/services/auth.service';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-meme-card',
  templateUrl: './meme-card.component.html',
  standalone: true,
  imports: [DatePipe],
  styleUrls: ['./meme-card.component.css']
})
export class MemeCardComponent {
  @Input() meme!: Meme;
  @Input() showActions = true;
  @Output() upvote = new EventEmitter<number>();
  @Output() downvote = new EventEmitter<number>();

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

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
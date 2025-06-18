import { Component, Input, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Meme } from '../../models/meme.model';
import { AuthService } from '../../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { UpvoteDownvoteComponent } from "../upvote-downvote/upvote-downvote.component";


@Component({
  selector: 'app-meme-card',
  templateUrl: './meme-card.component.html',
  standalone: true,
  imports: [DatePipe, UpvoteDownvoteComponent],
  styleUrls: ['./meme-card.component.css']
})
export class MemeCardComponent {
  @Input() meme!: Meme;
  @Input() showActions = true;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  viewMeme(): void {
    this.router.navigate(['/meme', this.meme.id]);
  }
}
import { Component, Input, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MemeService } from '../../../core/services/meme.service';
import { VoteResponse } from '../../models/meme.model';

@Component({
  selector: 'app-upvote-downvote',
  templateUrl: './upvote-downvote.component.html',
  standalone: true,
  imports: [],
  styleUrls: ['./upvote-downvote.component.css']
})
export class UpvoteDownvoteComponent {
  @Input() memeId!: number;
  @Input() upvotes: number = 0;
  @Input() downvotes: number = 0;
  @Input() userVote: 'up' | 'down' | null = null;
  disabledUp: boolean = false;
  disabledDown: boolean = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly memeService = inject(MemeService);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  async upvote(): Promise<void> {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const response = await this.memeService.voteMeme(this.memeId, 1);
      this.updateUpVotes(response);
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  }

  async downvote(): Promise<void> {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const response = await this.memeService.voteMeme(this.memeId, -1);
      this.updateDownVotes(response);
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  }

  private updateUpVotes(response: VoteResponse): void {
    if (response.removed) {
      this.upvotes--;
      this.disabledDown = false;
    }
    else {
      this.upvotes++;
      this.disabledDown = true;
    }
  }

  private updateDownVotes(response: VoteResponse): void {
    if (response.removed) {
      this.downvotes--;
      this.disabledUp = false;
    }
    else {
      this.downvotes++;
      this.disabledUp = true;
    }
  }

}
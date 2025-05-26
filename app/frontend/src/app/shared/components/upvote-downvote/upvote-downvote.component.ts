import { Component, Input, OnInit, inject } from '@angular/core';
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
export class UpvoteDownvoteComponent implements OnInit {
  @Input() memeId!: number;
  @Input() upvotes: number = 0;
  @Input() downvotes: number = 0;
  userVote: 'up' | 'down' | null = null;
  disabledUp: boolean = false;
  disabledDown: boolean = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.loadUserVote();
    } else {
      this.userVote = null;
      this.updateButtonStates();
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private async loadUserVote(): Promise<void> {
    try {
      const vote = await this.memeService.getUserVote(this.memeId);
      this.userVote = vote === 1 ? 'up' : vote === -1 ? 'down' : null;
      this.updateButtonStates();
    } catch (error) {
      console.error('Error loading user vote:', error);
      this.userVote = null;
    }
  }

  private updateButtonStates(): void {
    this.disabledUp = this.userVote === 'down';
    this.disabledDown = this.userVote === 'up';
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
      this.userVote = null;
    }
    else {
      this.upvotes++;
      this.userVote = 'up';
    }
    this.updateButtonStates();
  }

  private updateDownVotes(response: VoteResponse): void {
    if (response.removed) {
      this.downvotes--;
      this.userVote = null;
    }
    else {
      this.downvotes++;
      this.userVote = 'down';
    }
    this.updateButtonStates();
  }

}
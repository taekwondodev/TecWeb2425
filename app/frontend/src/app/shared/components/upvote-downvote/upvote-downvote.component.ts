import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MemeService } from '../../../core/services/meme.service';
import { VoteResponse } from '../../models/meme.model';

@Component({
  selector: 'app-upvote-downvote',
  templateUrl: './upvote-downvote.component.html',
  standalone: true,
  imports: [],
  styleUrls: ['./upvote-downvote.component.css'],
})
export class UpvoteDownvoteComponent implements OnInit {
  @Input() memeId!: number;
  @Input() set upvotes(value: number) {
    this._upvotes.set(value);
  }
  @Input() set downvotes(value: number) {
    this._downvotes.set(value);
  }

  private readonly _upvotes = signal<number>(0);
  private readonly _downvotes = signal<number>(0);
  private readonly _userVote = signal<'up' | 'down' | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly disabledUp = computed(
    () => this._userVote() === 'down' || this._isLoading()
  );
  readonly disabledDown = computed(
    () => this._userVote() === 'up' || this._isLoading()
  );
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  readonly upvotesSignal = this._upvotes.asReadonly();
  readonly downvotesSignal = this._downvotes.asReadonly();
  readonly userVote = this._userVote.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadUserVote();
    }
  }

  private async loadUserVote(): Promise<void> {
    try {
      const vote = await this.memeService.getUserVote(this.memeId);
      this._userVote.set(this.getVoteDirection(vote));
    } catch (error) {
      console.error('Error loading user vote:', error);
      this._userVote.set(null);
    }
  }

  async upvote(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this._isLoading()) return;
    this._isLoading.set(true);

    try {
      const response = await this.memeService.voteMeme(this.memeId, 1);
      this.updateUpVotes(response);
    } catch (error) {
      console.error('Error upvoting:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async downvote(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this._isLoading()) return;
    this._isLoading.set(true);

    try {
      const response = await this.memeService.voteMeme(this.memeId, -1);
      this.updateDownVotes(response);
    } catch (error) {
      console.error('Error upvoting:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  private updateUpVotes(response: VoteResponse): void {
    if (response.removed) {
      this._upvotes.update((current) => current - 1);
      this._userVote.set(null);
    } else {
      this._upvotes.update((current) => current + 1);
      this._userVote.set('up');
    }
  }

  private updateDownVotes(response: VoteResponse): void {
    if (response.removed) {
      this._downvotes.update((current) => current - 1);
      this._userVote.set(null);
    } else {
      this._downvotes.update((current) => current + 1);
      this._userVote.set('down');
    }
  }

  private getVoteDirection(vote: number): 'up' | 'down' | null {
    if (vote === 1) return 'up';
    if (vote === -1) return 'down';
    return null;
  }
}

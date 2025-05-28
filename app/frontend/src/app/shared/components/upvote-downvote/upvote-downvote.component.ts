import {
  Component,
  Input,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MemeService } from '../../../core/services/meme.service';
import { VoteResponse } from '../../models/meme.model';

type VoteType = 'up' | 'down' | null;
type VoteValue = 1 | -1 | 0;

@Component({
  selector: 'app-upvote-downvote',
  templateUrl: './upvote-downvote.component.html',
  standalone: true,
  imports: [],
  styleUrls: ['./upvote-downvote.component.css'],
})
export class UpvoteDownvoteComponent {
  @Input() memeId!: number;
  @Input() set upvotes(value: number) {
    this._upvotes.set(value);
  }
  @Input() set downvotes(value: number) {
    this._downvotes.set(value);
  }

  private readonly _upvotes = signal<number>(0);
  private readonly _downvotes = signal<number>(0);
  private readonly _userVote = signal<VoteType>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly upvotesSignal = this._upvotes.asReadonly();
  readonly downvotesSignal = this._downvotes.asReadonly();
  readonly userVote = this._userVote.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly disabledUp = computed(
    () => this._isLoading() || this._userVote() === 'down'
  );
  readonly disabledDown = computed(
    () => this._isLoading() || this._userVote() === 'up'
  );
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly memeService = inject(MemeService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const isLoggedIn = this.isLoggedIn();
      const memeId = this.memeId;

      if (isLoggedIn && memeId) {
        this.loadUserVote();
      } else {
        this.resetVoteState();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.resetVoteState();
    });
  }

  private async loadUserVote(): Promise<void> {
    try {
      const vote = await this.memeService.getUserVote(this.memeId);
      this._userVote.set(this.mapVoteValueToType(vote));
    } catch (error) {
      console.error('Error loading user vote:', error);
      this.resetVoteState();
    }
  }

  private mapVoteValueToType(vote: number): VoteType {
    if (vote === 1) {
      return 'up';
    }

    if (vote === -1) {
      return 'down';
    }

    return null;
  }

  async upvote(): Promise<void> {
    await this.handleVote(1);
  }

  async downvote(): Promise<void> {
    await this.handleVote(-1);
  }

  private async handleVote(voteValue: VoteValue): Promise<void> {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this._isLoading()) return;
    this._isLoading.set(true);

    try {
      const currentVote = await this.getCurrentUserVote();
      const response = await this.memeService.voteMeme(this.memeId, voteValue);
      this.updateVoteState(voteValue, currentVote, response);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  private async getCurrentUserVote(): Promise<number> {
    try {
      return await this.memeService.getUserVote(this.memeId);
    } catch {
      return 0;
    }
  }

  private updateVoteState(
    newVote: VoteValue,
    currentVote: number,
    response: VoteResponse
  ): void {
    const voteChange = response.removed ? -1 : 1;
    const isUpvote = newVote === 1;

    if (isUpvote) {
      this._upvotes.update((v) => v + voteChange);
      if (currentVote === -1 && !response.removed) {
        this._downvotes.update((v) => v - 1);
      }
    } else {
      this._downvotes.update((v) => v + voteChange);
      if (currentVote === 1 && !response.removed) {
        this._upvotes.update((v) => v - 1);
      }
    }

    if (response.removed) {
      this._userVote.set(null);
    } else {
      const newVoteType = isUpvote ? 'up' : 'down';
      this._userVote.set(newVoteType);
    }
  }

  private resetVoteState(): void {
    this._userVote.set(null);
    this._isLoading.set(false);
  }
}

import {
  Component,
  Input,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MemeService } from '../../../core/services/meme.service';
import { VoteResponse } from '../../models/meme.model';

type VoteType = 'up' | 'down' | 'none';
type VoteValue = 1 | -1 | 0;

const VOTE_TYPES = {
  UPVOTE: 'up' as const,
  DOWNVOTE: 'down' as const,
  NONE: 'none' as const,
} as const;

const VOTE_VALUES = {
  UP: 1,
  DOWN: -1,
  NONE: 0,
} as const;

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
  private readonly _userVote = signal<VoteType>(VOTE_TYPES.NONE);
  private readonly _isLoading = signal<boolean>(false);

  readonly upvotesSignal = this._upvotes.asReadonly();
  readonly downvotesSignal = this._downvotes.asReadonly();
  readonly userVote = this._userVote.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly disabledUp = computed(() => this._isLoading());
  readonly disabledDown = computed(() => this._isLoading());
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly memeService = inject(MemeService);

  constructor() {
    effect(() => {
      const isLoggedIn = this.isLoggedIn();

      if (isLoggedIn) {
        this.loadUserVote();
      } else {
        this._userVote.set(VOTE_TYPES.NONE);
      }
    });
  }

  private async loadUserVote(): Promise<void> {
    if (!this.memeId) return;

    try {
      const vote = await this.memeService.getUserVote(this.memeId);
      this._userVote.set(this.convertVoteValueToType(vote as VoteValue));
    } catch (error) {
      console.error('Error loading user vote:', error);
      this._userVote.set(VOTE_TYPES.NONE);
    }
  }

  async upvote(): Promise<void> {
    await this.handleVote(VOTE_TYPES.UPVOTE, VOTE_VALUES.UP);
  }

  async downvote(): Promise<void> {
    await this.handleVote(VOTE_TYPES.DOWNVOTE, VOTE_VALUES.DOWN);
  }

  private async handleVote(voteType: VoteType, voteValue: VoteValue): Promise<void> {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this._isLoading()) return;
    this._isLoading.set(true);

    try {
      const previousUserVote = this._userVote();
      const response = await this.memeService.voteMeme(this.memeId, voteValue);
      this.updateVoteState(response, voteType, previousUserVote);
    } catch (error) {
      console.error(`Error ${voteType}:`, error);
    } finally {
      this._isLoading.set(false);
    }
  }

  private updateVoteState(
    response: VoteResponse,
    newVoteType: VoteType,
    previousUserVote: VoteType
  ): void {
    if (response.removed) {
      this.handleVoteRemoval(previousUserVote);
    } else {
      this.handleVoteAddition(newVoteType, previousUserVote);
    }
  }

  private handleVoteRemoval(previousUserVote: VoteType): void {
    this._userVote.set(VOTE_TYPES.NONE);

    switch (previousUserVote) {
      case VOTE_TYPES.UPVOTE:
        this._upvotes.update(current => current - 1);
        break;
      case VOTE_TYPES.DOWNVOTE:
        this._downvotes.update(current => current - 1);
        break;
      case VOTE_TYPES.NONE:
        // No action needed
        break;
    }
  }

  private handleVoteAddition(newVoteType: VoteType, previousUserVote: VoteType): void {
    this._userVote.set(newVoteType);

    if (previousUserVote === VOTE_TYPES.NONE) {
      this.addNewVote(newVoteType);
    } else if (previousUserVote !== newVoteType) {
      this.switchVote(newVoteType);
    }
  }

   private addNewVote(voteType: VoteType): void {
    switch (voteType) {
      case VOTE_TYPES.UPVOTE:
        this._upvotes.update(current => current + 1);
        break;
      case VOTE_TYPES.DOWNVOTE:
        this._downvotes.update(current => current + 1);
        break;
      case VOTE_TYPES.NONE:
        // No action needed
        break;
    }
  }

  private switchVote(newVoteType: VoteType): void {
    switch (newVoteType) {
      case VOTE_TYPES.UPVOTE:
        this._upvotes.update(current => current + 1);
        this._downvotes.update(current => current - 1);
        break;
      case VOTE_TYPES.DOWNVOTE:
        this._downvotes.update(current => current + 1);
        this._upvotes.update(current => current - 1);
        break;
      case VOTE_TYPES.NONE:
        // No action needed
        break;
    }
  }

  private convertVoteValueToType(vote: number): VoteType {
    switch (vote) {
      case VOTE_VALUES.UP:
        return VOTE_TYPES.UPVOTE;
      case VOTE_VALUES.DOWN:
        return VOTE_TYPES.DOWNVOTE;
      default:
        return VOTE_TYPES.NONE;
    }
  }
}

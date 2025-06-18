import { Component, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';
import { CommentSectionComponent } from '../../shared/components/comment-section/comment-section.component';
import { UpvoteDownvoteComponent } from '../../shared/components/upvote-downvote/upvote-downvote.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-meme-details',
  templateUrl: './meme-details.component.html',
  standalone: true,
  imports: [
    CommentSectionComponent,
    UpvoteDownvoteComponent,
    RouterModule,
    DatePipe,
  ],
  styleUrls: ['./meme-details.component.css'],
})
export class MemeDetailsComponent {
  private readonly _memeId = signal<number>(0);
  private readonly _meme = signal<Meme | null>(null);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _error = signal<boolean>(false);

  readonly memeId = this._memeId.asReadonly();
  readonly meme = this._meme.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly pageTitle = computed(() => {
    const meme = this._meme();
    return meme ? `Meme: ${meme.tag}` : 'Caricamento...';
  });

  private readonly route = inject(ActivatedRoute);
  private readonly memeService = inject(MemeService);

  constructor() {
    effect(() => {
      const memeId = this._memeId();
      if (memeId > 0) {
        this.loadMeme();
      }
    });

    this.route.params.subscribe((params) => {
      const id = parseInt(params['memeId']);
      this._memeId.set(id);
    });
  }

  async loadMeme(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(false);

    try {
      const meme = await this.memeService.getMemeById(this.memeId());
      this._meme.set(meme);
    } catch (err) {
      console.error('Error loading meme:', err);
      this._error.set(true);
    } finally {
      this._isLoading.set(false);
    }
  }
}

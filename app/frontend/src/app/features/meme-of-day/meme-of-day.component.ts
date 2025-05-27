import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';
import { UpvoteDownvoteComponent } from "../../shared/components/upvote-downvote/upvote-downvote.component";
import { CommentSectionComponent } from "../../shared/components/comment-section/comment-section.component";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-meme-of-day',
  templateUrl: './meme-of-day.component.html',
  standalone: true,
  imports: [UpvoteDownvoteComponent, CommentSectionComponent, DatePipe],
  styleUrls: ['./meme-of-day.component.css']
})
export class MemeOfDayComponent implements OnInit {
  private readonly _memeOfDay = signal<Meme | null>(null);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _error = signal<boolean>(false);

  readonly memeOfDay = this._memeOfDay.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasValidMeme = computed(() => {
    const meme = this._memeOfDay();
    return meme !== null && !this._error();
  });

  readonly memeTitle = computed(() => {
    const meme = this._memeOfDay();
    return meme ? `Meme del giorno: ${meme.tag}` : 'Meme del Giorno';
  });

  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    this.loadMemeOfDay();
  }

  async loadMemeOfDay(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(false);

    try {
      const meme = await this.memeService.getMemeOfTheDay();
      this._memeOfDay.set(meme);
    }
    catch(error){
      console.error('Error loading meme of the day:', error);
      this._error.set(true);
    }
    finally {
      this._isLoading.set(false);
    }
  }

}
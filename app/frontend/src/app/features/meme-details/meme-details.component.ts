import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';
import { CommentSectionComponent } from "../../shared/components/comment-section/comment-section.component";
import { UpvoteDownvoteComponent } from "../../shared/components/upvote-downvote/upvote-downvote.component";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-meme-details',
  templateUrl: './meme-details.component.html',
  standalone: true,
  imports: [CommentSectionComponent, UpvoteDownvoteComponent, RouterModule, DatePipe],
  styleUrls: ['./meme-details.component.css']
})
export class MemeDetailsComponent {
  memeId: number = 0;
  meme: Meme | null = null;
  isLoading = true;
  error = false;

  private readonly route = inject(ActivatedRoute);
  private readonly memeService = inject(MemeService);

  constructor() {
    this.route.params
      .subscribe(params => {
        this.memeId = params['memeId'];
        this.loadMeme();
      });
  }

  async loadMeme(): Promise<void> {
    this.isLoading = true;
    this.error = false;

    try {
      this.meme = await this.memeService.getMemeById(this.memeId);
    } catch (err) {
      console.error('Error loading meme:', err);
      this.error = true;
    } finally {
      this.isLoading = false;
    }
  }

}

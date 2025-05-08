import { Component, inject, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';
import { CommonModule } from '@angular/common';
import { UpvoteDownvoteComponent } from "../../shared/components/upvote-downvote/upvote-downvote.component";
import { CommentSectionComponent } from "../../shared/components/comment-section/comment-section.component";

@Component({
  selector: 'app-meme-of-day',
  templateUrl: './meme-of-day.component.html',
  standalone: true,
  imports: [CommonModule, UpvoteDownvoteComponent, CommentSectionComponent],
  styleUrls: ['./meme-of-day.component.css']
})
export class MemeOfDayComponent implements OnInit {
  memeOfDay: Meme | null = null;
  isLoading = true;

  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    this.loadMemeOfDay();
  }

  async loadMemeOfDay(): Promise<void> {
    this.isLoading = true;
    try {
      this.memeOfDay = await this.memeService.getMemeOfTheDay();
    }
    catch(error){
      console.error('Error loading meme of the day:', error);
    }
    finally {
      this.isLoading = false;
    }
  }

}
import { Component, inject, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  memes: Meme[] = [];
  sortBy = 'newest';
  filterBy = '';
  isLoading = true;

  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    this.loadMemes();
  }

  loadMemes(): void {
    this.isLoading = true;
    this.memeService.getAllMemes(this.sortBy, this.filterBy).subscribe({
      next: (data) => {
        this.memes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading memes:', error);
        this.isLoading = false;
      }
    });
  }

  handleFilterChange(filters: any): void {
    this.sortBy = filters.sortBy;

    // Process tags if any
    if (filters.tags) {
      const tagsArray = filters.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      if (tagsArray.length > 0) {
        this.filterBy = tagsArray.join(',');
      } else {
        this.filterBy = '';
      }
    } else {
      this.filterBy = '';
    }

    this.loadMemes();
  }

  upvoteMeme(memeId: string): void {
    this.memeService.upvoteMeme(memeId).subscribe({
      next: (updatedMeme) => {
        const index = this.memes.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.memes[index] = updatedMeme;
        }
      },
      error: (error) => console.error('Error upvoting meme:', error)
    });
  }

  downvoteMeme(memeId: string): void {
    this.memeService.downvoteMeme(memeId).subscribe({
      next: (updatedMeme) => {
        const index = this.memes.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.memes[index] = updatedMeme;
        }
      },
      error: (error) => console.error('Error downvoting meme:', error)
    });
  }
}

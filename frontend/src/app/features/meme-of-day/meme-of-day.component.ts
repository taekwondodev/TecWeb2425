import { Component, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.services';
import { Meme } from '../../shared/models/meme.models';

@Component({
  selector: 'app-meme-of-day',
  templateUrl: './meme-of-day.component.html',
  styleUrls: ['./meme-of-day.component.scss']
})
export class MemeOfDayComponent implements OnInit {
  memeOfDay: Meme | null = null;
  isLoading = true;
  
  constructor(private memeService: MemeService) {}
  
  ngOnInit(): void {
    this.loadMemeOfDay();
  }
  
  loadMemeOfDay(): void {
    this.isLoading = true;
    this.memeService.getMemeOfTheDay().subscribe({
      next: (meme) => {
        this.memeOfDay = meme;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading meme of the day:', error);
        this.isLoading = false;
      }
    });
  }
  
  upvoteMeme(): void {
    if (!this.memeOfDay) return;
    
    this.memeService.upvoteMeme(this.memeOfDay.id).subscribe({
      next: (updatedMeme) => {
        this.memeOfDay = updatedMeme;
      },
      error: (error) => console.error('Error upvoting meme:', error)
    });
  }
  
  downvoteMeme(): void {
    if (!this.memeOfDay) return;
    
    this.memeService.downvoteMeme(this.memeOfDay.id).subscribe({
      next: (updatedMeme) => {
        this.memeOfDay = updatedMeme;
      },
      error: (error) => console.error('Error downvoting meme:', error)
    });
  }
}
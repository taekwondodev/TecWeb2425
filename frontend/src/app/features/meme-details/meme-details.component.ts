import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MemeService } from '../../core/services/meme.services';
import { Meme } from '../../shared/models/meme.models';

@Component({
  selector: 'app-meme-details',
  templateUrl: './meme-details.component.html',
  styleUrls: ['./meme-details.component.scss']
})
export class MemeDetailsComponent implements OnInit {
  memeId: string = '';
  meme: Meme | null = null;
  isLoading = true;
  error = false;
  
  constructor(
    private route: ActivatedRoute,
    private memeService: MemeService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.memeId = params['id'];
      this.loadMeme();
    });
  }
  
  loadMeme(): void {
    this.isLoading = true;
    this.error = false;
    
    this.memeService.getMemeById(this.memeId).subscribe({
      next: (data) => {
        this.meme = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading meme:', err);
        this.isLoading = false;
        this.error = true;
      }
    });
  }
  
  upvoteMeme(): void {
    if (!this.meme) return;
    
    this.memeService.upvoteMeme(this.meme.id).subscribe({
      next: (updatedMeme) => {
        this.meme = updatedMeme;
      },
      error: (error) => console.error('Error upvoting meme:', error)
    });
  }
  
  downvoteMeme(): void {
    if (!this.meme) return;
    
    this.memeService.downvoteMeme(this.meme.id).subscribe({
      next: (updatedMeme) => {
        this.meme = updatedMeme;
      },
      error: (error) => console.error('Error downvoting meme:', error)
    });
  }
}

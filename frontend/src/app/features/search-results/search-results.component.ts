import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MemeService } from '../../core/services/meme.service';
import { Meme } from '../../shared/models/meme.model';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  searchQuery: string = '';
  searchResults: Meme[] = [];
  isLoading = true;
  noResults = false;
  currentFilters: any = {
    sortBy: 'newest',
    tags: '',
    dateFrom: '',
    dateTo: ''
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memeService: MemeService
  ) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      
      if (params['sortBy']) {
        this.currentFilters.sortBy = params['sortBy'];
      }
      
      if (params['tags']) {
        this.currentFilters.tags = params['tags'];
      }
      
      if (this.searchQuery) {
        this.performSearch();
      } else {
        this.router.navigate(['/']);
      }
    });
  }
  
  performSearch(): void {
    this.isLoading = true;
    this.noResults = false;
    
    // Parse tags if any
    let tags: string[] = [];
    if (this.currentFilters.tags) {
      tags = this.currentFilters.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    }
    
    this.memeService.searchMemes(this.searchQuery, tags).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
        this.noResults = results.length === 0;
      },
      error: (error) => {
        console.error('Error searching memes:', error);
        this.isLoading = false;
        this.noResults = true;
      }
    });
  }
  
  handleFilterChange(filters: any): void {
    this.currentFilters = { ...filters };
    
    // Update URL with new filters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        query: this.searchQuery,
        sortBy: filters.sortBy,
        tags: filters.tags
      },
      queryParamsHandling: 'merge'
    });
    
    this.performSearch();
  }
  
  upvoteMeme(memeId: string): void {
    this.memeService.upvoteMeme(memeId).subscribe({
      next: (updatedMeme) => {
        const index = this.searchResults.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.searchResults[index] = updatedMeme;
        }
      },
      error: (error) => console.error('Error upvoting meme:', error)
    });
  }
  
  downvoteMeme(memeId: string): void {
    this.memeService.downvoteMeme(memeId).subscribe({
      next: (updatedMeme) => {
        const index = this.searchResults.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.searchResults[index] = updatedMeme;
        }
      },
      error: (error) => console.error('Error downvoting meme:', error)
    });
  }
}

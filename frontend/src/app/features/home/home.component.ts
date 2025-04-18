import { Component, inject, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { GetMemeResponse, VoteResponse } from '../../shared/models/meme.model';
import { CommonModule } from '@angular/common';
import { SearchFilterComponent } from "../../shared/components/search-filter/search-filter.component";
import { MemeCardComponent } from "../../shared/components/meme-card/meme-card.component";
import { PaginatorComponent } from "../../shared/components/paginator/paginator.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule, SearchFilterComponent, MemeCardComponent, PaginatorComponent],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  memeResponse: GetMemeResponse | null = null;
  currentPage = 1;
  pageSize = 10;
  sortBy = 'newest';
  filterOptions = {
    dateFrom: '',
    dateTo: '',
    tags: [] as string[]
  };
  isLoading = true;

  private readonly memeService = inject(MemeService);

  ngOnInit(): void {
    this.loadMemes();
  }

  loadMemes(): void {
    this.isLoading = true;
    this.memeService.getMemes(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.filterOptions
    ).subscribe({
      next: (response) => {
        this.memeResponse = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading memes:', error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMemes();
  }

  handleFilterChange(filters: any): void {
    this.currentPage = 1; // Reset alla prima pagina quando cambiano i filtri
    this.sortBy = filters.sortBy;
    this.filterOptions = {
      dateFrom: filters.dateFrom ?? '',
      dateTo: filters.dateTo ?? '',
      tags: filters.tags ? filters.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : []
    };

    this.loadMemes();
  }

  upvoteMeme(memeId: number): void {
    this.memeService.voteMeme(memeId, 1).subscribe({
      next: (response) => {
        if (!this.memeResponse) return;
        const index = this.memeResponse.memes.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.updateMemeUpvote(response, index);
        }
      },
      error: (error) => console.error('Error upvoting meme:', error)
    });
  }

  downvoteMeme(memeId: number): void {
    this.memeService.voteMeme(memeId, -1).subscribe({
      next: (updatedMeme) => {
        if (!this.memeResponse) return;
        const index = this.memeResponse.memes.findIndex(m => m.id === memeId);
        if (index !== -1) {
          this.updateMemeDownvote(updatedMeme, index);
        }
      },
      error: (error) => console.error('Error downvoting meme:', error)
    });
  }

  updateMemeUpvote(response: VoteResponse, index: number): void {
    if (!this.memeResponse) return;

    if (response.removed) {
      this.memeResponse.memes[index] = {
        ...this.memeResponse.memes[index],
        upvotes: this.memeResponse.memes[index].upvotes - 1,
        downvotes: this.memeResponse.memes[index].downvotes,
        createdAt: this.memeResponse.memes[index].createdAt,
        createdBy: this.memeResponse.memes[index].createdBy
      };
    } else {
      this.memeResponse.memes[index] = {
        ...this.memeResponse.memes[index],
        upvotes: this.memeResponse.memes[index].upvotes + 1,
        downvotes: this.memeResponse.memes[index].downvotes,
        createdAt: this.memeResponse.memes[index].createdAt,
        createdBy: this.memeResponse.memes[index].createdBy
      };
    }
  }

  updateMemeDownvote(response: VoteResponse, index: number): void {
    if (!this.memeResponse) return;

    if (response.removed) {
      this.memeResponse.memes[index] = {
        ...this.memeResponse.memes[index],
        downvotes: this.memeResponse.memes[index].downvotes - 1,
        createdAt: this.memeResponse.memes[index].createdAt,
        createdBy: this.memeResponse.memes[index].createdBy
      };
    } else {
      this.memeResponse.memes[index] = {
        ...this.memeResponse.memes[index],
        downvotes: this.memeResponse.memes[index].downvotes + 1,
        createdAt: this.memeResponse.memes[index].createdAt,
        createdBy: this.memeResponse.memes[index].createdBy
      };
    }
  }
}

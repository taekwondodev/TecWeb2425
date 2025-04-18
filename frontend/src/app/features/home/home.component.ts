import { Component, inject, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { GetMemeResponse } from '../../shared/models/meme.model';
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

  async loadMemes(): Promise<void>{
    this.isLoading = true;
    try {
      this.memeResponse = await this.memeService.getMemes(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.filterOptions
      );
    } catch (error) {
      console.error('Error loading memes:', error);
    } finally {
      this.isLoading = false;
    }
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

}

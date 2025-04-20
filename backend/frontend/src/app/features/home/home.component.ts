import { Component, inject, OnInit } from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { GetMemeResponse } from '../../shared/models/meme.model';
import { CommonModule } from '@angular/common';
import { SearchFilterComponent } from "../../shared/components/search-filter/search-filter.component";
import { MemeCardComponent } from "../../shared/components/meme-card/meme-card.component";
import { PaginatorComponent } from "../../shared/components/paginator/paginator.component";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule, SearchFilterComponent, MemeCardComponent, PaginatorComponent],
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  memeResponse: GetMemeResponse | null = null;
  currentPage = 1;
  pageSize = 10;
  isLoading = true;
  searchQuery = '';

  activeFilters = {
    sortBy: 'newest',
    tags: [] as string[],
    dateFrom: '',
    dateTo: ''
  };

  private readonly memeService = inject(MemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] ?? '';
      this.currentPage = parseInt(params['page']) || 1;

      // Aggiorna i filtri dai query params
      this.activeFilters = {
        sortBy: params['sortBy'] ?? 'newest',
        tags: params['tags'] ? params['tags'].split(',') : [],
        dateFrom: params['dateFrom'] ?? '',
        dateTo: params['dateTo'] ?? ''
      };

      this.loadMemes();
    });
  }

  async loadMemes(): Promise<void> {
    this.isLoading = true;
    // perchè se modifico direttamente activeFilters loop infinito
    const tagsWithQuery = [...this.activeFilters.tags];
    if (this.searchQuery) {
      tagsWithQuery.unshift(this.searchQuery);
    }

    try {
      this.memeResponse = await this.memeService.getMemes(
        this.currentPage,
        this.pageSize,
        this.activeFilters.sortBy,
        {
          tags: tagsWithQuery,
          dateFrom: this.activeFilters.dateFrom,
          dateTo: this.activeFilters.dateTo
        }
      );
    } catch (error) {
      console.error('Error loading memes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrl();
  }

  onFilterChange(filters: any): void {
    this.currentPage = 1; // Reset alla prima pagina
    this.activeFilters = {
      sortBy: filters.sortBy,
      tags: filters.tags,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    };
    this.updateUrl();
  }

  private updateUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: this.searchQuery || null,
        page: this.currentPage > 1 ? this.currentPage : null,
        sortBy: this.activeFilters.sortBy !== 'newest' ? this.activeFilters.sortBy : null,
        tags: this.activeFilters.tags.length > 0 ? this.activeFilters.tags.join(',') : null,
        dateFrom: this.activeFilters.dateFrom || null,
        dateTo: this.activeFilters.dateTo || null
      },
      queryParamsHandling: 'merge'
    });
  }

}

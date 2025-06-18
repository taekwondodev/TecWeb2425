import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { MemeService } from '../../core/services/meme.service';
import { GetMemeResponse } from '../../shared/models/meme.model';
import { SearchFilterComponent } from '../../shared/components/search-filter/search-filter.component';
import { MemeCardComponent } from '../../shared/components/meme-card/meme-card.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ActivatedRoute, Router } from '@angular/router';

interface ActiveFilters {
  sortBy: string;
  tags: string[];
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [SearchFilterComponent, MemeCardComponent, PaginatorComponent],
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  private readonly _memeResponse = signal<GetMemeResponse | null>(null);
  private readonly _currentPage = signal<number>(1);
  private readonly _pageSize = signal<number>(10);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _searchQuery = signal<string>('');
  private readonly _activeFilters = signal<ActiveFilters>({
    sortBy: 'newest',
    tags: [],
    dateFrom: '',
    dateTo: '',
  });

  readonly memeResponse = this._memeResponse.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly activeFilters = this._activeFilters.asReadonly();

  readonly hasResults = computed(() => {
    const response = this._memeResponse();
    return response?.memes && response.memes.length > 0;
  });

  readonly showPagination = computed(() => {
    const response = this._memeResponse();
    return response?.totalPages && response.totalPages > 1;
  });

  private readonly memeService = inject(MemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    // effect per ricaricare i meme quando cambiano i parametri
    effect(() => {
      this._currentPage();
      this._activeFilters();
      this._searchQuery();

      this.loadMemes();
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this._searchQuery.set(params['query'] ?? '');
      this._currentPage.set(parseInt(params['page']) || 1);

      // Aggiorna i filtri dai query params
      this._activeFilters.set({
        sortBy: params['sortBy'] ?? 'newest',
        tags: params['tags'] ? params['tags'].split(',') : [],
        dateFrom: params['dateFrom'] ?? '',
        dateTo: params['dateTo'] ?? '',
      });
    });
  }

  async loadMemes(): Promise<void> {
    this._isLoading.set(true);

    // perchè se modifico direttamente activeFilters loop infinito
    const filters = this._activeFilters();
    const tagsWithQuery = [...filters.tags];
    const searchQuery = this._searchQuery();

    if (searchQuery) {
      tagsWithQuery.unshift(searchQuery);
    }

    try {
      const response = await this.memeService.getMemes(
        this._currentPage(),
        this._pageSize(),
        filters.sortBy,
        {
          tags: tagsWithQuery,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }
      );

      this._memeResponse.set(response);
    } catch (error) {
      console.error('Error loading memes:', error);
      this._memeResponse.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  onPageChange(page: number): void {
    this._currentPage.set(page);
    this.updateUrl();
  }

  onFilterChange(filters: any): void {
    this._currentPage.set(1); // Reset alla prima pagina
    this._activeFilters.set({
      sortBy: filters.sortBy,
      tags: filters.tags,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    this.updateUrl();
  }

  private updateUrl(): void {
    const filters = this._activeFilters();
    const searchQuery = this._searchQuery();
    const currentPage = this._currentPage();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: searchQuery ?? null,
        page: currentPage > 1 ? currentPage : null,
        sortBy: filters.sortBy !== 'newest' ? filters.sortBy : null,
        tags: filters.tags.length > 0 ? filters.tags.join(',') : null,
        dateFrom: filters.dateFrom ?? null,
        dateTo: filters.dateTo ?? null,
      },
      queryParamsHandling: 'merge',
    });
  }
}

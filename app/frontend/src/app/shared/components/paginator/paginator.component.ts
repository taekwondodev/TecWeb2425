import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {
  @Input() set currentPage(value: number) {
    this._currentPage.set(value);
  }
  @Input() set totalPages(value: number) {
    this._totalPages.set(value);
  }
  @Output() pageChange = new EventEmitter<number>();

  private readonly _currentPage = signal(1);
  private readonly _totalPages = signal(1);

  readonly currentPageSignal = this._currentPage.asReadonly();

  readonly visiblePages = computed(() => {
    const currentPage = this._currentPage();
    const totalPages = this._totalPages();
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  readonly showEllipsis = computed(() => {
    const totalPages = this._totalPages();
    const currentPage = this._currentPage();
    return totalPages > 5 && currentPage < totalPages - 2;
  });

  changePage(page: number): void {
    const currentPage = this._currentPage();
    const totalPages = this._totalPages();
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      this.pageChange.emit(page);
    }
  }
}
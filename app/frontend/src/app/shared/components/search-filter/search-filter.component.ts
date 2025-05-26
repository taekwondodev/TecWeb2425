import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent {
  @Output() filterChange = new EventEmitter<any>();

  filterForm: FormGroup;
  searchQuery = '';

  sortOptions = [
    { value: 'newest', label: 'Più recenti' },
    { value: 'oldest', label: 'Più vecchi' },
    { value: 'upvotes', label: 'Più votati' },
    { value: 'downvotes', label: 'Meno votati' },
  ];

  private readonly fb = inject(FormBuilder);

  constructor() {
    this.filterForm = this.fb.group({
      sortBy: ['newest'],
      tags: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    
    const filters = {
      sortBy: formValue.sortBy,
      tags: formValue.tags 
            ? formValue.tags.split(',')
                .map((t: string) => t.trim())
                .filter((t: string) => t.length > 0 && t.length <= 50)
                .slice(0, 10)
            : [],
      dateFrom: formValue.dateFrom 
        ? new Date(formValue.dateFrom).toISOString().split('T')[0] 
        : '',
      dateTo: formValue.dateTo 
        ? new Date(formValue.dateTo).toISOString().split('T')[0] 
        : ''
    };

    this.filterChange.emit(filters);
  }

  resetFilters(): void {
    this.filterForm.reset({
      sortBy: 'newest',
      tags: '',
      dateFrom: '',
      dateTo: ''
    });
    this.applyFilters();
  }
}

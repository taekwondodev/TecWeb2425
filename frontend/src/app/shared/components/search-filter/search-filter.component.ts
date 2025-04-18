import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent {
  @Output() filterChange = new EventEmitter<{
    sortBy: string;
    tags?: string;
    dateFrom?: string;
    dateTo?: string;
  }>();

  filterForm: FormGroup;

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
    
    // Converte le date in formato ISO (YYYY-MM-DD) se presenti
    const filters = {
      sortBy: formValue.sortBy,
      tags: formValue.tags,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom).toISOString().split('T')[0] : '',
      dateTo: formValue.dateTo ? new Date(formValue.dateTo).toISOString().split('T')[0] : ''
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

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<any>();
  filterForm: FormGroup;
  
  sortOptions = [
    { value: 'newest', label: 'Più recenti' },
    { value: 'oldest', label: 'Più vecchi' },
    { value: 'mostUpvoted', label: 'Più votati' },
    { value: 'mostCommented', label: 'Più commentati' }
  ];
  
  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      sortBy: ['newest'],
      tags: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }
  
  ngOnInit(): void {
    this.filterForm.valueChanges.subscribe(values => {
      this.filterChange.emit(values);
    });
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      sortBy: 'newest',
      tags: '',
      dateFrom: '',
      dateTo: ''
    });
    this.filterChange.emit(this.filterForm.value);
  }
}

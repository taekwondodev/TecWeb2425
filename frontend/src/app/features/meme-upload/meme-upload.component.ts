import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MemeService } from '../../core/services/meme.services';

@Component({
  selector: 'app-meme-upload',
  templateUrl: './meme-upload.component.html',
  styleUrls: ['./meme-upload.component.scss']
})
export class MemeUploadComponent {
  uploadForm: FormGroup;
  isSubmitting = false;
  uploadError = '';
  imagePreview: string | ArrayBuffer | null = null;
  
  constructor(
    private fb: FormBuilder,
    private memeService: MemeService,
    private router: Router
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      image: [null, Validators.required],
      tags: this.fb.array([this.createTag()])
    });
  }
  
  get tagsArray(): FormArray {
    return this.uploadForm.get('tags') as FormArray;
  }
  
  createTag(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required]
    });
  }
  
  addTag(): void {
    this.tagsArray.push(this.createTag());
  }
  
  removeTag(index: number): void {
    if (this.tagsArray.length > 1) {
      this.tagsArray.removeAt(index);
    }
  }
  
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    
    if (file) {
      // Update form value
      this.uploadForm.patchValue({ image: file });
      this.uploadForm.get('image')?.updateValueAndValidity();
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  uploadMeme(): void {
    if (this.uploadForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.uploadForm);
      return;
    }
    
    this.isSubmitting = true;
    this.uploadError = '';
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', this.uploadForm.get('title')?.value);
    formData.append('image', this.uploadForm.get('image')?.value);
    
    // Extract tags from form array
    const tags = this.tagsArray.controls.map(control => control.get('name')?.value);
    tags.forEach((tag, index) => {
      formData.append(`tags[${index}]`, tag);
    });
    
    this.memeService.uploadMeme(formData).subscribe({
      next: (meme) => {
        this.isSubmitting = false;
        this.router.navigate(['/meme', meme.id]);
      },
      error: (error) => {
        console.error('Error uploading meme:', error);
        this.isSubmitting = false;
        this.uploadError = 'Si è verificato un errore durante il caricamento. Riprova più tardi.';
      }
    });
  }
  
  // Helper method to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          } else {
            c.markAsTouched();
          }
        });
      }
    });
  }
}
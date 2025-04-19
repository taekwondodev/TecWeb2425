import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemeService } from '../../core/services/meme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meme-upload',
  templateUrl: './meme-upload.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./meme-upload.component.scss']
})
export class MemeUploadComponent {
  uploadForm: FormGroup;
  isSubmitting = false;
  uploadError: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  tag = '';

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly memeService: MemeService = inject(MemeService);
  private readonly router: Router = inject(Router);

  constructor() {
    this.uploadForm = this.fb.group({
      image: [null, Validators.required],
      tag: ['', Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const imageTypeRegex = /image\/(jpeg|png|gif)/;
      if (!imageTypeRegex.exec(file.type)) {
        this.uploadError = 'Formato file non supportato. Usa JPG, PNG o GIF.';
        input.value = ''; // Resetta l'input file
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.uploadError = 'L\'immagine è troppo grande (max 10MB)';
        input.value = '';
        return;
      }

      this.uploadForm.patchValue({ image: file });
      this.uploadForm.get('image')?.updateValueAndValidity();
      this.uploadError = null;

      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadMeme(): Promise<void> {
    if (this.uploadForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.uploadForm);
      return;
    }

    this.isSubmitting = true;
    this.uploadError = null;

    try {
      const formData = new FormData();
      formData.append('image', this.uploadForm.get('image')?.value);
      formData.append('tag', this.uploadForm.get('tag')?.value);

      const meme = await this.memeService.uploadMeme(
        this.uploadForm.get('image')?.value,
        this.uploadForm.get('tag')?.value
      );

      await this.router.navigate(['/meme', meme.memeId]);
    } catch (error: any) {
      console.error('Upload error:', error);
      this.uploadError = error.message ?? 'Errore durante il caricamento. Riprova.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
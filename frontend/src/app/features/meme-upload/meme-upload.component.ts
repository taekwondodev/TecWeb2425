import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemeService } from '../../core/services/meme.service';

@Component({
  selector: 'app-meme-upload',
  templateUrl: './meme-upload.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrls: ['./meme-upload.component.css']
})
export class MemeUploadComponent {
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _uploadError = signal<string | null>(null);
  private readonly _imagePreview = signal<string | ArrayBuffer | null>(null);
  private readonly _tag = signal<string>('');

  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly uploadError = this._uploadError.asReadonly();
  readonly imagePreview = this._imagePreview.asReadonly();
  readonly tag = this._tag.asReadonly();

  uploadForm: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly memeService = inject(MemeService);
  private readonly router = inject(Router);

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
        this._uploadError.set('Formato file non supportato. Usa JPG, PNG o GIF.');
        input.value = ''; // Resetta l'input file
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this._uploadError.set('L\'immagine è troppo grande (max 10MB)');
        input.value = '';
        return;
      }

      this.uploadForm.patchValue({ image: file });
      this.uploadForm.get('image')?.updateValueAndValidity();
      this._uploadError.set(null);

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        this._imagePreview.set(e.target?.result ?? null);
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadMeme(): Promise<void> {
    if (this.uploadForm.invalid || this._isSubmitting()) {
      this.markFormGroupTouched(this.uploadForm);
      return;
    }

    this._isSubmitting.set(true);
    this._uploadError.set(null);

    try {
      const meme = await this.memeService.uploadMeme(
        this.uploadForm.get('image')?.value,
        this.uploadForm.get('tag')?.value
      );

      await this.router.navigate(['/meme', meme.memeId]);
    } catch (error: any) {
      console.error('Upload error:', error);
      this._uploadError.set(error.message ?? 'Errore durante il caricamento. Riprova.');
    } finally {
      this._isSubmitting.set(false);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly _loading = signal<boolean>(false);
  private readonly _submitted = signal<boolean>(false);
  private readonly _error = signal<string>('');

  readonly loading = this._loading.asReadonly();
  readonly submitted = this._submitted.asReadonly();
  readonly error = this._error.asReadonly();

  readonly canSubmit = computed(() => !this._loading() && this.registerForm?.valid);
  readonly showValidationErrors = computed(() => this._submitted() && this.registerForm?.invalid);

  registerForm!: FormGroup;

  constructor() {
    this.registerForm = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }

  async onSubmit(): Promise<void> {
    this._submitted.set(true);
    this._error.set('');

    if (this.registerForm.invalid) {
      return;
    }

    this._loading.set(true);
    try {
      const registerRequest: RegisterRequest = {
        username: this.username!.value,
        email: this.email!.value,
        password: this.password!.value
      };

      await this.authService.register(registerRequest);
      await this.router.navigate(
        ['/login'],
        {
          state: {
            username: this.username!.value,
            password: this.password!.value,
          }
        }
      );
    } catch (error: any) {
      this._error.set(error.error?.message ?? 'Registrazione fallita');
    } finally {
      this._loading.set(false);
    }
  }

}
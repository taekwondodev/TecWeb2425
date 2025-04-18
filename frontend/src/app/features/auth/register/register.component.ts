import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../shared/models/auth.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

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
    this.submitted = true;
    this.error = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    try {
      const registerRequest: RegisterRequest = {
        username: this.username!.value,
        email: this.email!.value,
        password: this.password!.value
      };

      await this.authService.register(registerRequest);
      await this.router.navigate(
        ['/login'],
        { state: { username: this.username!.value } }
      );
    } catch (error: any) {
      this.error = error.error?.message ?? 'Registrazione fallita';
    } finally {
      this.loading = false;
    }
  }

}
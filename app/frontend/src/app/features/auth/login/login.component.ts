import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { CommonModule } from '@angular/common';
import { FlashService } from '../../../core/services/flash.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly flashService = inject(FlashService);

  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  autofilled = false;
  error = '';
  returnUrl: string = '/';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });

    const state = history.state;
    if (state?.username && state?.password) {
      this.loginForm.patchValue({
        username: state.username,
        password: state.password
      });
      this.autofilled = true;
    }
  }

  get username() { return this.loginForm.get('username'); }

  get password() { return this.loginForm.get('password'); }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    try {
      const loginRequest: LoginRequest = {
        username: this.username!.value,
        password: this.password!.value
      };

      await this.authService.login(loginRequest);
      await this.router.navigate([this.returnUrl]);
      this.flashService.showMessage('Login avvenuto con successo!', 'login');
    } catch (error: any) {
      this.error = error.error?.message ?? 'Login failed';
    } finally {
      this.loading = false;
    }
  }

}
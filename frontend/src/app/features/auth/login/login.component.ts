import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { FlashService } from '../../../core/services/flash.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly flashService = inject(FlashService);

  private readonly _loading = signal<boolean>(false);
  private readonly _submitted = signal<boolean>(false);
  private readonly _autofilled = signal<boolean>(false);
  private readonly _error = signal<string>('');
  private readonly _returnUrl = signal<string>('/');

  readonly loading = this._loading.asReadonly();
  readonly submitted = this._submitted.asReadonly();
  readonly autofilled = this._autofilled.asReadonly();
  readonly error = this._error.asReadonly();
  readonly returnUrl = this._returnUrl.asReadonly();

  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());
  readonly canSubmit = computed(() => !this._loading() && this.loginForm?.valid);

  loginForm!: FormGroup;

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
      this._autofilled.set(true);
    }
  }

  get username() { return this.loginForm.get('username'); }

  get password() { return this.loginForm.get('password'); }

  async onSubmit(): Promise<void> {
    this._submitted.set(true);
    this._error.set('');

    if (this.loginForm.invalid) {
      return;
    }

    this._loading.set(true);

    try {
      const loginRequest: LoginRequest = {
        username: this.username!.value,
        password: this.password!.value
      };

      await this.authService.login(loginRequest);
      await this.router.navigate([this.returnUrl()]);
      this.flashService.showMessage('Login avvenuto con successo!', 'login');
    } catch (error: any) {
      this._error.set(error.error?.message ?? 'Login failed');
    } finally {
      this._loading.set(false);
    }
  }

}
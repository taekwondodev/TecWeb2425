import { Injectable, signal } from '@angular/core';

export interface FlashState {
  message: string;
  visible: boolean;
  type?: 'login' | 'logout';
}

@Injectable({ providedIn: 'root' })
export class FlashService {
  private timeoutId: number | null = null;
  private readonly _flashState = signal<FlashState>({
    message: '',
    visible: false
  });
  readonly flashState = this._flashState.asReadonly();

  showMessage(
    message: string, 
    type: 'login' | 'logout', 
    duration = 3000
  ): void {
    this.clearTimeout();
    
    this._flashState.set({ 
      message, 
      visible: true, 
      type 
    });
    
    this.timeoutId = window.setTimeout(() => {
      this._flashState.update(current => ({ 
        ...current, 
        visible: false 
      }));
    }, duration);
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
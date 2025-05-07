import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FlashState {
  message: string;
  visible: boolean;
  type?: 'login' | 'logout';
}

@Injectable({ providedIn: 'root' })
export class FlashService {
  private timeoutId: number | null = null;
  private readonly _state = new BehaviorSubject<FlashState>({
    message: '',
    visible: false
  });
  readonly state$ = this._state.asObservable();

  showMessage(
    message: string, 
    type: 'login' | 'logout', 
    duration = 3000
  ): void {
    this.clearTimeout();
    this._state.next({ message, visible: true, type });
    this.timeoutId = window.setTimeout(() => {
      this._state.next({ 
        ...this._state.value, 
        visible: false 
      });
    }, duration);
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
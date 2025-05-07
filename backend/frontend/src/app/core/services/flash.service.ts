import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FlashService {
  private readonly messageSource = new BehaviorSubject<string | null>(null);
  private timeoutId: any;
  private isShowingMessage = false;
  currentMessage = this.messageSource.asObservable().pipe(
    distinctUntilChanged(), // Evita emissioni duplicate
    shareReplay({ bufferSize: 1, refCount: false })
  );

  showMessage(message: string, duration: number = 5000) {
    if (this.isShowingMessage) return;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isShowingMessage = true;
    this.messageSource.next(message);

    this.timeoutId = setTimeout(() => {
      this.messageSource.next(null);
      this.timeoutId = null;
      this.isShowingMessage = false;
    }, duration);
  }
}
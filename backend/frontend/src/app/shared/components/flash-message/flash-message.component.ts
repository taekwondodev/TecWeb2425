import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashService } from '../../../core/services/flash.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flash-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flash-message.component.html',
  styleUrls: ['./flash-message.component.css']
})
export class FlashMessageComponent implements OnDestroy {
  private readonly flashService = inject(FlashService);
  private readonly subscription: Subscription;
  message: string | null = null;

  constructor() {
    this.subscription = this.flashService.currentMessage.subscribe(
      (message) => {
        this.message = message;
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
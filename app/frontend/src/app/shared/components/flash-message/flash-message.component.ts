import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashService } from '../../../core/services/flash.service';
import { Subject, takeUntil } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-flash-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flash-message.component.html',
  styleUrls: ['./flash-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})

export class FlashMessageComponent implements OnDestroy{
  private readonly destroy$ = new Subject<void>();
  private readonly flashService = inject(FlashService);
  
  flashState$ = this.flashService.state$.pipe(
    takeUntil(this.destroy$)
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
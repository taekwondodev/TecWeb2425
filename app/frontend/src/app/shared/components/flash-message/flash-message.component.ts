import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlashService } from '../../../core/services/flash.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-flash-message',
  standalone: true,
  imports: [],
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

export class FlashMessageComponent{
  private readonly flashService = inject(FlashService);
  readonly flashState = this.flashService.flashState;
}
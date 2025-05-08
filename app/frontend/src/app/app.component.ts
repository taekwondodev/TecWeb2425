import { Component } from '@angular/core';
import { HeaderComponent } from "./shared/components/header/header.component";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FlashMessageComponent } from './shared/components/flash-message/flash-message.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, FlashMessageComponent]
})
export class AppComponent {
  title = 'meme-museum';
}
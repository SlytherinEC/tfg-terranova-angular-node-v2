import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenRefreshService } from './services/token-refresh.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Terranova';

  private tokenRefreshService = inject(TokenRefreshService);

  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:mousemove')
  registrarActividad(): void {
    this.tokenRefreshService.actualizarActividad();
  }
}

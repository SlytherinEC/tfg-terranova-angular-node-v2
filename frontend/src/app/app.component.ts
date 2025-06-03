import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenRefreshService } from './services/token-refresh.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Terranova';

  private tokenRefreshService = inject(TokenRefreshService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Verificar si ya hay un usuario logado al iniciar la aplicación
    if (this.authService.estaAutenticado()) {
      console.log('[AppComponent] Usuario ya autenticado, iniciando monitoreo');
      this.authService.iniciarVerificacionTokens();
      this.tokenRefreshService.iniciarMonitoreo();
    }
  }

  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:mousemove')
  registrarActividad(): void {
    // Solo registrar actividad si hay un usuario logado
    if (this.authService.estaAutenticado()) {
      this.tokenRefreshService.actualizarActividad();
    }
  }
}

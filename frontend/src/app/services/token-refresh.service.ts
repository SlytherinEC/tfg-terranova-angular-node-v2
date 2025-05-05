import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {

  private readonly LIMITE_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos
  private ultimaActividad: number = Date.now();
  private inactivityTimer: any;

  // Flag para evitar múltiples peticiones de refresh simultáneas
  private refreshingToken = false;
  private refreshingTokenSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    this.iniciarMonitoreoInactividad();
  }

  actualizarActividad(): void {
    this.ultimaActividad = Date.now();
  }

  hayActividadReciente(): boolean {
    return Date.now() - this.ultimaActividad < this.LIMITE_INACTIVIDAD_MS;
  }

  setRefreshingToken(estado: boolean): void {
    this.refreshingToken = estado;
    this.refreshingTokenSubject.next(estado);
  }

  isRefreshingToken(): boolean {
    return this.refreshingToken;
  }

  getRefreshingTokenSubject() {
    return this.refreshingTokenSubject.asObservable();
  }

  private iniciarMonitoreoInactividad(): void {
    // Revisar cada minuto si el usuario está inactivo
    this.inactivityTimer = setInterval(() => {
      if (!this.hayActividadReciente()) {
        console.log('[TokenRefreshService] Usuario inactivo detectado');
        
        // Limpiar tokens del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirigir al login
        this.router.navigate(['/login'], { 
          queryParams: { 
            reason: 'inactivity'
          }
        });
        
        // Opcional: Mostrar notificación o alerta
        // Puedes implementar un servicio de notificaciones si lo deseas
      }
    }, 60000); // Revisar cada minuto
  }

  ngOnDestroy(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
  }
}
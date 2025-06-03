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
    // No iniciar el monitoreo automáticamente
    // this.iniciarMonitoreoInactividad();
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

  // Método público para iniciar el monitoreo cuando el usuario se loga
  iniciarMonitoreo(): void {
    if (this.inactivityTimer) {
      return; // Ya está iniciado
    }
    
    this.ultimaActividad = Date.now(); // Resetear actividad
    this.iniciarMonitoreoInactividad();
    console.log('[TokenRefreshService] Monitoreo de inactividad iniciado');
  }

  // Método público para detener el monitoreo cuando el usuario se desloga
  detenerMonitoreo(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
      console.log('[TokenRefreshService] Monitoreo de inactividad detenido');
    }
  }

  private iniciarMonitoreoInactividad(): void {
    // Revisar cada minuto si el usuario está inactivo
    this.inactivityTimer = setInterval(() => {
      // Verificar si aún hay tokens válidos antes de verificar inactividad
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token && !refreshToken) {
        // No hay tokens, detener monitoreo
        this.detenerMonitoreo();
        return;
      }

      if (!this.hayActividadReciente()) {
        console.log('[TokenRefreshService] Usuario inactivo detectado');
        
        // Limpiar tokens del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Detener monitoreo
        this.detenerMonitoreo();
        
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
    this.detenerMonitoreo();
  }
}
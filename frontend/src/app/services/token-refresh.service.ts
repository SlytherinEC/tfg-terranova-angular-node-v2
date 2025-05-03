import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {

  private readonly LIMITE_INACTIVIDAD_MS = 5 * 60 * 1000; // 15 minutos
  private ultimaActividad: number = Date.now();
  private inactivityTimer: any;

  // Flag para evitar múltiples peticiones de refresh simultáneas
  private refreshingToken = false;
  private refreshingTokenSubject = new BehaviorSubject<boolean>(false);

  constructor() {
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
        // Si el usuario está inactivo, no hacer nada y dejar que el interceptor maneje la expiración
        console.log('[TokenRefreshService] Usuario inactivo detectado');
      }
    }, 60000); // Revisar cada minuto
  }

  ngOnDestroy(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
  }
}
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {

  private readonly LIMITE_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos
  private ultimaActividad: number = Date.now();

  actualizarActividad(): void {
    this.ultimaActividad = Date.now();
  }

  hayActividadReciente(): boolean {
    return Date.now() - this.ultimaActividad < this.LIMITE_INACTIVIDAD_MS;
  }
}

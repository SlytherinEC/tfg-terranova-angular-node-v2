import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  private apiUrl = `${environment.apiUrl}/dice`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Lanzar dados genéricos
  rollDice(count: number = 1, sides: number = 6): Observable<any> {
    return this.http.post(`${this.apiUrl}/roll`, { count, sides }, {
      headers: this.authService.obtenerHeadersAuth()
    });
  }

  // Lanzar dados para exploración
  rollForExploration(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/roll-for-action`, {
      id_partida: idPartida,
      accion: 'exploracion'
    }, {
      headers: this.authService.obtenerHeadersAuth()
    });
  }

  // Lanzar dados para combate
  rollForCombat(idPartida: number, arma: string, bonusPrecision: number = 0): Observable<any> {
    return this.http.post(`${this.apiUrl}/roll-for-action`, {
      id_partida: idPartida,
      accion: 'combate',
      parametros: {
        arma,
        bonusPrecision
      }
    }, {
      headers: this.authService.obtenerHeadersAuth()
    });
  }

  // Lanzar dados para eventos
  rollForEvent(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/roll-for-action`, {
      id_partida: idPartida,
      accion: 'evento'
    }, {
      headers: this.authService.obtenerHeadersAuth()
    });
  }
}
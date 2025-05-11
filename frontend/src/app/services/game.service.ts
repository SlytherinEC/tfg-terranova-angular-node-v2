import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private apiUrl = 'http://localhost:4205/api/game';

  // Estado del juego actual
  private gameStateSubject = new BehaviorSubject<any>(null);
  gameState$ = this.gameStateSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }
  // Obtener estado actual del juego
  getGameState(): any {
    return this.gameStateSubject.value;
  }

  // Actualizar estado del juego
  updateGameState(state: any): void {
    this.gameStateSubject.next(state);
  }

  // Iniciar nueva partida
  nuevaPartida(dificultad: string = 'NORMAL'): Observable<any> {
    return this.http.post(`${this.apiUrl}/nueva`, { dificultad }, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      tap((response: any) => {
        this.gameStateSubject.next(response.partida);
      })
    );
  }

  // Obtener listado de partidas
  obtenerPartidas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas`, {
      headers: this.authService.obtenerHeadersAuth()
    });
  }

  // Cargar una partida existente
  cargarPartida(idPartida: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas/${idPartida}`, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      tap((partida: any) => {
        this.gameStateSubject.next(partida);
      })
    );
  }

  // Explorar habitación
  explorarHabitacion(idPartida: number, coordenadas: { x: number, y: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/explorar`, { coordenadas }, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Resolver combate
  resolverCombate(idPartida: number, armaSeleccionada: string, usarItem?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate`,
      { armaSeleccionada, usarItem },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Sacrificar pasajero
  sacrificarPasajero(idPartida: number, accion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/sacrificar`,
      { accion },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Usar ítem
  usarItem(idPartida: number, indiceItem: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/usar-item`,
      { indiceItem },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Resolver evento
  resolverEvento(idPartida: number, numeroEvento: number, opcionSeleccionada: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/resolver-evento`,
      { numeroEvento, opcionSeleccionada },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Añadir método para guardar estado automáticamente
  autoSaveGameState(): void {
    const currentState = this.gameStateSubject.value;
    if (currentState && currentState.id_partida) {
      localStorage.setItem(`game_${currentState.id_partida}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        state: currentState
      }));
    }
  }

  // Añadir método para cargar estado automáticamente
  autoLoadGameState(idPartida: number): boolean {
    const savedData = localStorage.getItem(`game_${idPartida}`);
    if (savedData) {
      try {
        const { timestamp, state } = JSON.parse(savedData);
        // Verificar si el estado guardado es reciente (menos de 5 minutos)
        const savedTime = new Date(timestamp).getTime();
        const currentTime = new Date().getTime();
        const diffMinutes = (currentTime - savedTime) / (1000 * 60);

        if (diffMinutes < 5) {
          this.gameStateSubject.next(state);
          return true;
        }
      } catch (e) {
        console.error('Error al cargar estado guardado:', e);
      }
    }
    return false;
  }

}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
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
          // Para depuración
          if (response.resultado && response.resultado.tipo === 'armeria') {
            console.log('Opciones de armería recibidas:', response.resultado.opciones);
          }
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

  // NUEVA FUNCIÓN: Usar estrés
  usarEstres(idPartida: number, accion: string, indiceDado?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/usar-estres`,
      { accion, indice_dado: indiceDado },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // NUEVA FUNCIÓN: Obtener logros
  obtenerLogros(idPartida: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas/${idPartida}/logros`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }

  // Obtener estadísticas
  obtenerEstadisticas(idPartida: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas/${idPartida}/estadisticas`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }

  // Resolver armería
  resolverArmeria(idPartida: number, opcion: string, armaSeleccionada?: string): Observable<any> {
    // Incluir la cabecera de autorización correctamente
    const headers = this.authService.obtenerHeadersAuth();

    return this.http.post(
      `${this.apiUrl}/partidas/${idPartida}/resolver-armeria`,
      { opcion, armaSeleccionada }, // Asegurarse de que estos parámetros estén bien formateados
      { headers }
    ).pipe(
      tap((response: any) => {
        if (response.exito && !response.requiereSeleccionArma) {
          this.gameStateSubject.next(response.partida);
        }
      }),
      catchError(error => {
        console.error('Error en resolverArmeria:', error);
        return throwError(() => error);
      })
    );
  }
  // método para guardar estado automáticamente
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

  // Tirar dado para exploración
  tirarDadoExploracion(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/explorar-tirar-dado`, {}, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      catchError(error => {
        console.error('Error al tirar dado de exploración:', error);
        return throwError(() => error);
      })
    );
  }

  // Resolver exploración
  resolverExploracion(idPartida: number, coordenadas: { x: number, y: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/explorar-resolver`,
      { coordenadas },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      }),
      catchError(error => {
        console.error('Error al resolver exploración:', error);
        return throwError(() => error);
      })
    );
  }

  // Tirar dado para revisita
  tirarDadoRevisita(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/revisitar-tirar-dado`, {}, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      catchError(error => {
        console.error('Error al tirar dado de revisita:', error);
        return throwError(() => error);
      })
    );
  }

  // Resolver revisita
  resolverRevisita(idPartida: number, coordenadas: { x: number, y: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/revisitar-resolver`,
      { coordenadas },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      }),
      catchError(error => {
        console.error('Error al resolver revisita:', error);
        return throwError(() => error);
      })
    );
  }

  // Tirar dado para encuentro
  tirarDadoEncuentro(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/encuentro-tirar-dado`, {}, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      catchError(error => {
        console.error('Error al tirar dado de encuentro:', error);
        return throwError(() => error);
      })
    );
  }

  // Resolver encuentro
  resolverEncuentro(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/encuentro-resolver`, {}, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      }),
      catchError(error => {
        console.error('Error al resolver encuentro:', error);
        return throwError(() => error);
      })
    );
  }

  // NUEVOS MÉTODOS PARA COMBATE AVANZADO

  // Iniciar combate avanzado
  iniciarCombateAvanzado(idPartida: number, tipoAlien: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/iniciar`,
      { tipo_alien: tipoAlien },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Seleccionar arma en combate
  seleccionarArmaEnCombate(idPartida: number, nombreArma: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/seleccionar-arma`,
      { nombre_arma: nombreArma },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Lanzar dados en combate
  lanzarDadosEnCombate(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/lanzar-dados`,
      {},
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Avanzar de fase lanzamiento a uso de estrés
  avanzarAUsoEstres(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/avanzar-uso-estres`,
      {},
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Usar estrés en combate avanzado
  usarEstresEnCombateAvanzado(idPartida: number, accion: string, parametros?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/usar-estres`,
      { accion, parametros },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Continuar combate
  continuarCombateAvanzado(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/continuar`,
      {},
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Usar ítem en combate avanzado
  usarItemEnCombateAvanzado(idPartida: number, indiceItem: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/usar-item`,
      { indice_item: indiceItem },
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Sacrificar pasajero en combate avanzado
  sacrificarPasajeroEnCombateAvanzado(idPartida: number, accion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/sacrificar-pasajero`,
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

  // Obtener estado del combate
  obtenerEstadoCombate(idPartida: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/estado`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }

  // Finalizar combate
  finalizarCombate(idPartida: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidas/${idPartida}/combate-avanzado/finalizar`,
      {},
      { headers: this.authService.obtenerHeadersAuth() }
    ).pipe(
      tap((response: any) => {
        if (response.exito) {
          this.gameStateSubject.next(response.partida);
        }
      })
    );
  }

  // Obtener armas disponibles por dificultad
  obtenerArmasDisponibles(dificultad?: string): Observable<any> {
    const params = dificultad ? `?dificultad=${dificultad}` : '';
    return this.http.get(`${this.apiUrl}/armas${params}`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }

  // Obtener información de alien
  obtenerInfoAlien(tipoAlien: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/aliens/${tipoAlien}`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }

  // Obtener logros de combate
  obtenerLogrosCombateAvanzado(idPartida: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/partidas/${idPartida}/logros-combate`,
      { headers: this.authService.obtenerHeadersAuth() }
    );
  }
}
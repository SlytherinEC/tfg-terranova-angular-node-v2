// src/app/game/game-board/game-board.component.ts - Actualizado
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { GameState, MapCell } from '../../models/game.model';
import { EventResolverComponent } from '../event-resolver/event-resolver.component';
import { EncounterComponent } from '../encounter/encounter.component';
import { HexMapComponent, HexCell } from '../hex-map/hex-map.component';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    EventResolverComponent,
    EncounterComponent,
    HexMapComponent
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, OnDestroy {

  // Inicialización con valores por defecto para evitar propiedades indefinidas
  gameState: GameState = {
    id_partida: 0,
    id_usuario: 0,
    capitan: { traje: 0, estres: 0, oxigeno: 0 },
    pasajeros: 0,
    armas: [],
    mochila: [],
    mapa: [],
    posicion_actual: { x: 0, y: 0 },
    codigos_activacion: 0,
    habitaciones_exploradas: [],
    eventos_completados: [],
    encuentro_actual: null,
    estado: 'EN_CURSO',
    dificultad: 'NORMAL',
    logros: {},
    fecha_creacion: '',
    fecha_actualizacion: ''
  };

  idPartida!: number;
  gameSubscription: Subscription | null = null;
  mensaje: string | null = null;
  logMessages: string[] = [];
  isLoading: boolean = false;
  showEncounter: boolean = false;
  showEvent: boolean = false;
  activeEvent: any = null;
  combatMessage: string | null = null;
  currentDiceResult: number = 1;

  constructor(
    private gameService: GameService,
    private mapService: MapService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.idPartida = idParam ? Number(idParam) : 0;

    if (this.idPartida === 0) {
      this.mensaje = 'ID de partida no válido';
      return;
    }

    // Cargar partida
    this.loadGame();
  }

  ngOnDestroy(): void {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  loadGame(): void {
    this.isLoading = true;

    // Intentar cargar estado guardado
    const loaded = this.gameService.autoLoadGameState(this.idPartida);

    if (loaded) {
      // Obtener el estado del juego actualizado
      const state = this.gameService.getGameState();
      if (state) {
        this.gameState = state;
        this.checkGameStatus();
      }

      this.addLogMessage('Partida cargada desde caché local.');
      this.isLoading = false;
      return;
    }

    // Si no hay estado guardado, cargar desde el servidor
    this.gameService.cargarPartida(this.idPartida).subscribe({
      next: (partida) => {
        const state = this.gameService.getGameState();
        if (state) {
          this.gameState = state;
        }

        this.addLogMessage(`Partida cargada. ${this.getGameStatusMessage()}`);
        this.isLoading = false;
        this.checkGameStatus();
      },
      error: (err) => {
        console.error('Error al cargar partida:', err);
        this.mensaje = 'Error al cargar la partida';
        this.isLoading = false;
      }
    });
  }

  addLogMessage(message: string): void {
    this.logMessages.unshift(message);
    // Mantener solo los últimos 10 mensajes
    if (this.logMessages.length > 10) {
      this.logMessages = this.logMessages.slice(0, 10);
    }
  }

  getGameStatusMessage(): string {
    if (!this.gameState || !this.gameState.capitan) {
      return 'Cargando estado del juego...';
    }

    const { capitan, codigos_activacion, pasajeros } = this.gameState;
    return `Traje: ${capitan.traje}/6 | O2: ${capitan.oxigeno}/10 | Códigos: ${codigos_activacion}/6 | Pasajeros: ${pasajeros}`;
  }

  checkGameStatus(): void {
    if (!this.gameState) return;

    if (this.gameState.estado !== 'EN_CURSO') {
      // Si la partida ha terminado, mostrar mensaje y opciones
      const resultado = this.gameState.estado === 'VICTORIA' ? 'VICTORIA' : 'DERROTA';
      this.mensaje = `¡${resultado}! ${this.getFinalMessage()}`;
    }

    // Comprobar si hay un encuentro activo
    this.showEncounter = !!this.gameState.encuentro_actual;
  }

  getFinalMessage(): string {
    if (!this.gameState) return '';

    if (this.gameState.estado === 'VICTORIA') {
      return 'Has conseguido escapar de la nave con éxito.';
    } else {
      return 'Tu misión ha terminado aquí. La nave está perdida.';
    }
  }

  // Método que se llama cuando se hace clic en una celda del mapa hexagonal
  onCellClick(cell: HexCell): void {
    if (!this.gameState) return;

    // Si la partida ha terminado, no permitir acciones
    if (this.gameState.estado !== 'EN_CURSO') {
      return;
    }

    // Si hay un encuentro activo, no permitir moverse
    if (this.gameState.encuentro_actual) {
      this.mensaje = 'No puedes moverte durante un combate';
      return;
    }

    // Si hay un evento activo, no permitir moverse
    if (this.showEvent) {
      this.mensaje = 'Debes resolver el evento actual antes de moverte';
      return;
    }

    // Comprobar si la celda es accesible
    if (cell.tipo === 'inaccesible' || (cell.puerta_bloqueada && this.gameState.codigos_activacion < cell.codigos_requeridos)) {
      this.mensaje = cell.puerta_bloqueada
        ? `Puerta bloqueada. Necesitas ${cell.codigos_requeridos} códigos de activación.`
        : 'No puedes acceder a esta zona.';
      return;
    }

    // Explorar la celda
    this.explorarCelda(cell);
  }

  explorarCelda(cell: HexCell): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.explorarHabitacion(this.idPartida, { x: cell.x, y: cell.y }).subscribe({
      next: (response) => {
        if (response.exito) {
          this.procesarResultadoExploracion(response);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Guardar estado automáticamente
          this.gameService.autoSaveGameState();
        } else {
          this.mensaje = response.mensaje || 'Error al explorar';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al explorar:', err);
        this.mensaje = 'Error al explorar la habitación';
        this.isLoading = false;
      }
    });
  }

  procesarResultadoExploracion(response: any): void {
    if (!response || !response.resultado) return;

    const resultado = response.resultado;

    // Actualizar logs
    if (resultado.mensaje) {
      this.addLogMessage(resultado.mensaje);
    }

    // Procesar según tipo de resultado
    switch (resultado.tipo) {
      case 'encuentro':
        this.showEncounter = true;
        break;

      case 'evento':
        this.showEvent = true;
        this.activeEvent = {
          numero: resultado.numero,
          mensaje: resultado.mensaje,
          opciones: resultado.opciones
        };
        break;

      // Otros tipos de resultados...
    }
  }

  resolverCombate(armaSeleccionada: string, usarItem?: number): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.resolverCombate(this.idPartida, armaSeleccionada, usarItem).subscribe({
      next: (response) => {
        if (response.exito) {
          if (response.mensaje) {
            this.addLogMessage(response.mensaje);
            this.combatMessage = response.mensaje;
          }

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Actualizar dados mostrados
          if (response.dados && response.dados.length > 0) {
            // Simplificación: mostrar solo el primer dado
            this.currentDiceResult = response.dados[0];
          }

          if (response.victoria) {
            // Timeout para mostrar el resultado antes de cerrar el modal
            setTimeout(() => {
              this.showEncounter = false;
              this.combatMessage = null;
            }, 2000);
          }
        } else {
          this.mensaje = response.mensaje || 'Error en el combate';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error en combate:', err);
        this.mensaje = 'Error durante el combate';
        this.isLoading = false;
      }
    });
  }

  resolverEvento(opcionSeleccionada: string): void {
    if (!this.idPartida || !this.activeEvent) return;

    this.isLoading = true;
    this.gameService.resolverEvento(
      this.idPartida,
      this.activeEvent.numero,
      opcionSeleccionada
    ).subscribe({
      next: (response) => {
        if (response.exito) {
          if (response.resultado && response.resultado.mensaje) {
            this.addLogMessage(response.resultado.mensaje);
          }

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Verificar si se inicia un encuentro como resultado del evento
          if (response.resultado && response.resultado.tipo === 'encuentro') {
            this.showEvent = false;
            this.showEncounter = true;
          } else {
            this.showEvent = false;
            this.activeEvent = null;
          }
        } else {
          this.mensaje = response.mensaje || 'Error al resolver el evento';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver evento:', err);
        this.mensaje = 'Error durante el evento';
        this.isLoading = false;
      }
    });
  }

  sacrificarPasajero(accion: string): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.sacrificarPasajero(this.idPartida, accion).subscribe({
      next: (response) => {
        if (response.mensaje) {
          this.addLogMessage(response.mensaje);
        }

        // Actualizar el estado del juego
        const state = this.gameService.getGameState();
        if (state) {
          this.gameState = state;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al sacrificar pasajero:', err);
        this.mensaje = 'Error al sacrificar pasajero';
        this.isLoading = false;
      }
    });
  }

  usarItem(indiceItem: number): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.usarItem(this.idPartida, indiceItem).subscribe({
      next: (response) => {
        if (response.exito) {
          if (response.mensaje) {
            this.addLogMessage(response.mensaje);
          }

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mensaje = response.mensaje || 'Error al usar el ítem';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al usar ítem:', err);
        this.mensaje = 'Error al usar ítem';
        this.isLoading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/game']);
  }

  calcularRangoFinal(gameState: any): string {
    if (!gameState || !gameState.logros) return 'CADETE';

    // Contar logros obtenidos
    const totalLogros = Object.values(gameState.logros).filter(valor => valor === true).length;

    // Determinar rango según cantidad de logros
    if (totalLogros >= 9) return 'GENERAL';
    if (totalLogros >= 8) return 'ALMIRANTE';
    if (totalLogros >= 6) return 'MAYOR';
    if (totalLogros >= 4) return 'CAPITAN';
    if (totalLogros >= 2) return 'OFICIAL';
    return 'CADETE';
  }

  // Métodos auxiliares
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
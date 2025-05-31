// src/app/game/game-board/game-board.component.ts - Actualizado
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { GameState, MapCell } from '../../models/game.model';
import { EventResolverComponent } from '../event-resolver/event-resolver.component';
import { EncounterComponent } from '../encounter/encounter.component';
import { HexMapComponent, HexCell } from '../hex-map/hex-map.component';
import { MapService } from '../../services/map.service';
import { StressManagerComponent } from '../stress-manager/stress-manager.component';
import { ArmoryResolverComponent } from '../armory-resolver/armory-resolver.component';
import { ExplorableResolverComponent } from '../explorable-resolver/explorable-resolver.component';
import { DiceService } from '../../services/dice.service';
import { InfoModalComponent } from '../info-modal/info-modal.component';
import { RevisitResolverComponent } from '../revisit-resolver/revisit-resolver.component';
import { EncounterResolverComponent } from '../encounter-resolver/encounter-resolver.component';
import { SacrificeResolverComponent } from '../sacrifice-resolver/sacrifice-resolver.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    EventResolverComponent,
    EncounterComponent,
    HexMapComponent,
    StressManagerComponent,
    ArmoryResolverComponent,
    ExplorableResolverComponent,
    InfoModalComponent,
    RevisitResolverComponent,
    EncounterResolverComponent,
    SacrificeResolverComponent
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
    combate_actual: null,
    estado: 'EN_CURSO',
    dificultad: 'NORMAL',
    logros: {},
    fecha_creacion: '',
    fecha_actualizacion: '',
    adyacencias: {},
    aliens_derrotados: {},
  };

  idPartida!: number;
  gameSubscription: Subscription | null = null;
  mensaje: string | null = null;
  logMessages: string[] = [];
  isLoading: boolean = false;
  showEvent: boolean = false;
  activeEvent: any = null;
  combatMessage: string | null = null;
  currentDiceResult: number = 1;

  // Propiedades del explorable resolver
  showExplorable: boolean = false;
  explorableCellCoords: any = null;
  explorableDiceResult: number | null = null;
  explorableResultMessage: string = '';
  explorableResultType: string = '';
  explorableResultDetails: any = null;
  @ViewChild('explorableResolver') explorableResolver!: ExplorableResolverComponent;

  // Propiedades del revisit resolver
  showRevisit: boolean = false;
  revisitCellCoords: any = null;
  revisitDiceResult: number | null = null;
  revisitResultMessage: string = '';
  revisitResultType: string = '';
  revisitResultDetails: any = null;
  @ViewChild('revisitResolver') revisitResolver!: any;

  // Propiedades del encounter resolver
  showEncounterResolver: boolean = false;
  encounterDiceResult: number | null = null;
  encounterAlienData: any = null;
  encounterResultMessage: string = '';
  @ViewChild('encounterResolver') encounterResolver!: EncounterResolverComponent;
  @ViewChild('encounterComponent') encounterComponent!: EncounterComponent;

  // Propiedades del sacrifice resolver
  showSacrifice: boolean = false;
  sacrificeAction: string = '';
  sacrificeDiceResult: number | null = null;
  sacrificeResultMessage: string = '';
  sacrificeResultType: string = '';
  @ViewChild('sacrificeResolver') sacrificeResolver!: SacrificeResolverComponent;

  // Propiedades de la armería
  showArmeria: boolean = false;
  armeriaOptions: any[] = [];
  @ViewChild('armeriaSelector') armeriaSelector: any;

  // propiedades para el modal informativo
  showInfoModal: boolean = false;
  infoModalTitle: string = '';
  infoModalMessage: string = '';

  constructor(
    private gameService: GameService,
    private mapService: MapService,
    private diceService: DiceService,
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

    // Ya no necesitamos manejar showEncounter porque ahora se muestra condicionalmente en el template
  }

  getFinalMessage(): string {
    if (!this.gameState) return '';

    if (this.gameState.estado === 'VICTORIA') {
      return 'Has conseguido escapar de la nave con éxito.';
    } else {
      return 'Tu misión ha terminado aquí. La nave está perdida.';
    }
  }

  // MÉTODO DE PRUEBA: Añadir temporalmente para debugging
  testModal(): void {
    console.log('Mostrando modal de prueba');
    this.mostrarModalInfo('Prueba', 'Este es un mensaje de prueba');
  }

  // Método que se llama cuando se hace clic en una celda del mapa hexagonal
  onCellClick(cell: HexCell): void {
    
    if (!this.gameState) {
      console.log('No hay gameState');
      return;
    }

    // Si la partida ha terminado, no permitir acciones
    if (this.gameState.estado !== 'EN_CURSO') {
      console.log('Partida terminada');
      return;
    }

    // Si hay un encuentro activo, no permitir moverse
    if (this.gameState.encuentro_actual) {
      this.mostrarModalInfo('Movimiento Restringido', 'No puedes moverte durante un combate');
      return;
    }

    // Si hay un evento activo, no permitir moverse
    if (this.showEvent) {
      this.mostrarModalInfo('Acción Requerida', 'Debes resolver el evento actual antes de moverte');
      return;
    }

    // Comprobar si la celda es accesible
    if (cell.tipo === 'inaccesible' || (cell.puerta_bloqueada && this.gameState.codigos_activacion < cell.codigos_requeridos)) {
      this.mensaje = cell.puerta_bloqueada
        ? `Puerta bloqueada. Necesitas ${cell.codigos_requeridos} códigos de activación.`
        : 'No puedes acceder a esta zona.';
      return;
    }

    // Si es una celda explorable y no está explorada, mostrar el componente explorable
    if (cell.tipo === 'explorable' && !cell.explorado) {
      this.showExplorable = true;
      this.explorableCellCoords = { x: cell.x, y: cell.y };
      return;
    }

    // Si es una celda ya explorada (revisita), mostrar el componente de revisita
    if (cell.explorado && cell.tipo === 'explorable') {
      this.showRevisit = true;
      this.revisitCellCoords = { x: cell.x, y: cell.y };
      return;
    }

    // Explorar la celda (para tipos especiales como armería, control, etc.)
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
          // Mostrar modal con el mensaje del backend
          this.mostrarModalInfo('Acceso Denegado', response.mensaje || 'Error al explorar');
        }
        this.isLoading = false;
      },
      error: (err) => {
        // Mostrar modal con el mensaje de error del backend
        let titulo = 'Error';
        let mensaje = 'Error al explorar la habitación';

        // Asegurarse de mostrar el mensaje de error del servidor si está disponible
        if (err.error && err.error.mensaje) {
          mensaje = err.error.mensaje;

          // Personalizar el título según el tipo de error
          if (mensaje.includes('adyacente')) {
            titulo = 'Movimiento Inválido';
          } else if (mensaje.includes('bloqueada') || mensaje.includes('códigos')) {
            titulo = 'Puerta Bloqueada';
          } else if (mensaje.includes('ya ha sido visitada') || mensaje.includes('una vez')) {
            titulo = 'Habitación Agotada';
          }

        } else {
          this.mensaje = 'Error al explorar la habitación';
        }

        this.mostrarModalInfo(titulo, mensaje);
        console.error('Error al explorar:', err);
        this.isLoading = false;
      }
    });
  }

  // método para mostrar el modal informativo
  private mostrarModalInfo(titulo: string, mensaje: string): void {
    console.log('Mostrando modal informativo:', titulo, mensaje);
    this.infoModalTitle = titulo;
    this.infoModalMessage = mensaje;
    this.showInfoModal = true;
    console.log('Estado del modal:', this.showInfoModal);
  }

  // método para cerrar el modal informativo
  onCloseInfoModal(): void {
    this.showInfoModal = false;
    this.infoModalTitle = '';
    this.infoModalMessage = '';
  }

  // método para manejar movimientos inválidos del mapa
  onInvalidMove(event: {type: string, message: string, cell: any}): void {
    console.log('Movimiento inválido:', event);
    
    let titulo = 'Movimiento Inválido';
    
    switch (event.type) {
      case 'inaccessible':
        titulo = 'Zona Inaccesible';
        break;
      case 'locked_door':
        titulo = 'Puerta Bloqueada';
        break;
      case 'not_adjacent':
        titulo = 'Movimiento Restringido';
        break;
    }
    
    this.mostrarModalInfo(titulo, event.message);
  }

  // método para tirar el dado de exploración
  onRollExplorableDice(): void {
    if (!this.idPartida || !this.explorableCellCoords) return;

    this.isLoading = true;

    // Usar el servicio de juego para tirar el dado
    this.gameService.tirarDadoExploracion(this.idPartida).subscribe({
      next: (response: any) => {
        if (response.exito) {
          this.explorableDiceResult = response.resultado;
          this.explorableResultMessage = response.mensaje;
          this.explorableResultType = response.tipo;

          // Actualizar el componente explorable-resolver con el resultado del servidor
          if (this.explorableResolver) {
            this.explorableResolver.setDiceResult(
              response.resultado,
              response.mensaje,
              response.tipo,
              response.resultDetails || null
            );
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al tirar dado de exploración:', err);
        this.mensaje = 'Error al tirar dado';
        this.isLoading = false;
      }
    });
  }

  // método para resolver la exploración
  onAcceptExplorableResult(): void {
    if (!this.explorableCellCoords) return;

    this.isLoading = true;
    this.gameService.resolverExploracion(this.idPartida, this.explorableCellCoords).subscribe({
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
          this.mostrarModalInfo('Error', response.mensaje || 'Error al resolver exploración');
        }

        // Cerrar el modal de explorable
        this.showExplorable = false;
        this.explorableCellCoords = null;
        this.explorableDiceResult = null;
        this.explorableResultMessage = '';
        this.explorableResultType = '';
        this.explorableResultDetails = null;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver exploración:', err);
        this.mostrarModalInfo('Error', 'Error al resolver la exploración');
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
        // Mostrar el encounter resolver en lugar de ir directamente al combate
        this.showEncounterResolver = true;
        break;

      case 'evento':
        this.showEvent = true;
        this.activeEvent = {
          numero: resultado.numero,
          mensaje: resultado.mensaje,
          opciones: resultado.opciones
        };
        break;

      case 'armeria':
        this.showArmeria = true;
        // Verificar y registrar el estado de las opciones
        console.log('Opciones recibidas de la armería:', resultado.opciones);
        this.armeriaOptions = resultado.opciones || [];
        // Si aún no hay opciones, crear opciones predeterminadas
        if (!this.armeriaOptions || this.armeriaOptions.length === 0) {
          console.warn('Sin opciones de armería, usando valores predeterminados');
          this.armeriaOptions = [
            { id: 'recargar_armas', texto: 'Recargar todas las armas' },
            { id: 'reparar_traje', texto: 'Reparar todo el traje' },
            { id: 'recargar_y_reparar', texto: 'Recargar 1 arma y 3 ptos de traje' }
          ];
        }
        break;

      // Otros casos...

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
            // El combate terminó, el encuentro se cerrará automáticamente cuando se actualice gameState.encuentro_actual
            // No necesitamos manejar showEncounter manualmente
            setTimeout(() => {
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
            this.showEncounterResolver = true;
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
    
    // Verificar que hay pasajeros
    if (this.gameState.pasajeros <= 0) {
      this.mostrarModalInfo('Sin Pasajeros', 'No tienes pasajeros para sacrificar');
      return;
    }

    // Mostrar el sacrifice resolver
    this.sacrificeAction = accion;
    this.showSacrifice = true;
    this.sacrificeDiceResult = null;
    this.sacrificeResultMessage = '';
    this.sacrificeResultType = '';
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
          this.mensaje = response.mensaje || 'Error al usar ítem';
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

  // Añadir nuevos métodos para manejar el estrés
  // Dentro de la clase GameBoardComponent
  onUsarEstres(datos: { accion: string, indiceDado?: number }): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.usarEstres(this.idPartida, datos.accion, datos.indiceDado).subscribe({
      next: (response) => {
        if (response.exito) {
          if (response.mensaje) {
            this.addLogMessage(response.mensaje);
          }

          // Si se modificó un dado en combate, actualizar la UI
          if (datos.accion === 'modificar' || datos.accion === 'retirar') {
            this.combatMessage = response.mensaje;
            if (response.dados) {
              this.currentDiceResult = response.dados[0];
            }
          }

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mensaje = response.mensaje || 'Error al usar estrés';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al usar estrés:', err);
        this.mensaje = 'Error al usar estrés';
        this.isLoading = false;
      }
    });
  }

  // método para manejar la selección de opciones de la armería
  onArmeriaOptionSelect(datos: { opcion: string, arma?: string }): void {
    if (!this.idPartida) return;

    // Si el usuario decidió salir
    if (datos.opcion === 'salir') {
      this.showArmeria = false;
      return;
    }

    this.isLoading = true;
    this.gameService.resolverArmeria(this.idPartida, datos.opcion, datos.arma).subscribe({
      next: (response) => {
        // Si requiere selección de arma
        if (response.requiereSeleccionArma && response.armasDisponibles) {
          this.isLoading = false;
          // Pasar las armas disponibles al componente
          if (this.armeriaSelector) {
            this.armeriaSelector.mostrarArmas(response.armasDisponibles);
          } else {
            this.mensaje = 'Error al mostrar selección de armas';
          }
          return;
        }

        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Mostrar el mensaje en el componente en lugar de cerrar
          if (this.armeriaSelector) {
            this.armeriaSelector.mostrarResultado(response.mensaje);
          }
        } else {
          this.mensaje = response.mensaje || 'Error al resolver armería';
          this.showArmeria = false;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver armería:', err);
        this.mensaje = 'Error al resolver armería';
        this.isLoading = false;
        this.showArmeria = false;
      }
    });
  }

  // Métodos para manejar la revisita
  onRollRevisitDice(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.tirarDadoRevisita(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          this.revisitDiceResult = response.resultado;
          this.revisitResultMessage = response.mensaje;
          this.revisitResultType = response.tipo;

          // Configurar el resultado en el componente
          if (this.revisitResolver) {
            this.revisitResolver.setDiceResult(
              response.resultado,
              response.mensaje,
              response.tipo
            );
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al tirar dado');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al tirar dado de revisita:', err);
        this.mostrarModalInfo('Error', 'Error al tirar el dado');
        this.isLoading = false;
      }
    });
  }

  onAcceptRevisitResult(): void {
    if (!this.revisitCellCoords) return;

    this.isLoading = true;
    this.gameService.resolverRevisita(this.idPartida, this.revisitCellCoords).subscribe({
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
          this.mostrarModalInfo('Error', response.mensaje || 'Error al resolver revisita');
        }

        // Cerrar el modal de revisita
        this.showRevisit = false;
        this.revisitCellCoords = null;
        this.revisitDiceResult = null;
        this.revisitResultMessage = '';
        this.revisitResultType = '';
        this.revisitResultDetails = null;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver revisita:', err);
        this.mostrarModalInfo('Error', 'Error al resolver la revisita');
        this.isLoading = false;
      }
    });
  }

  // Métodos para manejar el encounter resolver
  onRollEncounterDice(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.tirarDadoEncuentro(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          this.encounterDiceResult = response.resultado;
          this.encounterAlienData = response.alien;
          this.encounterResultMessage = response.mensaje;

          // Configurar el resultado en el componente
          if (this.encounterResolver) {
            this.encounterResolver.setDiceResult(
              response.resultado,
              response.alien,
              response.mensaje
            );
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al tirar dado');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al tirar dado de encuentro:', err);
        this.mostrarModalInfo('Error', 'Error al tirar el dado');
        this.isLoading = false;
      }
    });
  }

  onAcceptEncounterResult(): void {
    this.isLoading = true;
    this.gameService.resolverEncuentro(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.resultado.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Cerrar el modal de encounter resolver
          this.showEncounterResolver = false;

          // Guardar estado automáticamente
          this.gameService.autoSaveGameState();
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al resolver encuentro');
        }

        // Limpiar datos del encounter resolver
        this.encounterDiceResult = null;
        this.encounterAlienData = null;
        this.encounterResultMessage = '';

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver encuentro:', err);
        this.mostrarModalInfo('Error', 'Error al resolver el encuentro');
        this.isLoading = false;
      }
    });
  }

  // Método para mostrar el encounter resolver (llamado desde otros componentes)
  mostrarEncounterResolver(): void {
    this.showEncounterResolver = true;
  }

  // NUEVOS MÉTODOS PARA COMBATE AVANZADO

  onSeleccionarArmaAvanzado(nombreArma: string): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.seleccionarArmaEnCombate(this.idPartida, nombreArma).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al seleccionar arma');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al seleccionar arma:', err);
        this.mostrarModalInfo('Error', 'Error al seleccionar arma');
        this.isLoading = false;
      }
    });
  }

  onLanzarDadosAvanzado(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.lanzarDadosEnCombate(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
            
            // Animar los dados con los resultados del backend
            if (this.encounterComponent && state.combate_actual?.datos_lanzamiento?.dados) {
              this.encounterComponent.animateDiceWithResults(state.combate_actual.datos_lanzamiento.dados);
            }
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al lanzar dados');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al lanzar dados:', err);
        this.mostrarModalInfo('Error', 'Error al lanzar dados');
        this.isLoading = false;
      }
    });
  }

  onAvanzarAUsoEstres(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.avanzarAUsoEstres(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Agregar información específica sobre el resultado del ataque
          const state = this.gameService.getGameState();
          if (state?.combate_actual?.datos_lanzamiento) {
            const datos = state.combate_actual.datos_lanzamiento;
            if (datos.exito) {
              this.addLogMessage(`🎯 ¡ATAQUE EXITOSO! (${datos.suma}/${datos.objetivo})`);
              if (datos.arma_usada) {
                this.addLogMessage(`⚔️ Preparándose para causar ${datos.arma_usada.danio} puntos de daño...`);
              }
            } else {
              this.addLogMessage(`❌ Ataque fallido (${datos.suma}/${datos.objetivo}). El alien no recibirá daño.`);
            }
          }

          // Actualizar el estado del juego
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al avanzar a uso de estrés');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al avanzar a uso de estrés:', err);
        this.mostrarModalInfo('Error', 'Error al avanzar a uso de estrés');
        this.isLoading = false;
      }
    });
  }

  onUsarEstresAvanzado(datos: { accion: string, parametros?: any }): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.usarEstresEnCombateAvanzado(this.idPartida, datos.accion, datos.parametros).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al usar estrés');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al usar estrés en combate:', err);
        this.mostrarModalInfo('Error', 'Error al usar estrés');
        this.isLoading = false;
      }
    });
  }

  onContinuarCombateAvanzado(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.continuarCombateAvanzado(this.idPartida).subscribe({
      next: (response) => {
        if (response.exito) {
          // Agregar mensaje principal del backend
          this.addLogMessage(response.mensaje);

          // Agregar información adicional específica del combate
          if (response.danio_causado) {
            this.addLogMessage(`💥 Has causado ${response.danio_causado} puntos de daño al alien!`);
          }

          if (response.danio_recibido) {
            this.addLogMessage(`💔 Has recibido ${response.danio_recibido} puntos de daño en tu traje!`);
          }

          if (response.alien_derrotado) {
            this.addLogMessage(`🎉 ¡Has derrotado al ${response.alien_derrotado}!`);
          }

          if (response.victoria) {
            this.addLogMessage(`✅ ¡VICTORIA! Has ganado el combate!`);
            // Mostrar modal informativo de victoria
            setTimeout(() => {
              this.mostrarModalInfo('¡Victoria!', '¡Has derrotado al alien exitosamente!');
            }, 500);
          }

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Si la partida terminó o el combate finalizó, no necesitamos hacer nada especial
          // ya que el template mostrará automáticamente el mapa cuando gameState.encuentro_actual sea null
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al continuar combate');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al continuar combate:', err);
        this.mostrarModalInfo('Error', 'Error al continuar combate');
        this.isLoading = false;
      }
    });
  }

  onUsarItemAvanzado(indiceItem: number): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.usarItemEnCombateAvanzado(this.idPartida, indiceItem).subscribe({
      next: (response) => {
        if (response.exito) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al usar ítem');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al usar ítem en combate:', err);
        this.mostrarModalInfo('Error', 'Error al usar ítem');
        this.isLoading = false;
      }
    });
  }

  onSacrificarPasajeroAvanzado(accion: string): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.sacrificarPasajeroEnCombateAvanzado(this.idPartida, accion).subscribe({
      next: (response) => {
        if (response.exito || response.mensaje) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego
          const state = this.gameService.getGameState();
          if (state) {
            this.gameState = state;
          }

          // Si escapó del encuentro exitosamente, no necesitamos hacer nada especial
          // ya que el template mostrará automáticamente el mapa cuando gameState.encuentro_actual sea null
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al sacrificar pasajero');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al sacrificar pasajero en combate:', err);
        this.mostrarModalInfo('Error', 'Error al sacrificar pasajero');
        this.isLoading = false;
      }
    });
  }

  // Métodos para manejar el sacrifice resolver
  onRollSacrificeDice(): void {
    if (!this.idPartida || !this.sacrificeAction) return;
    
    this.isLoading = true;
    this.gameService.tirarDadoSacrificio(this.idPartida, this.sacrificeAction).subscribe({
      next: (response) => {
        if (response.exito) {
          this.sacrificeDiceResult = response.resultado;
          this.sacrificeResultMessage = response.mensaje;
          this.sacrificeResultType = response.tipo;

          // Configurar el resultado en el componente
          if (this.sacrificeResolver) {
            this.sacrificeResolver.setDiceResult(
              response.resultado,
              response.mensaje,
              response.tipo
            );
          }
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al tirar dado');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al tirar dado de sacrificio:', err);
        this.mostrarModalInfo('Error', 'Error al tirar el dado');
        this.isLoading = false;
      }
    });
  }

  onAcceptSacrificeResult(): void {
    if (!this.idPartida) return;

    this.isLoading = true;
    this.gameService.resolverSacrificio(this.idPartida).subscribe({
      next: (response) => {
        // Tanto éxito como fallo son respuestas válidas del sacrificio
        if (response.exito !== undefined && response.mensaje) {
          this.addLogMessage(response.mensaje);

          // Actualizar el estado del juego CON LA PARTIDA DEL BACKEND
          if (response.partida) {
            this.gameState = response.partida;
            this.gameService.updateGameState(response.partida);
          }

          // Cerrar el modal de sacrifice resolver
          this.showSacrifice = false;

          // Guardar estado automáticamente
          this.gameService.autoSaveGameState();
        } else {
          this.mostrarModalInfo('Error', response.mensaje || 'Error al resolver sacrificio');
        }

        // Limpiar datos del sacrifice resolver
        this.sacrificeDiceResult = null;
        this.sacrificeAction = '';
        this.sacrificeResultMessage = '';
        this.sacrificeResultType = '';

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al resolver sacrificio:', err);
        
        // Mostrar mensaje específico del backend si está disponible
        let mensaje = 'Error durante el sacrificio';
        if (err.error && err.error.mensaje) {
          mensaje = err.error.mensaje;
          
          // Si hay información de debug, mostrarla en consola
          if (err.error.debug) {
            console.error('Debug info:', err.error.debug);
          }
        }
        
        this.mostrarModalInfo('Error', mensaje);
        this.isLoading = false;
      }
    });
  }

  /**
   * Selecciona un arma en el encounter component (desde el sidebar)
   */
  seleccionarArmaEnCombate(nombreArma: string): void {
    if (this.encounterComponent) {
      this.encounterComponent.onWeaponSelect(nombreArma);
    }
  }
}
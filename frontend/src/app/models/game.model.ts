// src/app/models/game.model.ts

export interface GameState {
  id_partida: number;
  id_usuario: number;
  capitan: Captain;
  pasajeros: number;
  armas: Weapon[];
  mochila: Item[];
  mapa: MapCell[][];
  posicion_actual: Position;
  codigos_activacion: number;
  habitaciones_exploradas: string[];
  eventos_completados: number[];
  encuentro_actual: Encounter | null;
  combate_actual: CombatState | null;
  estado: 'EN_CURSO' | 'VICTORIA' | 'DERROTA';
  dificultad: 'MUY_FACIL' | 'NORMAL' | 'DIFICIL' | 'LOCURA';
  logros: { [key: string]: boolean };
  fecha_creacion: string;
  fecha_actualizacion: string;
  adyacencias: { [key: string]: Position[] };
  aliens_derrotados: { [key: string]: number };
  pasajeros_sacrificados?: number;
  bonus_precision_temporal?: number;
  evadir_proximo_ataque?: boolean;
  proxima_habitacion_encuentro?: boolean;
  
  // Añadir esta propiedad:
  ultimo_combate?: {
    dados: number[];
    suma: number;
    arma: Weapon;
    alien: Alien;
    objetivo: number;
  };
}

export interface Captain {
  traje: number;
  estres: number;
  oxigeno: number;
}

export interface Weapon {
  nombre: string;
  danio: number;
  precision: number;
  municion: number;
  municion_max: number;
}

export interface Item {
  nombre: string;
  efecto: string;
  usos: number;
}

// NUEVAS INTERFACES PARA COMBATE AVANZADO

export interface CombatState {
  turno: number;
  fase: string;
  alien_tipo: string;
  alien_pg: number;
  alien_pg_max: number;
  arma_seleccionada?: Weapon;
  datos_lanzamiento?: DiceRollData;
  acciones_disponibles: CombatAction[];
  puede_usar_estres: boolean;
  historial: CombatHistoryEntry[];
}

export interface DiceRollData {
  dados: number[];
  suma: number;
  objetivo: number;
  exito: boolean;
  arma_usada: Weapon;
  dados_modificados?: { indice: number; valor_original: number; valor_nuevo: number }[];
  dados_relanzados?: { indice: number; valor_original: number; valor_nuevo: number }[];
}

export interface CombatAction {
  tipo: 'seleccionar_arma' | 'usar_item' | 'usar_estres' | 'sacrificar_pasajero' | 'continuar';
  disponible: boolean;
  descripcion: string;
  costo?: number;
  parametros?: any;
}

export interface CombatHistoryEntry {
  turno: number;
  accion: string;
  resultado: string;
  dados?: number[];
  danio_causado?: number;
  danio_recibido?: number;
}

export interface StressAction {
  tipo: 'alterar_resultado' | 'volver_a_tirar' | 'reparar_traje';
  descripcion: string;
  costo: number;
  disponible: boolean;
  parametros?: {
    dado_seleccionado?: number;
    modificacion?: number; // +1 o -1 para alterar resultado
  };
}

export interface SacrificeAction {
  tipo: 'escapar_encuentro' | 'evadir_ataque' | 'recuperar_oxigeno';
  descripcion: string;
  disponible: boolean;
}

export interface SacrificeResult {
  exito: boolean;
  reaccion: number; // 1-6
  descripcion_reaccion: string;
  efecto_aplicado: string;
}

// src/app/models/game.model.ts (continuación)

export interface MapCell {
  x: number;
  y: number;
  tipo: CellType;
  explorado: boolean;
  puerta_bloqueada: boolean;
  codigos_requeridos: number;
}

export type CellType = 'inicio' | 'explorable' | 'estacion_oxigeno' | 'armeria' | 
                       'seguridad' | 'control' | 'bahia_carga' | 'bahia_escape' | 
                       'evento_aleatorio' | 'inaccesible' | 'vacio';

export interface Position {
  x: number;
  y: number;
}

export interface Encounter {
  alien: string;
  pg: number;
  alienData?: Alien;
}

export interface Alien {
  nombre: string;
  danio: number;
  objetivo: number;
  pg: number;
  sacrificio_requerido?: number; // Para especificar cuántos pasajeros se necesitan para escapar
}

export interface GameAction {
  tipo: string;
  mensaje: string;
  // Campos adicionales según el tipo de acción
  [key: string]: any;
}

export interface EventoOpcion {
  id: string;
  texto: string;
}

// NUEVAS INTERFACES PARA RESPUESTAS DE COMBATE

export interface CombatResponse {
  exito: boolean;
  mensaje: string;
  combate_estado: CombatState;
  partida: GameState;
  victoria?: boolean;
  derrota?: boolean;
  puede_continuar?: boolean;
}

export interface StressResponse {
  exito: boolean;
  mensaje: string;
  dados_modificados?: number[];
  estres_restante: number;
  combate_estado: CombatState;
  partida: GameState;
}

export interface ItemUsageResponse {
  exito: boolean;
  mensaje: string;
  efecto_aplicado: string;
  item_consumido: boolean;
  combate_estado?: CombatState;
  partida: GameState;
}
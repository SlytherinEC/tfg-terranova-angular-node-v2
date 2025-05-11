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
  estado: 'EN_CURSO' | 'VICTORIA' | 'DERROTA';
  dificultad: 'NORMAL' | 'DIFICIL' | 'LOCURA';
  logros: { [key: string]: boolean };
  fecha_creacion: string;
  fecha_actualizacion: string;
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
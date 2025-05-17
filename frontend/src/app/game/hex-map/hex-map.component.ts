// src/app/game/hex-map/hex-map.component.ts
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HexCellComponent } from '../hex-cell/hex-cell.component';

export interface HexCell {
  x: number;
  y: number;
  tipo: CellType;
  explorado: boolean;
  puerta_bloqueada: boolean;
  codigos_requeridos: number;
}

export type CellType = 'inicio' | 'explorable' | 'estacion_oxigeno' | 'armeria' |
  'seguridad' | 'control' | 'bahia_carga' | 'bahia_escape' |
  'evento_aleatorio' | 'inaccesible' | 'puerta_bloqueada' | 'vacio';

@Component({
  selector: 'app-hex-map',
  standalone: true,
  imports: [CommonModule, HexCellComponent],
  templateUrl: './hex-map.component.html',
  styleUrl: './hex-map.component.scss'
})
export class HexMapComponent implements OnInit, OnChanges {
  @Input() mapa: HexCell[][] = [];
  @Input() posicionActual: { x: number, y: number } = { x: 0, y: 0 };
  @Input() codigosActivacion: number = 0;
  @Output() cellClick = new EventEmitter<HexCell>();

  mapRows: HexCell[][] = [];

  // Estructura del mapa - cuántos hexágonos por fila
  readonly hexesPerRow: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 11, 10, 11, 10, 7, 6, 1];

  constructor() { }

  ngOnInit(): void {
    if (this.mapa.length === 0) {
      this.crearMapaInicial();
    } else {
      this.procesarMapa();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mapa'] && !changes['mapa'].firstChange) {
      this.procesarMapa();
    }
  }

  procesarMapa(): void {
    // Reorganizamos el mapa plano en la estructura de filas para la visualización
    this.mapRows = [];

    for (let y = 0; y < this.hexesPerRow.length; y++) {
      const row: HexCell[] = [];

      for (let x = 0; x < this.hexesPerRow[y]; x++) {
        // Encontramos la celda correspondiente en el mapa plano
        const found = this.mapa.find(celda =>
          celda.find(c => c.x === x && c.y === y)
        );

        if (found) {
          row.push(found.find(c => c.x === x && c.y === y)!);
        } else {
          // Si no existe, creamos una celda vacía
          row.push({
            x,
            y,
            tipo: 'vacio',
            explorado: false,
            puerta_bloqueada: false,
            codigos_requeridos: 0
          });
        }
      }

      this.mapRows.push(row);
    }
  }

  crearMapaInicial(): void {
    // Mapeo de los tipos de celdas por fila
    const mapDefinition = [
      ['inicio'],
      ['explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable', 'explorable'],
      ['evento_aleatorio', 'inaccesible', 'explorable', 'explorable', 'explorable', 'evento_aleatorio'],
      ['explorable', 'explorable', 'inaccesible', 'puerta_bloqueada', 'inaccesible', 'explorable', 'explorable'],
      ['explorable', 'estacion_oxigeno', 'inaccesible', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'puerta_bloqueada'],
      ['explorable', 'explorable', 'explorable', 'inaccesible', 'armeria', 'explorable', 'explorable', 'inaccesible', 'explorable', 'explorable', 'inaccesible'],
      ['puerta_bloqueada', 'explorable', 'inaccesible', 'inaccesible', 'inaccesible', 'evento_aleatorio', 'inaccesible', 'estacion_oxigeno', 'explorable', 'evento_aleatorio'],
      ['explorable', 'inaccesible', 'inaccesible', 'explorable', 'bahia_carga', 'inaccesible', 'control', 'inaccesible', 'explorable', 'explorable', 'seguridad'],
      ['explorable', 'evento_aleatorio', 'explorable', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable', 'estacion_oxigeno', 'inaccesible', 'armeria'],
      ['inaccesible', 'explorable', 'explorable', 'explorable', 'explorable', 'inaccesible'],
      ['bahia_escape']
    ];

    // Configuración de las puertas bloqueadas
    const puertasBloqueadas = [
      { y: 7, x: 3, codigos: 4 },
      { y: 8, x: 7, codigos: 1 },
      { y: 10, x: 0, codigos: 3 },
      { y: 15, x: 0, codigos: 6 }
    ];

    // Creamos el mapa basado en la definición
    this.mapRows = [];
    this.mapa = [];

    for (let y = 0; y < mapDefinition.length; y++) {
      const row: HexCell[] = [];
      const rowDef = mapDefinition[y];

      for (let x = 0; x < rowDef.length; x++) {
        const tipo = rowDef[x] as CellType;

        // Verificar si esta celda es una puerta bloqueada
        const esPuerta = tipo === 'puerta_bloqueada' ||
          (tipo === 'bahia_escape' && y === 14 && x === 0);

        let codigosRequeridos = 0;

        if (esPuerta) {
          // Encontrar cuántos códigos requiere esta puerta
          const puerta = puertasBloqueadas.find(p => p.y === y && p.x === x);
          codigosRequeridos = puerta ? puerta.codigos : 0;
        }

        const cell: HexCell = {
          x,
          y,
          tipo,
          explorado: tipo === 'inicio',  // Solo el inicio está explorado inicialmente
          puerta_bloqueada: esPuerta,
          codigos_requeridos: codigosRequeridos
        };

        row.push(cell);
      }

      this.mapRows.push(row);
      this.mapa.push(row);
    }
  }

  onCellClick(cell: HexCell): void {
    // Verificar si la celda es accesible
    if (cell.tipo === 'inaccesible') {
      return;
    }

    // Verificar si hay una puerta bloqueada
    if (cell.puerta_bloqueada && this.codigosActivacion < cell.codigos_requeridos) {
      return;
    }

    // Emitir evento de click
    this.cellClick.emit(cell);
  }

  // Devuelve las clases CSS para una celda
  getCellClass(cell: HexCell): string {
    if (!cell) return 'hex-cell';

    let classes = 'hex-cell';

    // Posición actual
    if (cell.x === this.posicionActual.x && cell.y === this.posicionActual.y) {
      classes += ' current-position';
    }

    // Celda explorada
    if (cell.explorado) {
      classes += ' explored';
    }

    // Tipo de celda
    classes += ` ${cell.tipo}`;

    // Puerta bloqueada
    if (cell.puerta_bloqueada) {
      classes += ' locked-door';
    }

    return classes;
  }
}
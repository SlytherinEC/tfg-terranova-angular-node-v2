// src/app/game/hex-cell/hex-cell.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HexCell } from '../hex-map/hex-map.component';

@Component({
  selector: 'app-hex-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hex-cell.component.html',
  styleUrl: './hex-cell.component.scss'
})
export class HexCellComponent {
  @Input() cell!: HexCell;
  @Input() isCurrentPosition: boolean = false;
  @Input() codigosActivacion: number = 0;
  @Output() cellClick = new EventEmitter<HexCell>();

  onClick(): void {
    // No permitir clic en celdas inaccesibles
    if (this.cell.tipo === 'inaccesible') {
      return;
    }

    // No permitir clic en puertas bloqueadas sin suficientes códigos
    if (this.cell.puerta_bloqueada && this.codigosActivacion < this.cell.codigos_requeridos) {
      return;
    }

    this.cellClick.emit(this.cell);
  }

  // Obtener icono según el tipo de celda
  getIcon(): string {
    switch (this.cell.tipo) {
      case 'inicio':
        return 'INI';
      case 'control':
        return 'CA';
      case 'estacion_oxigeno':
        return 'O2';
      case 'armeria':
        return 'ARM';
      case 'bahia_escape':
        return 'ESC';
      case 'bahia_carga':
        return 'CAR';
      case 'evento_aleatorio':
        return '?';
      case 'seguridad':
        return 'SEG';
      case 'puerta_bloqueada':
        return `${this.cell.codigos_requeridos}`;
      default:
        return '';
    }
  }

  // Verificar si la celda está accesible
  isAccessible(): boolean {
    if (this.cell.tipo === 'inaccesible') {
      return false;
    }

    if (this.cell.puerta_bloqueada && this.codigosActivacion < this.cell.codigos_requeridos) {
      return false;
    }

    return true;
  }
}
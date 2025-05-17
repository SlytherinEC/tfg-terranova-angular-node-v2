import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stress-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stress-manager.component.html',
  styleUrl: './stress-manager.component.scss'
})
export class StressManagerComponent {
  @Input() estresActual: number = 0;
  @Input() estresMaximo: number = 3;
  @Input() dados: number[] = [];
  @Input() isInCombat: boolean = false;
  @Input() traje: number = 6;
  @Input() trajeMaximo: number = 6;
  @Input() isDisabled: boolean = false;

  @Output() usarEstres = new EventEmitter<{ accion: string, indiceDado?: number }>();

  accionSeleccionada: string | null = null;
  dadoSeleccionado: number | null = null;

  get puedeUsarEstres(): boolean {
    return this.estresActual < this.estresMaximo && !this.isDisabled;
  }

  get puedeModificarDados(): boolean {
    return this.isInCombat && this.dados.length > 0 && this.puedeUsarEstres;
  }

  get puedeRepararTraje(): boolean {
    return this.traje < this.trajeMaximo && this.puedeUsarEstres;
  }

  seleccionarAccion(accion: string): void {
    if (!this.puedeUsarEstres) return;

    this.accionSeleccionada = accion;
    this.dadoSeleccionado = null;

    if (accion === 'reparar') {
      this.confirmarAccion();
    }
  }

  seleccionarDado(indice: number): void {
    if (!this.puedeModificarDados || !this.accionSeleccionada) return;

    this.dadoSeleccionado = indice;
  }

  confirmarAccion(): void {
    if (!this.puedeUsarEstres || !this.accionSeleccionada) return;

    // Para modificar o retirar dados necesitamos el índice
    if ((this.accionSeleccionada === 'modificar' || this.accionSeleccionada === 'retirar')
      && this.dadoSeleccionado === null) {
      return;
    }

    this.usarEstres.emit({
      accion: this.accionSeleccionada,
      indiceDado: this.dadoSeleccionado !== null ? this.dadoSeleccionado : undefined
    });

    // Limpiar selección
    this.accionSeleccionada = null;
    this.dadoSeleccionado = null;
  }

  cancelarAccion(): void {
    this.accionSeleccionada = null;
    this.dadoSeleccionado = null;
  }
}
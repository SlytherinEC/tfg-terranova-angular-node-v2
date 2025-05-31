import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceComponent } from '../../dice/dice.component';

@Component({
  selector: 'app-revisit-resolver',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './revisit-resolver.component.html',
  styleUrl: './revisit-resolver.component.scss'
})
export class RevisitResolverComponent {
  @Input() isLoading: boolean = false;
  @Output() rollDice = new EventEmitter<void>();
  @Output() acceptResult = new EventEmitter<void>();

  @ViewChild('diceRef') diceComponent!: DiceComponent;

  diceResult: number | null = null;
  resultMessage: string = '';
  resultType: string = '';
  resultDetails: any = null;

  // Panel inicial con mensaje de instrucción
  infoMessage: string = 'Tira el dado para revisitar la habitación';
  showAcceptButton: boolean = false;

  onRollDice(): void {
    if (this.isLoading) return;
    this.rollDice.emit();
  }

  // Método llamado por el componente padre cuando se obtiene el resultado del dado
  setDiceResult(result: number, message: string, type: string, details: any = null): void {
    this.diceResult = result;
    this.resultMessage = message;
    this.resultType = type;
    this.resultDetails = details;
    this.showAcceptButton = true;

    // Lanzar el dado directamente con el resultado del backend
    if (this.diceComponent) {
      // Pasar el resultado forzado para asegurar que coincida con el backend
      this.diceComponent.lanzarDado(result);
    }
  }

  onAcceptResult(): void {
    this.acceptResult.emit();
  }

  getDiceResultDescription(): string {
    if (!this.diceResult) return '';

    if (this.diceResult <= 2) {
      return 'Encuentro: ¡Hay un alien en esta habitación!';
    } else if (this.diceResult <= 5) {
      return 'Habitación vacía: Te sientes más calmado (-1 Estrés)';
    } else {
      return 'Superviviente: ¡Has encontrado un pasajero!';
    }
  }

  getResultIcon(): string {
    if (!this.diceResult) return '';

    if (this.diceResult <= 2) {
      return '👾'; // Alien
    } else if (this.diceResult <= 5) {
      return '🔹'; // Icono más pixelart para calmado/estrés reducido
    } else {
      return '👤'; // Pasajero
    }
  }
} 
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceComponent } from '../../dice/dice.component';

@Component({
  selector: 'app-sacrifice-resolver',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './sacrifice-resolver.component.html',
  styleUrl: './sacrifice-resolver.component.scss'
})
export class SacrificeResolverComponent {
  @Input() isLoading: boolean = false;
  @Input() sacrificeAction: string = ''; // 'escapar_encuentro', 'evadir_ataque', 'recuperar_oxigeno'
  @Output() rollDice = new EventEmitter<void>();
  @Output() acceptResult = new EventEmitter<void>();

  @ViewChild('diceRef') diceComponent!: DiceComponent;

  diceResult: number | null = null;
  resultMessage: string = '';
  resultType: string = '';

  // Panel inicial con mensaje de instrucción
  infoMessage: string = 'Tira el dado para ver la reacción del pasajero';
  showAcceptButton: boolean = false;

  onRollDice(): void {
    if (this.isLoading) return;
    this.rollDice.emit();
  }

  // Método llamado por el componente padre cuando se obtiene el resultado del dado
  setDiceResult(result: number, message: string, type: string): void {
    this.diceResult = result;
    this.resultMessage = message;
    this.resultType = type;
    this.showAcceptButton = true;

    // Lanzar el dado directamente con el resultado del backend
    if (this.diceComponent) {
      this.diceComponent.lanzarDado(result);
    }
  }

  onAcceptResult(): void {
    this.acceptResult.emit();
  }

  getSacrificeActionText(): string {
    switch (this.sacrificeAction) {
      case 'escapar_encuentro':
        return 'Escapar del encuentro';
      case 'evadir_ataque':
        return 'Evadir próximo ataque';
      case 'recuperar_oxigeno':
        return 'Recuperar 3 puntos de O2';
      default:
        return 'Sacrificio';
    }
  }

  getDiceResultDescription(): string {
    if (!this.diceResult) return '';

    switch (this.diceResult) {
      case 1:
        return '💀 Te roban munición y huyen - Pierdes 1 munición de cada arma y a este pasajero';
      case 2:
      case 3:
        return '😱 Gritan de miedo y llaman la atención - Pierdes al pasajero y la próxima habitación tendrá un alien';
      case 4:
        return '😰 Gritan de miedo y llaman la atención - Pierdes al pasajero y la próxima habitación tendrá un alien';
      case 5:
      case 6:
        return `🦸‍♂️ ¡Se convierte en héroe! - ${this.getSacrificeActionText()}`;
      default:
        return '';
    }
  }

  getResultTypeClass(): string {
    if (!this.diceResult) return '';

    if (this.diceResult === 1) return 'result-critical';
    if (this.diceResult >= 2 && this.diceResult <= 4) return 'result-negative';
    if (this.diceResult >= 5) return 'result-positive';
    
    return '';
  }
} 
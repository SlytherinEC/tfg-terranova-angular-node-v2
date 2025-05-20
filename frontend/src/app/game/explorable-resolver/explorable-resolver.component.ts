import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceComponent } from '../../dice/dice.component';

@Component({
  selector: 'app-explorable-resolver',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './explorable-resolver.component.html',
  styleUrl: './explorable-resolver.component.scss'
})
export class ExplorableResolverComponent {
  @Input() isLoading: boolean = false;
  @Output() rollDice = new EventEmitter<void>();
  @Output() acceptResult = new EventEmitter<void>();

  diceResult: number | null = null;
  showDiceAnimation: boolean = false;
  resultMessage: string = '';
  resultType: string = '';
  resultDetails: any = null;

  // Panel inicial con mensaje de instrucción
  infoMessage: string = 'Tira el dado para resolver la habitación';
  showAcceptButton: boolean = false;

  onRollDice(): void {
    if (this.isLoading) return;

    this.showDiceAnimation = true;
    this.rollDice.emit();
  }

  // Método llamado por el componente padre cuando se obtiene el resultado del dado
  setDiceResult(result: number, message: string, type: string, details: any = null): void {
    this.diceResult = result;
    this.resultMessage = message;
    this.resultType = type;
    this.resultDetails = details;
    this.showAcceptButton = true;
  }

  onAcceptResult(): void {
    this.acceptResult.emit();
  }

  getDiceResultDescription(): string {
    if (!this.diceResult) return '';

    switch (this.diceResult) {
      case 1:
        return 'Habitación infestada: ¡Te encontraste con un alien!';
      case 2:
        return 'Bahía de carga infestada: ¡Has encontrado un ítem pero hay un alien!';
      case 3:
        return 'Control infestado: ¡Has encontrado un código de activación pero hay un alien!';
      case 4:
        return 'Control: Has encontrado un código de activación';
      case 5:
        return 'Armería: Selecciona una opción para mejorar tu equipo';
      case 6:
        return 'Seguridad: Has encontrado un pasajero y te sientes más tranquilo (-Estrés)';
      default:
        return '';
    }
  }
}
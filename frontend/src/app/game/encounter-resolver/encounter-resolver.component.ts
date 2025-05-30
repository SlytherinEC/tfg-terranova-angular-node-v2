import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceComponent } from '../../dice/dice.component';

@Component({
  selector: 'app-encounter-resolver',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './encounter-resolver.component.html',
  styleUrl: './encounter-resolver.component.scss'
})
export class EncounterResolverComponent {
  @Input() isLoading: boolean = false;
  @Output() rollDice = new EventEmitter<void>();
  @Output() acceptResult = new EventEmitter<void>();

  @ViewChild('diceRef') diceComponent!: DiceComponent;

  diceResult: number | null = null;
  alienData: any = null;
  resultMessage: string = '';
  showAcceptButton: boolean = false;

  // Panel inicial con mensaje de instrucción
  infoMessage: string = 'Tira el dado para determinar qué alien te enfrentas';

  onRollDice(): void {
    if (this.isLoading) return;
    this.rollDice.emit();
  }

  // Método llamado por el componente padre cuando se obtiene el resultado del dado
  setDiceResult(result: number, alien: any, message: string): void {
    this.diceResult = result;
    this.alienData = alien;
    this.resultMessage = message;
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

  getAlienImage(): string {
    if (!this.alienData) return '';
    return `assets/images/${this.alienData.tipo}.jpg`;
  }

  getSacrificioText(): string {
    if (!this.alienData) return '';
    const sacrificio = this.alienData.sacrificio;
    return sacrificio === 1 ? '1 pasajero' : `${sacrificio} pasajeros`;
  }
} 
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceRollData, StressAction } from '../../models/game.model';

@Component({
  selector: 'app-stress-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stress-manager.component.html',
  styleUrl: './stress-manager.component.scss'
})
export class StressManagerComponent {
  @Input() currentStress: number = 0;
  @Input() maxStress: number = 3;
  @Input() diceRollData: DiceRollData | null = null;
  @Input() isLoading: boolean = false;
  @Input() canUseStress: boolean = false;

  @Output() stressAction = new EventEmitter<{accion: string, parametros?: any}>();
  @Output() continueWithoutStress = new EventEmitter<void>();

  selectedDiceIndex: number = -1;

  get availableStressPoints(): number {
    return this.maxStress - this.currentStress;
  }

  get stressActions(): StressAction[] {
    return [
      {
        tipo: 'alterar_resultado',
        descripcion: 'Alterar resultado de dado (+1 o -1)',
        costo: 1,
        disponible: this.canUseStress && this.selectedDiceIndex >= 0,
        parametros: { dado_seleccionado: this.selectedDiceIndex }
      },
      {
        tipo: 'volver_a_tirar',
        descripcion: 'Volver a tirar un dado',
        costo: 1,
        disponible: this.canUseStress && this.selectedDiceIndex >= 0,
        parametros: { dado_seleccionado: this.selectedDiceIndex }
      },
      {
        tipo: 'reparar_traje',
        descripcion: 'Reparar traje (+1 punto)',
        costo: 1,
        disponible: this.canUseStress,
        parametros: {}
      }
    ];
  }

  get diceArray(): any[] {
    if (!this.diceRollData?.dados) return [];
    
    return this.diceRollData.dados.map((value, index) => ({
      value,
      index,
      selected: this.selectedDiceIndex === index,
      modified: this.isDiceModified(index),
      rerolled: this.isDiceRerolled(index)
    }));
  }

  onSelectDice(index: number): void {
    if (this.isLoading || !this.canUseStress) return;
    this.selectedDiceIndex = this.selectedDiceIndex === index ? -1 : index;
  }

  onUseStress(action: StressAction): void {
    if (!action.disponible || this.isLoading) return;

    let parametros: any = { ...action.parametros };

    if (action.tipo === 'alterar_resultado') {
      const currentValue = this.diceRollData?.dados[this.selectedDiceIndex] || 1;
      const modification = currentValue >= 6 ? -1 : 1;
      parametros.indice_dado = this.selectedDiceIndex;
      parametros.modificacion = modification;
    } else if (action.tipo === 'volver_a_tirar') {
      parametros.indice_dado = this.selectedDiceIndex;
    }

    this.stressAction.emit({
      accion: action.tipo,
      parametros
    });

    // Reset selection after action
    this.selectedDiceIndex = -1;
  }

  onContinue(): void {
    this.continueWithoutStress.emit();
  }

  private isDiceModified(index: number): boolean {
    return this.diceRollData?.dados_modificados?.some(mod => mod.indice === index) || false;
  }

  private isDiceRerolled(index: number): boolean {
    return this.diceRollData?.dados_relanzados?.some(reroll => reroll.indice === index) || false;
  }

  getStressBarWidth(): number {
    return (this.currentStress / this.maxStress) * 100;
  }

  getStressBarClass(): string {
    const percentage = this.getStressBarWidth();
    if (percentage >= 100) return 'stress-critical';
    if (percentage >= 66) return 'stress-high';
    if (percentage >= 33) return 'stress-medium';
    return 'stress-low';
  }
}
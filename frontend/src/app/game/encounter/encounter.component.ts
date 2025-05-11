import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DiceComponent } from '../../dice/dice.component';

@Component({
  selector: 'app-encounter',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './encounter.component.html',
  styleUrl: './encounter.component.scss'
})
export class EncounterComponent {
  @Input() encounter: any;
  @Input() weapons: any[] = [];
  @Input() canSacrifice: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() combatResult: string | null = null;
  @Input() diceResult: number = 1;
  @Output() weaponSelected = new EventEmitter<string>();
  @Output() escape = new EventEmitter<void>();

  get diceArray(): any[] {
    // Crear un array basado en la precisión del arma seleccionada (para mostrar múltiples dados)
    const selectedWeapon = this.weapons.find(w => w.nombre === this.lastSelectedWeapon);
    const precision = selectedWeapon?.precision || 1;
    return new Array(precision);
  }

  private lastSelectedWeapon: string = '';

  onWeaponSelect(weaponName: string): void {
    if (this.isLoading) return;

    const weapon = this.weapons.find(w => w.nombre === weaponName);
    if (weapon && weapon.municion > 0) {
      this.lastSelectedWeapon = weaponName;
      this.weaponSelected.emit(weaponName);
    }
  }

  onEscape(): void {
    if (this.isLoading || !this.canSacrifice) return;
    this.escape.emit();
  }
}

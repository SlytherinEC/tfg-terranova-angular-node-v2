import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChildren, QueryList, OnChanges, SimpleChanges } from '@angular/core';
import { DiceComponent } from '../../dice/dice.component';
import { CombatState, DiceRollData, CombatAction, Weapon, Item } from '../../models/game.model';

@Component({
  selector: 'app-encounter',
  standalone: true,
  imports: [CommonModule, DiceComponent],
  templateUrl: './encounter.component.html',
  styleUrl: './encounter.component.scss'
})
export class EncounterComponent implements OnChanges {
  @Input() encounter: any;
  @Input() weapons: Weapon[] = [];
  @Input() items: Item[] = [];
  @Input() canSacrifice: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() combatResult: string | null = null;
  @Input() diceResult: number = 1;
  @Input() combatState: CombatState | null = null;
  @Input() pasajeros: number = 0;
  @Input() estres: number = 0;

  @Output() weaponSelected = new EventEmitter<string>();
  @Output() escape = new EventEmitter<void>();
  @Output() itemUsed = new EventEmitter<number>();
  @Output() stressUsed = new EventEmitter<{accion: string, parametros?: any}>();
  @Output() continueAction = new EventEmitter<void>();
  @Output() sacrificePassenger = new EventEmitter<string>();

  // Nuevos outputs para combate avanzado
  @Output() selectWeaponInAdvancedCombat = new EventEmitter<string>();
  @Output() rollDiceInAdvancedCombat = new EventEmitter<void>();
  @Output() useStressInAdvancedCombat = new EventEmitter<{accion: string, parametros?: any}>();
  @Output() continueAdvancedCombat = new EventEmitter<void>();
  @Output() useItemInAdvancedCombat = new EventEmitter<number>();
  @Output() sacrificePassengerInAdvancedCombat = new EventEmitter<string>();
  @Output() advanceToStressPhase = new EventEmitter<void>();
  // Nuevo output para el sacrificio interactivo
  @Output() sacrificePassengerInteractive = new EventEmitter<string>();

  selectedDiceIndex: number = -1;
  showDiceResults: boolean = false;

  @ViewChildren('diceRef') diceComponents!: QueryList<DiceComponent>;

  get diceArray(): any[] {
    // Siempre mostrar dados basados en el arma seleccionada, con valor inicial 1
    const selectedWeapon = this.combatState?.arma_seleccionada;
    const precision = selectedWeapon?.precision || 1;
    
    return new Array(precision).fill(0).map((_, index) => ({ 
      value: 1, 
      index,
      modified: false,
      rerolled: false
    }));
  }

  get canUseStress(): boolean {
    return this.estres < 3 && this.combatState?.fase === 'uso_estres';
  }

  get availableActions(): CombatAction[] {
    return this.combatState?.acciones_disponibles || [];
  }

  get combatPhase(): string {
    return this.combatState?.fase || 'preparacion';
  }

  get diceRollData(): DiceRollData | null {
    return this.combatState?.datos_lanzamiento || null;
  }

  private lastSelectedWeapon: string = '';

  onWeaponSelect(weaponName: string): void {
    if (this.isLoading) return;

    const weapon = this.weapons.find(w => w.nombre === weaponName);
    if (weapon && (weapon.municion === null || weapon.municion > 0)) {
      this.lastSelectedWeapon = weaponName;
      
      // Si hay combate avanzado activo, usar el sistema avanzado
      if (this.combatState && this.combatPhase === 'seleccion_arma') {
        this.selectWeaponInAdvancedCombat.emit(weaponName);
      } else {
        // Sistema de combate anterior
        this.weaponSelected.emit(weaponName);
      }
    }
  }

  onRollDice(): void {
    if (this.isLoading) return;
    
    // Si hay combate avanzado activo y estamos en fase de lanzamiento
    if (this.combatState && this.combatPhase === 'lanzamiento') {
      // Hacer la llamada al backend directamente
      this.rollDiceInAdvancedCombat.emit();
    }
  }

  onEscape(): void {
    if (this.isLoading || !this.canSacrifice) return;
    this.escape.emit();
  }

  onUseItem(index: number): void {
    if (this.isLoading) return;
    
    // Si hay combate avanzado activo, usar el sistema avanzado
    if (this.combatState) {
      this.useItemInAdvancedCombat.emit(index);
    } else {
      // Sistema anterior
      this.itemUsed.emit(index);
    }
  }

  onSelectDice(index: number): void {
    this.selectedDiceIndex = index;
  }

  onUseStress(action: string): void {
    if (!this.canUseStress) return;

    let parametros: any = {};

    if (action === 'alterar_resultado' || action === 'volver_a_tirar') {
      if (this.selectedDiceIndex === -1) {
        alert('Selecciona un dado primero');
        return;
      }
      parametros.indice_dado = this.selectedDiceIndex;
      
      if (action === 'alterar_resultado') {
        const currentValue = this.diceRollData?.dados[this.selectedDiceIndex] || 1;
        const modification = currentValue >= 6 ? -1 : 1; // +1 si es posible, -1 si está en 6
        parametros.modificacion = modification;
      }
    }

    // Si hay combate avanzado activo, usar el sistema avanzado
    if (this.combatState) {
      this.useStressInAdvancedCombat.emit({ accion: action, parametros });
    } else {
      // Sistema anterior
      this.stressUsed.emit({ accion: action, parametros });
    }
    
    this.selectedDiceIndex = -1; // Reset selection
  }

  onContinue(): void {
    // Si hay combate avanzado activo, usar el sistema avanzado
    if (this.combatState) {
      this.continueAdvancedCombat.emit();
    } else {
      // Sistema anterior
      this.continueAction.emit();
    }
  }

  onSacrificePassenger(action: string): void {
    if (this.pasajeros <= 0) return;
    
    // SIEMPRE usar el sistema interactivo de sacrifice resolver
    // independientemente de si hay combate avanzado o no
    this.sacrificePassengerInteractive.emit(action);
  }

  private isDiceModified(index: number): boolean {
    return this.diceRollData?.dados_modificados?.some(mod => mod.indice === index) || false;
  }

  private isDiceRerolled(index: number): boolean {
    return this.diceRollData?.dados_relanzados?.some(reroll => reroll.indice === index) || false;
  }

  getWeaponMunitionText(weapon: Weapon): string {
    if (weapon.municion === null) {
      return '∞';
    }
    return `${weapon.municion}/${weapon.municion_max}`;
  }

  isWeaponUsable(weapon: Weapon): boolean {
    return weapon.nombre === 'Palanca' || weapon.municion > 0;
  }

  getActionDescription(action: CombatAction): string {
    let description = action.descripcion;
    if (action.costo) {
      description += ` (Costo: ${action.costo} estrés)`;
    }
    return description;
  }

  getPhaseTitle(): string {
    switch (this.combatPhase) {
      case 'preparacion':
        return 'Preparación para el Combate';
      case 'seleccion_arma':
        return 'Selecciona tu Arma';
      case 'lanzamiento':
        return 'Lanzando Dados';
      case 'uso_estres':
        return 'Usar Estrés (Opcional)';
      case 'resultado':
        return 'Resultado del Ataque';
      case 'turno_alien':
        return 'Turno del Alien';
      default:
        return 'Combate';
    }
  }

  getPhaseDescription(): string {
    switch (this.combatPhase) {
      case 'preparacion':
        return 'Puedes usar ítems o sacrificar pasajeros antes de comenzar el combate.';
      case 'seleccion_arma':
        return 'Elige el arma que usarás para atacar al alien.';
      case 'lanzamiento':
        return 'Prepárate para atacar. Presiona el botón para lanzar los dados.';
      case 'uso_estres':
        return 'Puedes usar estrés para modificar el resultado de los dados.';
      case 'resultado':
        return 'Aplica el resultado del ataque y prepárate para el contraataque.';
      case 'turno_alien':
        return 'El alien está atacando.';
      default:
        return 'Combate en progreso.';
    }
  }

  getContinueButtonText(): string {
    switch (this.combatPhase) {
      case 'preparacion':
        return 'Comenzar Combate';
      case 'uso_estres':
        return 'Continuar sin Usar Estrés';
      case 'resultado':
        return 'Continuar al Turno del Alien';
      default:
        return 'Continuar';
    }
  }

  get hasContinueAction(): boolean {
    return this.availableActions.some(a => a.tipo === 'continuar');
  }

  getAlienImage(): string {
    if (!this.encounter?.alienData && !this.encounter?.alien) return '';
    const alienType = this.encounter.alienData?.tipo || this.encounter.alien;
    return `assets/images/${alienType}.jpg`;
  }

  getWeaponMunitionTextForSelected(): string {
    const weapon = this.combatState?.arma_seleccionada;
    if (!weapon) return '';
    
    if (weapon.municion === null) {
      return '∞';
    }
    return `${weapon.municion}/${weapon.municion_max}`;
  }

  // Método para animar los dados con los resultados del backend - SIMPLIFICADO
  animateDiceWithResults(diceResults: number[]): void {
    console.log('Animando dados con resultados:', diceResults);
    
    if (this.diceComponents && diceResults.length > 0) {
      const diceArray = this.diceComponents.toArray();
      console.log('Dados encontrados:', diceArray.length);
      
      // Animar cada dado con su resultado correspondiente - EXACTAMENTE como explorable-resolver
      diceResults.forEach((result, index) => {
        if (diceArray[index]) {
          console.log(`Animando dado ${index} hacia ${result}`);
          diceArray[index].lanzarDado(result);
        }
      });
      
      // Mostrar los resultados después de la animación
      setTimeout(() => {
        console.log('Mostrando resultados después de animación');
        this.showDiceResults = true;
        // Actualizar el valor visual de los dados
        this.updateDiceVisualResults(diceResults);
      }, 1000);
    } else {
      console.log('No se pudieron encontrar los dados para animar');
    }
  }

  // Método para actualizar los valores visuales después de la animación
  private updateDiceVisualResults(diceResults: number[]): void {
    if (this.diceComponents) {
      const diceArray = this.diceComponents.toArray();
      diceResults.forEach((result, index) => {
        if (diceArray[index]) {
          diceArray[index].resultado = result;
        }
      });
    }
  }

  // Método específico para continuar desde los resultados de dados en fase de lanzamiento
  onContinueFromDiceResults(): void {
    if (this.isLoading) return;
    
    // En la fase de lanzamiento, después de mostrar resultados, continuar al backend
    // para procesar y avanzar a la fase de estrés
    this.advanceToStressPhase.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Resetear showDiceResults cuando cambie el combatState
    if (changes['combatState']) {
      this.showDiceResults = false;
      this.selectedDiceIndex = -1;
    }
  }
}

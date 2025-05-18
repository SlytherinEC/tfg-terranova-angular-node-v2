import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-armory-resolver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './armory-resolver.component.html',
  styleUrl: './armory-resolver.component.scss'
})
export class ArmoryResolverComponent implements OnInit {
  @Input() options: any[] = [];
  @Input() isLoading: boolean = false;
  @Output() optionSelected = new EventEmitter<string>();

  // Para mostrar descripción de la opción al pasar el ratón
  hoveredOption: string | null = null;

  ngOnInit() {
    // Depuración para verificar que las opciones lleguen correctamente
    console.log('Armory options received:', this.options);
  }

  onOptionSelect(optionId: string): void {
    if (this.isLoading) return;
    this.optionSelected.emit(optionId);
  }

  setHoveredOption(optionId: string | null): void {
    this.hoveredOption = optionId;
  }

  getOptionDescription(optionId: string): string {
    switch (optionId) {
      case 'recargar_armas':
        return 'Restaura la munición al máximo para todas tus armas';
      case 'reparar_traje':
        return 'Restaura tu traje a 6 puntos (máximo)';
      case 'recargar_y_reparar':
        return 'Recarga el arma con menos munición y recupera 3 puntos de traje';
      default:
        return '';
    }
  }
}
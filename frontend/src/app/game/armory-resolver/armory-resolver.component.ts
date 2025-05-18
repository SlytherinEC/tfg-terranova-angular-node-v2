import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-armory-resolver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './armory-resolver.component.html',
  styleUrl: './armory-resolver.component.scss'
})
export class ArmoryResolverComponent {
  @Input() options: any[] = [];
  @Input() isLoading: boolean = false;
  @Output() optionSelected = new EventEmitter<{ opcion: string, arma?: string }>();

  // Para mostrar descripción de la opción al pasar el ratón
  hoveredOption: string | null = null;

  // Estado para mostrar selección de arma
  mostrarSeleccionArma: boolean = false;
  armasDisponibles: any[] = [];
  opcionSeleccionada: string | null = null;

  // Estado para mostrar mensaje de confirmación
  accionCompletada: boolean = false;
  mensajeResultado: string = '';

  onOptionSelect(optionId: string): void {
    if (this.isLoading) return;

    // Si es la opción que requiere selección de arma
    if (optionId === 'recargar_y_reparar') {
      // Primero emitimos la opción sin arma
      this.opcionSeleccionada = optionId;
      this.optionSelected.emit({ opcion: optionId });
    } else {
      // Para las demás opciones, emitimos directamente
      this.optionSelected.emit({ opcion: optionId });
    }
  }

  // Método para cuando se reciben las armas disponibles
  mostrarArmas(armas: any[]): void {
    this.mostrarSeleccionArma = true;
    this.armasDisponibles = armas;
  }

  // Método para seleccionar un arma
  seleccionarArma(armaId: string): void {
    if (this.isLoading || !this.opcionSeleccionada) return;

    this.optionSelected.emit({
      opcion: this.opcionSeleccionada,
      arma: armaId
    });

    // Limpiar estado
    this.mostrarSeleccionArma = false;
    this.opcionSeleccionada = null;
  }

  // Método para mostrar el resultado de la acción
  mostrarResultado(mensaje: string): void {
    this.accionCompletada = true;
    this.mensajeResultado = mensaje;
  }

  // Método para salir
  salir(): void {
    this.optionSelected.emit({ opcion: 'salir' });
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
        return 'Recarga el arma que elijas y recupera 3 puntos de traje';
      default:
        return '';
    }
  }
}
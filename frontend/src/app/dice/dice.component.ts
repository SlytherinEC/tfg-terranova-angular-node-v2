// dice.component.ts
import { Component, Input } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.scss'],
  animations: [
    trigger('diceAnimation', [
      transition('* => *', [
        animate('1000ms ease-out')
      ])
    ])
  ]
})
export class DiceComponent {
  @Input() resultado: number = 1;
  rotateX: number = 0;
  rotateY: number = 0;
  isRolling: boolean = false;
  
  // Mapeo de resultados a rotaciones
  // Cada número del dado tiene una rotación específica en los ejes X e Y
  private rotationMap: { [key: number]: { x: number; y: number } } = {
    1: { x: 0, y: 0 },      // Cara frontal - 1
    2: { x: 0, y: 90 },     // Cara derecha - 2
    3: { x: -90, y: 0 },    // Cara superior - 3
    4: { x: 90, y: 0 },     // Cara inferior - 4
    5: { x: 0, y: -90 },    // Cara izquierda - 5
    6: { x: 0, y: 180 }     // Cara trasera - 6
  };
  
  lanzarDado() {
    if (this.isRolling) return;
    
    this.isRolling = true;
    
    // Generar rotaciones aleatorias durante la animación
    const randomX = Math.floor(Math.random() * 5) * 360;
    const randomY = Math.floor(Math.random() * 5) * 360;
    
    // Obtener un resultado aleatorio entre 1 y 6
    this.resultado = Math.floor(Math.random() * 6) + 1;
    
    // Aplicar la rotación correspondiente al resultado + rotaciones adicionales
    const targetRotation = this.rotationMap[this.resultado];
    this.rotateX = randomX + targetRotation.x;
    this.rotateY = randomY + targetRotation.y;
    
    // Reiniciar el estado después de la animación
    setTimeout(() => {
      this.isRolling = false;
    }, 1000);
  }
}
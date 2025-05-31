import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-modal.component.html',
  styleUrl: './info-modal.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class InfoModalComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() title: string = 'Información';
  @Input() message: string = '';
  @Output() close = new EventEmitter<void>();

  ngOnInit(): void {
    console.log('InfoModalComponent inicializado');
  }

  ngOnChanges(): void {
    console.log('InfoModalComponent cambios:', { show: this.show, title: this.title, message: this.message });
  }

  onClose(): void {
    console.log('InfoModalComponent cerrando modal');
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    console.log('InfoModalComponent click en backdrop');
    // Solo cerrar si se hace clic en el backdrop, no en el contenido del modal
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
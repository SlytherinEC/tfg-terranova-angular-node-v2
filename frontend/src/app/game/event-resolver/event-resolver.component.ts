import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-event-resolver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-resolver.component.html',
  styleUrl: './event-resolver.component.scss'
})
export class EventResolverComponent {
  @Input() event: any;
  @Input() isLoading: boolean = false;
  @Output() optionSelected = new EventEmitter<string>();

  onOptionSelect(optionId: string): void {
    this.optionSelected.emit(optionId);
  }
}

import { Component } from '@angular/core';
import { DiceComponent } from '../dice/dice.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DiceComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}

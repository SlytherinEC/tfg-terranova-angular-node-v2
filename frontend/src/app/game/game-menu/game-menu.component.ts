import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game-menu',
  imports: [CommonModule, FormsModule],
  templateUrl: './game-menu.component.html',
  styleUrl: './game-menu.component.scss'
})
export class GameMenuComponent implements OnInit {
  partidas: any[] = [];
  dificultadSeleccionada: string = 'NORMAL';
  cargando: boolean = false;
  error: string | null = null;

  constructor(private gameService: GameService, private router: Router) { }

  ngOnInit(): void {
    this.cargarPartidas();
  }

  cargarPartidas(): void {
    this.cargando = true;
    this.gameService.obtenerPartidas().subscribe({
      next: (partidas) => {
        this.partidas = partidas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar partidas:', err);
        this.error = 'Error al cargar partidas guardadas';
        this.cargando = false;
      }
    });
  }

  iniciarNuevaPartida(): void {
    this.cargando = true;
    this.gameService.nuevaPartida(this.dificultadSeleccionada).subscribe({
      next: (response) => {
        this.cargando = false;
        // Navegar a la pantalla de juego
        this.router.navigate(['/game/play', response.partida.id_partida]);
      },
      error: (err) => {
        console.error('Error al crear partida:', err);
        this.error = 'Error al crear nueva partida';
        this.cargando = false;
      }
    });
  }

  cargarPartida(idPartida: number): void {
    this.cargando = true;
    this.gameService.cargarPartida(idPartida).subscribe({
      next: () => {
        this.cargando = false;
        // Navegar a la pantalla de juego
        this.router.navigate(['/game/play', idPartida]);
      },
      error: (err) => {
        console.error('Error al cargar partida:', err);
        this.error = 'Error al cargar partida seleccionada';
        this.cargando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}

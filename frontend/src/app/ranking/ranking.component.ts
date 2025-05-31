import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingService, RankingUsuario } from '../services/ranking.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { TokenData } from '../token-data';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent implements OnInit {
  ranking: RankingUsuario[] = [];
  usuarioActual: TokenData | null = null;
  nombreUsuario: string = '';
  imagenPerfil: string = 'default_user.png';
  menuAbierto: boolean = false;
  cargando: boolean = false;
  mensajeError: string = '';
  totalUsuarios: number = 0;
  fechaActualizacion: string = '';

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.cargarRanking();
  }

  cargarDatosUsuario(): void {
    this.usuarioActual = this.authService.obtenerDatosToken();
    
    this.userService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.nombreUsuario = usuario.nombre;
        this.imagenPerfil = usuario.image || 'default_user.png';
      },
      error: (err) => {
        console.error('Error al obtener datos del usuario', err);
      }
    });
  }

  cargarRanking(): void {
    this.cargando = true;
    this.mensajeError = '';
    
    this.rankingService.obtenerRanking().subscribe({
      next: (response) => {
        this.ranking = response.ranking;
        this.totalUsuarios = response.total_usuarios;
        this.fechaActualizacion = new Date(response.fecha_actualizacion).toLocaleString('es-ES');
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar ranking:', error);
        this.mensajeError = 'Error al cargar el ranking de usuarios';
        this.cargando = false;
      }
    });
  }

  esUsuarioActual(id: number): boolean {
    return this.usuarioActual?.id_usuario === id;
  }

  obtenerClasePosicion(posicion: number): string {
    switch (posicion) {
      case 1: return 'first-place';
      case 2: return 'second-place';
      case 3: return 'third-place';
      default: return '';
    }
  }

  obtenerMedalla(posicion: number): string {
    switch (posicion) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  obtenerClaseRango(rango: string): string {
    switch (rango) {
      case 'GENERAL': return 'rango-general';
      case 'ALMIRANTE': return 'rango-almirante';
      case 'MAYOR': return 'rango-mayor';
      case 'CAPITAN': return 'rango-capitan';
      case 'OFICIAL': return 'rango-oficial';
      default: return 'rango-cadete';
    }
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
    this.menuAbierto = false;
  }

  actualizarRanking(): void {
    this.cargarRanking();
  }

  trackByUserId(index: number, usuario: RankingUsuario): number {
    return usuario.id_usuario;
  }
} 
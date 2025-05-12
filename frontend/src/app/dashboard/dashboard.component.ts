import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { TokenData } from '../token-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit {
  userData: TokenData | null = null;
  nombreUsuario: string = '';
  imagenPerfil: string = 'default_user.png';
  esAdmin: boolean = false;
  menuAbierto: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.userData = this.authService.obtenerDatosToken();
    this.esAdmin = this.authService.esAdmin();

    if (this.userData) {
      this.obtenerDatosUsuario();
    } else {
      this.router.navigate(['/login']);
    }
  }

  obtenerDatosUsuario(): void {
    this.userService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.nombreUsuario = usuario.nombre;
        this.imagenPerfil = usuario.image || 'default_user.png';
        this.esAdmin = usuario.id_rol === 1; // Actualizar rol en caso de cambios en el servidor
      },
      error: (err) => {
        console.error('Error al obtener datos del usuario', err);
        this.authService.cerrarSesion();
        this.router.navigate(['/login']);
      }
    });
  }

  async logout(): Promise<void> {
    try {
      this.authService.cerrarSesion();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  navegarAJuego(): void {
    this.router.navigate(['/game']);
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
    this.menuAbierto = false;
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInsideNavbar = this.elementRef.nativeElement.querySelector('.navbar')?.contains(event.target);
    const clickedOnMenuToggle = this.elementRef.nativeElement.querySelector('.menu-toggle')?.contains(event.target);

    if (this.menuAbierto && !clickedInsideNavbar && !clickedOnMenuToggle) {
      this.menuAbierto = false;
    }
  }
}

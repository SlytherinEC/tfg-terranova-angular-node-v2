import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceComponent } from '../dice/dice.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { TokenData } from '../token-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DiceComponent],
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
    private router: Router,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.userData = this.authService.obtenerDatosToken();
    this.esAdmin = this.authService.esAdmin();
    
    // Aquí normalmente harías una petición al backend para obtener más datos del usuario
    // como su nombre completo e imagen de perfil
    if (this.userData) {
      this.obtenerNombreUsuario(this.userData.id_usuario);
    }
  }

  obtenerNombreUsuario(userId: number): void {
    // En una implementación real, esta sería una llamada HTTP
    // Por ahora, vamos a simular que obtenemos los datos
    setTimeout(() => {
      this.nombreUsuario = `Usuario_${userId}`;
      this.imagenPerfil = `user_${userId}.png`;
    }, 100);
  }

  async logout(): Promise<void> {
    try {
      this.authService.cerrarSesion();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
    this.menuAbierto = false; // Cierra el menú después de navegar
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  // Cierra el menú cuando se hace clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Si se hace clic fuera del menú y del botón hamburguesa, cerrar el menú
    const clickedInsideNavbar = this.elementRef.nativeElement.querySelector('.navbar').contains(event.target);
    const clickedOnMenuToggle = this.elementRef.nativeElement.querySelector('.menu-toggle').contains(event.target);
    
    if (this.menuAbierto && !clickedInsideNavbar && !clickedOnMenuToggle) {
      this.menuAbierto = false;
    }
  }
}
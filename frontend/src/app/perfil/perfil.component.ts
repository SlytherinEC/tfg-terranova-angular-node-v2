import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  usuario: any = null;
  imagenPerfil: string = 'default_user.png';
  nombreUsuario: string = '';
  menuAbierto: boolean = false;
  
  modoFormulario: 'editar' | 'contrasena' | null = null;
  formularioPerfil: FormGroup;
  formularioContrasena: FormGroup;
  
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formularioPerfil = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.formularioContrasena = this.fb.group({
      contrasenaActual: ['', [Validators.required]],
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.cargarDatosPerfil();
  }

  cargarDatosPerfil(): void {
    this.cargando = true;
    this.userService.obtenerPerfil().subscribe({
      next: (data) => {
        this.usuario = data;
        this.nombreUsuario = data.nombre;
        this.imagenPerfil = data.image || 'default_user.png';
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener perfil:', error);
        this.mensajeError = 'Error al cargar los datos del perfil';
        this.cargando = false;
      }
    });
  }

  mostrarFormularioEditar(): void {
    this.modoFormulario = 'editar';
    this.formularioPerfil.reset({
      nombre: this.usuario.nombre,
      email: this.usuario.email
    });
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  mostrarFormularioContrasena(): void {
    this.modoFormulario = 'contrasena';
    this.formularioContrasena.reset();
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cancelarFormulario(): void {
    this.modoFormulario = null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  guardarPerfil(): void {
    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const datosActualizados = this.formularioPerfil.value;

    this.userService.actualizarPerfil(datosActualizados).subscribe({
      next: (response) => {
        this.mensajeExito = 'Perfil actualizado exitosamente';
        this.cargando = false;
        this.modoFormulario = null;
        this.cargarDatosPerfil(); // Recargar datos
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        this.mensajeError = error.error?.message || 'Error al actualizar el perfil';
        this.cargando = false;
      }
    });
  }

  cambiarContrasena(): void {
    if (this.formularioContrasena.invalid) {
      this.formularioContrasena.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { contrasenaActual, nuevaContrasena } = this.formularioContrasena.value;

    this.userService.cambiarContrasena(contrasenaActual, nuevaContrasena).subscribe({
      next: (response) => {
        this.mensajeExito = 'Contraseña actualizada exitosamente';
        this.cargando = false;
        this.modoFormulario = null;
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.mensajeError = error.error?.message || 'Error al cambiar la contraseña';
        this.cargando = false;
      }
    });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
    this.menuAbierto = false;
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/home']);
  }
}
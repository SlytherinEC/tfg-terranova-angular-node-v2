import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss'
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuarioSeleccionado: any = null;
  nombreUsuario: string = '';
  imagenPerfil: string = 'default_user.png';
  menuAbierto: boolean = false;
  modoFormulario: 'crear' | 'editar' | 'contrasena' | null = null;
  formularioUsuario: FormGroup;
  formularioContrasena: FormGroup;
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formularioUsuario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      id_rol: [2, [Validators.required]],
      contrasena: ['']
    });

    this.formularioContrasena = this.fb.group({
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.esAdmin()) {
      this.router.navigate(['/no-autorizado']);
      return;
    }

    this.cargarDatosUsuario();
    this.cargarUsuarios();
  }

  cargarDatosUsuario(): void {
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

  cargarUsuarios(): void {
    this.cargando = true;
    this.adminService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this.mensajeError = 'Error al cargar la lista de usuarios';
        this.cargando = false;
      }
    });
  }

  mostrarFormularioCrear(): void {
    this.modoFormulario = 'crear';
    this.usuarioSeleccionado = null;
    this.formularioUsuario.reset({
      nombre: '',
      email: '',
      id_rol: 2,
      contrasena: ''
    });
    
    // En modo crear, la contraseña es obligatoria
    this.formularioUsuario.get('contrasena')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.formularioUsuario.get('contrasena')?.updateValueAndValidity();
    
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  mostrarFormularioEditar(usuario: any): void {
    this.modoFormulario = 'editar';
    this.usuarioSeleccionado = usuario;
    this.formularioUsuario.reset({
      nombre: usuario.nombre,
      email: usuario.email,
      id_rol: usuario.id_rol
    });
    
    // En modo editar, la contraseña es opcional
    this.formularioUsuario.get('contrasena')?.clearValidators();
    this.formularioUsuario.get('contrasena')?.updateValueAndValidity();
    
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  mostrarFormularioContrasena(usuario: any): void {
    this.modoFormulario = 'contrasena';
    this.usuarioSeleccionado = usuario;
    this.formularioContrasena.reset();
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cancelarFormulario(): void {
    this.modoFormulario = null;
    this.usuarioSeleccionado = null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  guardarUsuario(): void {
    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const formData = this.formularioUsuario.value;

    if (this.modoFormulario === 'crear') {
      this.adminService.crearUsuario(formData).subscribe({
        next: (response) => {
          this.mensajeExito = 'Usuario creado exitosamente';
          this.cargando = false;
          this.modoFormulario = null;
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al crear usuario', error);
          this.mensajeError = error.error?.message || 'Error al crear el usuario';
          this.cargando = false;
        }
      });
    } else if (this.modoFormulario === 'editar' && this.usuarioSeleccionado) {
      // Si el campo contraseña está vacío, lo eliminamos del objeto
      if (!formData.contrasena) {
        delete formData.contrasena;
      }

      this.adminService.actualizarUsuario(this.usuarioSeleccionado.id_usuario, formData).subscribe({
        next: (response) => {
          this.mensajeExito = 'Usuario actualizado exitosamente';
          this.cargando = false;
          this.modoFormulario = null;
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al actualizar usuario', error);
          this.mensajeError = error.error?.message || 'Error al actualizar el usuario';
          this.cargando = false;
        }
      });
    }
  }

  cambiarContrasena(): void {
    if (this.formularioContrasena.invalid) {
      this.formularioContrasena.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const nuevaContrasena = this.formularioContrasena.value.nuevaContrasena;
    
    // Verificamos que la contraseña no sea vacía o undefined
    if (!nuevaContrasena) {
      this.mensajeError = 'La nueva contraseña es obligatoria';
      this.cargando = false;
      return;
    }

    // Enviamos un objeto con el campo nuevaContrasena
    this.adminService.cambiarContrasena(this.usuarioSeleccionado.id_usuario, nuevaContrasena).subscribe({
      next: (response) => {
        this.mensajeExito = 'Contraseña actualizada exitosamente';
        this.cargando = false;
        this.modoFormulario = null;
      },
      error: (error) => {
        console.error('Error al cambiar contraseña', error);
        this.mensajeError = error.error?.message || 'Error al cambiar la contraseña';
        this.cargando = false;
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (!confirm(`¿Estás seguro que deseas eliminar al usuario ${usuario.nombre}?`)) {
      return;
    }

    this.cargando = true;
    this.adminService.eliminarUsuario(usuario.id_usuario).subscribe({
      next: (response) => {
        this.mensajeExito = 'Usuario eliminado exitosamente';
        this.cargando = false;
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al eliminar usuario', error);
        this.mensajeError = error.error?.message || 'Error al eliminar el usuario';
        this.cargando = false;
      }
    });
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

  esUsuarioActual(id: number): boolean {
    const datosToken = this.authService.obtenerDatosToken();
    return datosToken?.id_usuario === id;
  }

  getNombreRol(idRol: number): string {
    return idRol === 1 ? 'Administrador' : 'Usuario';
  }
}
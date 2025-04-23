import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from './usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:4205/api/usuarios';

  constructor(private http: HttpClient) { }

  // Métodos para registrar un nuevo usuario
  registro(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, {
      nombre: usuario.nombre,
      email: usuario.email,
      contrasena: usuario.contrasena
    });
  }

  // Método para iniciar sesión
  login(email: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, contrasena });
  }

  // Método para verificar si el usuario está autenticado
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  // Método para guardar el token en localStorage
  guardarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Método para obtener el token
  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para cerrar sesión. Elimina el token de localStorage
  cerrarSesion(): void {
    localStorage.removeItem('token');
  }

  // Método para obtener header con token JWT
  obtenerHeadersAuth(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    })
  }

}

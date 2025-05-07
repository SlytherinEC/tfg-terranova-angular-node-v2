import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:4205/api/admin';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });
  }

  // Obtener todos los usuarios
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() });
  }

  // Obtener un usuario por ID
  getUsuarioById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${id}`, { headers: this.getHeaders() });
  }

  // Crear un nuevo usuario
  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios`, usuario, { headers: this.getHeaders() });
  }

  // Actualizar un usuario existente
  actualizarUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/usuarios/${id}`, usuario, { headers: this.getHeaders() });
  }

  // Cambiar contraseña de un usuario
  cambiarContrasena(id: number, nuevaContrasena: string): Observable<any> {
    // Asegurarse de que el backend reciba exactamente lo que espera
    const datos = { nuevaContrasena };
    
    console.log('Datos enviados al backend:', datos);
    
    return this.http.patch<any>(
      `${this.apiUrl}/usuarios/${id}/contrasena`, 
      datos, 
      { headers: this.getHeaders() }
    );
  }

  // Eliminar un usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`, { headers: this.getHeaders() });
  }

  // Obtener estadísticas de usuarios
  getEstadisticasUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/usuarios`, { headers: this.getHeaders() });
  }
}
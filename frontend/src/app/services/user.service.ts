import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:4205/api/usuarios';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });
  }

  obtenerUsuarioPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  obtenerPerfil(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/perfil`, { headers: this.getHeaders() });
  }

  actualizarPerfil(datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/perfil`, datos, { headers: this.getHeaders() });
  }

  cambiarContrasena(contrasenaActual: string, nuevaContrasena: string): Observable<any> {
    const datos = {
      contrasenaActual,
      nuevaContrasena
    };
    return this.http.patch<any>(`${this.apiUrl}/cambiar-contrasena`, datos, { headers: this.getHeaders() });
  }
}
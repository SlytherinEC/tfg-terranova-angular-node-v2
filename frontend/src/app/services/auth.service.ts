import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../usuario';
import { TokenData } from '../token-data';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:4205/api/usuarios';
  private tokenVerificationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Iniciar verificación periódica de tokens
    this.iniciarVerificacionTokens();
  }

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
    const token = this.obtenerToken();
    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado
    try {
      const decodedToken = jwtDecode<TokenData>(token);
      const now = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp < now) {
        // Token expirado, pero aún podríamos tener un refresh token válido
        const refreshToken = this.obtenerRefreshToken();
        if (!refreshToken) {
          this.cerrarSesion();
          return false;
        }

        try {
          const decodedRefresh = jwtDecode<TokenData>(refreshToken);
          return decodedRefresh.exp ? decodedRefresh.exp > now : false;
        } catch {
          this.cerrarSesion();
          return false;
        }
      }

      return true;
    } catch {
      this.cerrarSesion();
      return false;
    }
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
    // localStorage.removeItem('token');
    // localStorage.removeItem('refreshToken');
    localStorage.clear(); // solo si no guardas otras cosas

    // Asegurarse de que la navegación se realiza solo si no estamos ya en login
    if (!this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
  }

  // Método para obtener header con token JWT
  obtenerHeadersAuth(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  obtenerDatosToken(): TokenData | null {
    const token = this.obtenerToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<TokenData>(token);
    } catch (error) {
      return null;
    }
  }

  // Método para verificar si el usuario tiene rol de administrador
  esAdmin(): boolean {
    const datos = this.obtenerDatosToken();
    return datos ? datos.id_rol === 1 : false;
  }

  guardarRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  obtenerRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getEnlaceApi(): string {
    return this.apiUrl;
  }

  // Método para verificar la validez de los tokens
  verificarTokens(): void {
    if (!this.estaAutenticado()) {
      this.cerrarSesion();
    }
  }

  // Iniciar verificación periódica de tokens
  private iniciarVerificacionTokens(): void {
    // Verificar tokens cada 30 segundos
    this.tokenVerificationTimer = setInterval(() => {
      this.verificarTokens();
    }, 30000); // 30 segundos
  }

  ngOnDestroy(): void {
    if (this.tokenVerificationTimer) {
      clearInterval(this.tokenVerificationTimer);
    }
  }
}
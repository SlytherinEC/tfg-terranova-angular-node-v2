import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RankingUsuario {
  id_usuario: number;
  nombre: string;
  email: string;
  imagen_perfil: string;
  fecha_registro: string;
  total_logros: number;
  partidas_jugadas: number;
  partidas_ganadas: number;
  mejor_rango: string;
  porcentaje_victoria: number;
  posicion: number;
}

export interface RankingResponse {
  ranking: RankingUsuario[];
  total_usuarios: number;
  fecha_actualizacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private apiUrl = `${environment.apiUrl}/ranking`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });
  }

  // Obtener ranking global de usuarios
  obtenerRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(this.apiUrl, { headers: this.getHeaders() });
  }
} 
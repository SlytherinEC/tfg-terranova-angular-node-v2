import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:4205/api/usuarios';

  constructor(private http: HttpClient, private authService: AuthService) { }

  obtenerUsuarioPorId(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  obtenerPerfil(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });
    return this.http.get<any>(`${this.apiUrl}/perfil`, { headers });
  }

}

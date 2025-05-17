// src/app/services/map.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { HexCell } from '../game/hex-map/hex-map.component';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = 'http://localhost:4205/api/game/mapas';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener mapa para una partida específica
  obtenerMapa(idPartida: number): Observable<HexCell[][]> {
    return this.http.get<any>(`${this.apiUrl}/${idPartida}`, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      map(response => response.mapa),
      catchError(error => {
        console.error('Error al obtener mapa:', error);
        // Devolver un mapa vacío en caso de error
        return of([]);
      })
    );
  }

  // Guardar cambios en el mapa (por ejemplo, cuando se explora una celda)
  actualizarMapa(idPartida: number, mapa: HexCell[][]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPartida}`, { mapa }, {
      headers: this.authService.obtenerHeadersAuth()
    }).pipe(
      catchError(error => {
        console.error('Error al actualizar mapa:', error);
        throw error;
      })
    );
  }

  // Generar un mapa nuevo con la estructura definida
  generarMapaInicial(): HexCell[][] {
    // Mapeo de los tipos de celdas por fila
    const mapDefinition = [
      ['inicio'],
      ['explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable', 'explorable'],
      ['evento_aleatorio', 'inaccesible', 'explorable', 'explorable', 'explorable', 'evento_aleatorio'],
      ['explorable', 'explorable', 'inaccesible', 'puerta_bloqueada', 'inaccesible', 'explorable', 'explorable'],
      ['explorable', 'estacion_oxigeno', 'inaccesible', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'puerta_bloqueada'],
      ['explorable', 'explorable', 'explorable', 'inaccesible', 'armeria', 'explorable', 'explorable', 'inaccesible', 'explorable', 'explorable', 'inaccesible'],
      ['puerta_bloqueada', 'explorable', 'inaccesible', 'inaccesible', 'inaccesible', 'evento_aleatorio', 'inaccesible', 'estacion_oxigeno', 'explorable', 'evento_aleatorio'],
      ['explorable', 'inaccesible', 'inaccesible', 'explorable', 'bahia_carga', 'inaccesible', 'control', 'inaccesible', 'explorable', 'explorable', 'seguridad'],
      ['explorable', 'evento_aleatorio', 'explorable', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'explorable', 'explorable', 'explorable'],
      ['explorable', 'explorable', 'explorable', 'explorable', 'estacion_oxigeno', 'inaccesible', 'armeria'],
      ['inaccesible', 'explorable', 'explorable', 'explorable', 'explorable', 'inaccesible'],
      ['bahia_escape']
    ];

    // Configuración de las puertas bloqueadas
    const puertasBloqueadas = [
      { y: 6, x: 3, codigos: 4 },
      { y: 7, x: 7, codigos: 1 },
      { y: 9, x: 0, codigos: 3 },
      { y: 14, x: 0, codigos: 6 }
    ];

    // Creamos el mapa basado en la definición
    const mapa: HexCell[][] = [];

    for (let y = 0; y < mapDefinition.length; y++) {
      const row: HexCell[] = [];
      const rowDef = mapDefinition[y];

      for (let x = 0; x < rowDef.length; x++) {
        const tipo = rowDef[x] as any;

        // Verificar si esta celda es una puerta bloqueada
        const esPuerta = tipo === 'puerta_bloqueada' ||
          (tipo === 'bahia_escape' && y === 14 && x === 0);

        let codigosRequeridos = 0;

        if (esPuerta) {
          // Encontrar cuántos códigos requiere esta puerta
          const puerta = puertasBloqueadas.find(p => p.y === y && p.x === x);
          codigosRequeridos = puerta ? puerta.codigos : 0;
        }

        const cell: HexCell = {
          x,
          y,
          tipo,
          explorado: tipo === 'inicio',  // Solo el inicio está explorado inicialmente
          puerta_bloqueada: esPuerta,
          codigos_requeridos: codigosRequeridos
        };

        row.push(cell);
      }

      mapa.push(row);
    }

    return mapa;
  }
}
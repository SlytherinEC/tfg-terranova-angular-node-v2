import { HttpErrorResponse, HttpRequest, HttpInterceptorFn, HttpHandlerFn, HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { TokenRefreshService } from "../services/token-refresh.service";

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const tokenService = inject(TokenRefreshService);

  // Evitar intentar refrescar el token si ya estamos haciendo una petición de refresh
  if (req.url.includes('/refresh')) {
    return next(req).pipe(
      catchError((error) => {
        console.warn('[Interceptor] Error en refresh. Cerrando sesión...');
        authService.cerrarSesion();
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  const accessToken = authService.obtenerToken();

  // Condicion ternaria para verificar si el token es válido o no
  const authReq = accessToken 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) 
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = authService.obtenerRefreshToken();

      const puedeRenovar = 
        (error.status === 401 || error.status === 403) && 
        refreshToken &&
        tokenService.hayActividadReciente();

      if (puedeRenovar) {
        console.warn('[Interceptor] Token expirado. Intentando refrescar...');
        
        return http.post<{ accessToken: string}>(`${authService.getEnlaceApi()}/refresh`, { refreshToken })
        .pipe(
          switchMap((res) => {
            authService.guardarToken(res.accessToken);

            const nuevaPeticion = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` }
            });

            return next(nuevaPeticion);
          }),
          catchError((refreshError) => {
            console.warn('[Interceptor] Refresh token inválido. Cerrando sesión...');
            authService.cerrarSesion();
            router.navigate(['/login']);   
            return throwError(() => refreshError);         
          })
        );
      }

      if (error.status === 401 || error.status === 403) {
        console.warn('[AuthInterceptor] Token inválido o sin permisos. Cerrando sesión...');
        authService.cerrarSesion();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
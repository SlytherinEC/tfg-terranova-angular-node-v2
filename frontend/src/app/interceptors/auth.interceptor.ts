import { HttpErrorResponse, HttpRequest, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.warn('[AuthInterceptor] Token inválido o sin permisos. Cerrando sesión...');
        authService.cerrarSesion();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};

import { Inject, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = Inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

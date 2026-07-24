import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userProfile$.pipe(
    take(1),
    map(profile => {
      if (profile) {
        // Si el usuario ya está autenticado, no puede acceder a la vista login
        router.navigate(['/dashboard']);
        return false;
      }
      return true; // Usuario no autenticado, permite ver la pantalla de login
    })
  );
};

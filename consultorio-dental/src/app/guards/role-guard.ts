import { inject } from "@angular/core";
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const roleGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.userProfile$.pipe(
      take(1),
      map(profile => {
        if (profile && rolesPermitidos.includes(profile.rol)) {
          return true; // Acceso permitido
        }

        // Si no está logueado o no tiene el rol adecuado, lo redirigimos al login
        router.navigate(['/login']);
        return false;
      })
    )
  }
}
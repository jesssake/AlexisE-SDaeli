// frontend/src/app/core/guards/role.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    console.log('🎭 RoleGuard - Verificando rol con backend');
    
    // Primero validar token
    return this.auth.validarToken().pipe(
      map(isValid => {
        if (!isValid) {
          console.log('❌ Token inválido');
          this.auth.logout();
          this.router.navigate(['/auth/login']);
          return false;
        }

        const requiredRoles = route.data['roles'] as string[];
        console.log('📋 Roles requeridos:', requiredRoles);
        
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const userRole = this.auth.getUserRole();
        
        if (this.auth.hasAnyRole(requiredRoles)) {
          console.log('✅ Rol autorizado');
          return true;
        }

        console.log('❌ Rol no autorizado');
        this.router.navigate(['/acceso-denegado']);
        return false;
      }),
      catchError(() => {
        console.log('❌ Error validando token');
        this.auth.logout();
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}
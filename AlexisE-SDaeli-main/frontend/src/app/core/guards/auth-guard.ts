// frontend/src/app/core/guards/auth-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanMatch {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  canMatch(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  private checkAuth(): Observable<boolean | UrlTree> {
    console.log('🔒 AuthGuard - Verificando autenticación con backend');
    
    // Si no hay token localmente, redirigir a login
    if (!this.authService.getToken()) {
      console.log('❌ No hay token localmente');
      return of(this.router.createUrlTree(['/auth/login']));
    }
    
    // Validar token con el backend
    return this.authService.validarToken().pipe(
      map(isValid => {
        if (isValid) {
          console.log('✅ Token válido, acceso permitido');
          return true;
        } else {
          console.log('❌ Token inválido o expirado');
          this.authService.logout();
          return this.router.createUrlTree(['/auth/login']);
        }
      }),
      catchError(() => {
        console.log('❌ Error validando token');
        this.authService.logout();
        return of(this.router.createUrlTree(['/auth/login']));
      })
    );
  }
}

export const authGuard = AuthGuard;
export const canMatchAuth = AuthGuard;
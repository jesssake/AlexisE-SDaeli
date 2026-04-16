// frontend/src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token
    const token = this.authService.getToken();
    
    // =====================================================
    // 🔐 AGREGAR TOKEN A LA PETICIÓN
    // =====================================================
    let authReq = req;
    
    // Solo agregar token si no es una petición pública
    const esRutaPublica = this.esRutaPublica(req.url);
    
    if (token && !esRutaPublica) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      // Log para depuración (solo en desarrollo)
      if (!environment.production) {
        console.log(`🔑 Token agregado a: ${req.url}`);
      }
    }
    
    // =====================================================
    // 🛡️ HEADERS DE SEGURIDAD ADICIONALES
    // =====================================================
    authReq = authReq.clone({
      headers: authReq.headers
        .set('X-Content-Type-Options', 'nosniff')
        .set('X-Frame-Options', 'DENY')
        .set('X-XSS-Protection', '1; mode=block')
        .set('Cache-Control', 'no-cache')
        .set('Pragma', 'no-cache')
    });
    
    // =====================================================
    // 📡 ENVIAR PETICIÓN Y MANEJAR ERRORES
    // =====================================================
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar diferentes códigos de error
        switch (error.status) {
          case 0:
            console.error('🌐 Error de red - Servidor no disponible');
            this.mostrarError('Error de conexión. Verifica tu internet.');
            break;
            
          case 401:
            console.warn('🔒 Sesión expirada o no autorizada');
            this.authService.logout();
            this.router.navigate(['/auth/login'], {
              queryParams: { sessionExpired: 'true' }
            });
            break;
            
          case 403:
            console.warn('🚫 Acceso denegado - No tienes permisos');
            this.mostrarError('No tienes permisos para realizar esta acción.');
            this.router.navigate(['/acceso-denegado']);
            break;
            
          case 404:
            console.error('🔍 Recurso no encontrado:', req.url);
            // No redirigir automáticamente, solo log
            break;
            
          case 500:
            console.error('💥 Error interno del servidor');
            this.mostrarError('Error interno del servidor. Intenta más tarde.');
            break;
            
          default:
            console.error(`❌ Error ${error.status}:`, error.message);
        }
        
        return throwError(() => error);
      })
    );
  }
  
  // =====================================================
  // 🔓 VERIFICAR SI ES UNA RUTA PÚBLICA (NO REQUIERE TOKEN)
  // =====================================================
  private esRutaPublica(url: string): boolean {
    const rutasPublicas = [
      '/api/login',
      '/api/register',
      '/api/recuperar',
      '/api/auth/validar-token',
      '/api/health',
      '/api/test',
      '/assets/'
    ];
    
    return rutasPublicas.some(ruta => url.includes(ruta));
  }
  
  // =====================================================
  // 💬 MOSTRAR ERROR AL USUARIO (Puedes mejorarlo con un servicio de notificaciones)
  // =====================================================
  private mostrarError(mensaje: string): void {
    // Por ahora solo console.error, pero puedes usar un servicio de toast/notificación
    console.error(`⚠️ ${mensaje}`);
    
    // Si tienes un servicio de notificaciones, descomenta esto:
    // this.notificationService.error(mensaje);
  }
}

// Importar environment para detectar modo producción
import { environment } from '../../environments/environment';
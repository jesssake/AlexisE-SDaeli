// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\services\loginauth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginAuthService {
  // ✅ CAMBIO: Usar URL DIRECTA (YA FUNCIONA EN PRUEBAS)
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    console.log('🔧 LoginAuthService inicializado');
    console.log('📡 API URL:', this.apiUrl);
  }

  login(email: string, password: string): Observable<any> {
    const loginUrl = `${this.apiUrl}/login`;
    
    console.log('🔐 Intentando login...');
    console.log('📍 URL:', loginUrl);
    console.log('📧 Email:', email);
    
    const body = {
      email: email.trim(),
      password: password
    };

    return this.http.post(loginUrl, body).pipe(
      tap((response: any) => {
        console.log('✅ Login exitoso:', response);
        if (response && response.token) {
          // ✅ CAMBIADO: localStorage → sessionStorage
          sessionStorage.setItem('authToken', response.token);
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('userId', response.id?.toString() || '1');
          sessionStorage.setItem('userRole', response.rol || 'ADMIN');
          sessionStorage.setItem('userData', JSON.stringify(response));
          console.log('💾 Datos guardados en sessionStorage');
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en login:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}, Mensaje: ${error.message}`;
      
      if (error.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica que el backend tenga la ruta /api/login';
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000';
      } else if (error.status === 401) {
        errorMessage = 'Credenciales incorrectas';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ✅ CAMBIADO: sessionStorage en lugar de localStorage
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('authToken') || !!sessionStorage.getItem('token');
  }

  getToken(): string | null {
    return sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
  }

  getUserData(): any {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getUserRole(): string {
    return sessionStorage.getItem('userRole') || 'ESTUDIANTE';
  }

  getUserId(): string | null {
    return sessionStorage.getItem('userId');
  }

  logout(): void {
    sessionStorage.clear();
    console.log('✅ Sesión cerrada');
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginAuthService {
  private apiUrl = 'http://localhost:3000/api'; // âœ… Correcto - Node.js

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const loginData = {
      email: email.trim(),
      password: password
    };

    console.log('ðŸ“¤ Enviando credenciales a Node.js:', loginData);

    // âœ… CORREGIR: Quitar .php - Node.js usa rutas sin extensiÃ³n
    return this.http.post<any>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        console.log('âœ… Respuesta completa de Node.js:', response);
        console.log('ðŸ” Estructura de respuesta:', {
          success: response?.success,
          user: response?.user,
          token: response?.token,
          message: response?.message,
          status: response?.status
        });
      }),
      map(response => {
        // Adaptar diferentes estructuras de respuesta
        return this.adaptLoginResponse(response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('ðŸš¨ Error en login service:', error);
        
        let errorMessage = 'Error de conexiÃ³n';
        if (error.error instanceof ErrorEvent) {
          // Error del lado cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del lado servidor
          errorMessage = this.getServerErrorMessage(error);
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private adaptLoginResponse(response: any): any {
    // Si el backend usa una estructura diferente, la adaptamos aquÃ­
    if (response.status === 'success' && response.data) {
      return {
        success: true,
        user: response.data.user || response.data,
        token: response.data.token || response.token,
        message: response.message
      };
    }
    
    if (response.success === true) {
      return response; // Ya tiene la estructura esperada
    }

    // Para otros formatos, agregar mÃ¡s casos aquÃ­
    return response;
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'No se puede conectar al servidor Node.js. Verifica que estÃ© ejecutÃ¡ndose en puerto 3000';
      case 401:
        return 'Credenciales incorrectas';
      case 404:
        return 'Endpoint no encontrado. Verifica la ruta /api/login';
      case 500:
        return 'Error interno del servidor Node.js';
      default:
        return error.error?.message || `Error ${error.status}: ${error.message}`;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('userData');
  }

  logout(): void {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
  }

  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}

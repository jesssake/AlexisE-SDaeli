import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginAuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    console.log('🔐 Enviando login...', { email, password });
    
    return this.http.post(`${this.apiUrl}/login`, { 
      email: email,  // El backend espera "email"
      password: password 
    }).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta del login:', response);
        
        // GUARDAR LOS DATOS EN LOCALSTORAGE
        if (response && response.token) {
          // 1. Token principal
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('token', response.token);
          
          // 2. Datos del usuario
          localStorage.setItem('userId', response.id?.toString() || '1');
          localStorage.setItem('userRole', response.rol || 'ADMIN');
          
          // 3. userData completo
          localStorage.setItem('userData', JSON.stringify({
            id: response.id,
            email: email,
            rol: response.rol,
            username: response.username
          }));
          
          console.log('💾 Datos guardados en localStorage');
          console.log('- authToken:', response.token.substring(0, 20) + '...');
          console.log('- userId:', response.id || '1');
          console.log('- userRole:', response.rol || 'ADMIN');
          
        } else {
          console.error('❌ Respuesta sin token:', response);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.clear(); // Limpiar TODO
    console.log('✅ Sesión cerrada');
  }

  getUserRole(): string {
    return localStorage.getItem('userRole') || 'ESTUDIANTE';
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }
}
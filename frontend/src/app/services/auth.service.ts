import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  // Este método lo mantienes por si acaso, pero usa los datos de LoginAuthService
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userRole', response.rol || 'maestro');
          localStorage.setItem('userId', response.id || '1');
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  // Estos métodos usan los datos guardados por LoginAuthService
  getToken(): string | null {
    // Busca primero authToken, luego token
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  getUserId(): string | null {
    // Busca primero userId, luego de userData
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id?.toString();
      } catch {
        return null;
      }
    }
    
    return null;
  }

  getUserRole(): string | null {
    // Busca primero userRole, luego de userData
    const userRole = localStorage.getItem('userRole');
    if (userRole) return userRole;
    
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.rol;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  logout(): void {
    // Solo limpia los datos de AuthService
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    this.isAuthenticatedSubject.next(false);
  }
}
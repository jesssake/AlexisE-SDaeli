import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  alumnoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserValue: Usuario | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.currentUserValue = JSON.parse(userData);
      } catch (e) {
        this.currentUserValue = null;
      }
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Método alias para compatibilidad con código existente
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Nuevos métodos requeridos por los componentes
  getUserName(): string {
    return this.currentUserValue?.nombre || 'Usuario';
  }

  getUserEmail(): string {
    return this.currentUserValue?.email || 'No disponible';
  }

  get userAlumnoId(): number | null {
    return this.currentUserValue?.alumnoId || null;
  }

  get currentUser(): Usuario | null {
    return this.currentUserValue;
  }

  isStudent(): boolean {
    return this.currentUserValue?.rol === 'estudiante';
  }

  isTeacher(): boolean {
    return this.currentUserValue?.rol === 'maestro';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserValue = null;
  }

  setUser(user: Usuario): void {
    this.currentUserValue = user;
    localStorage.setItem('user', JSON.stringify(user));
  }
}

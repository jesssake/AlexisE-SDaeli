import { Injectable } from '@angular/core';

export interface UsuarioActual {
  id: number;
  rol: string;
  email?: string;
  nombre?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser: UsuarioActual | null = {
    id: 1,
    rol: 'estudiante',
    nombre: 'Luis Pérez',
    email: 'alumno@itescam.edu.mx'
  };

  logout() {
    console.log('Sesión cerrada');
    this.currentUser = null;
  }
}

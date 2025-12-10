// src/app/usuario/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type TipoUsuario = 'Administrador' | 'Cliente';

export interface Usuario {
  id: number;
  nombre: string;
  email: string | null;
  tipo_usuario: TipoUsuario;
}

export interface LoginResponse {
  success: boolean;
  user?: Usuario;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  // Usa environment.API_URL si existe; si no, /api (proxy)
  private readonly base =
    (typeof (window as any).env !== 'undefined' && (window as any).env.API_URL) ||
    (tryGetEnvAPI() ?? '/api');

  constructor(private http: HttpClient) {}

  private url(p: string) {
    return `${this.base.replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`;
  }

  /**
   * POST login (JSON: { email, password })
   * Acepta dos respuestas:
   * 1) { success: true, user: { id, nombre, email, tipo_usuario: 'Administrador'|'Cliente' } }
   * 2) { ok: true, user_id, name, email, role: 'admin'|'cliente' }
   */
  login(email: string, password: string): Observable<LoginResponse> {
    // Ajusta el nombre del archivo si usas login_usuarios.php
    const endpoint = this.url('login.php');

    return this.http.post<any>(endpoint, { email, password }).pipe(
      map((r: any): LoginResponse => {
        // Formato 1 (PHP recomendado)
        if (r?.success && r?.user) {
          const u = r.user;
          return {
            success: true,
            user: {
              id: Number(u.id),
              nombre: u.nombre,
              email: u.email ?? null,
              tipo_usuario: u.tipo_usuario === 'Administrador' ? 'Administrador' : 'Cliente',
            },
          };
        }
        // Formato 2 (antiguo)
        if (r?.ok) {
          const tipo: TipoUsuario = (String(r.role).toLowerCase() === 'admin') ? 'Administrador' : 'Cliente';
          return {
            success: true,
            user: {
              id: Number(r.user_id),
              nombre: r.name,
              email: r.email ?? null,
              tipo_usuario: tipo,
            },
          };
        }
        // Error
        return { success: false, message: r?.message || r?.error || 'Credenciales incorrectas' };
      })
    );
  }
}

/** Intento seguro de leer environment.API_URL si existe en el bundle */
function tryGetEnvAPI(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const env = require('../../environments/environment');
    return env?.environment?.API_URL ?? null;
  } catch {
    return null;
  }
}

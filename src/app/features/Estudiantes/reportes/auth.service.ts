import { Injectable } from '@angular/core';

export interface AlumnoLight {
  id: number;                // Debe ser ninos.id si es alumno
  nombre: string;
  email?: string | null;
  tutor_id?: number | null;
  avatar_url?: string | null;
  rol?: string | null;       // 'ALUMNO' | 'TUTOR' | ...
  tipo?: string | null;      // 'alumno' | 'tutor' | ...
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Lee el usuario/alumno guardado por tu menú (sin login aquí) */
  alumnoActual(): AlumnoLight | null {
    const keys = ['alumno_info', 'usuario_actual', 'user', 'sesion_usuario'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const u = JSON.parse(raw);
        const a = this.adaptar(u);
        if (a) return a;
      } catch {}
    }
    return null;
  }

  /** Permite que el menú te pase el usuario si lo necesitas */
  setDesdeMenu(usuario: any) {
    localStorage.setItem('usuario_actual', JSON.stringify(usuario));
  }

  /** Normaliza diferentes estructuras del proyecto a AlumnoLight */
  private adaptar(u: any): AlumnoLight | null {
    if (!u) return null;

    const rol = u.rol?.toString()?.toUpperCase?.() ?? null;
    if (rol && u.id && u.nombre) {
      return {
        id: Number(u.id),
        nombre: String(u.nombre),
        email: u.email ?? null,
        tutor_id: u.tutor_id ?? null,
        avatar_url: u.avatar_url ?? null,
        rol,
        tipo: u.tipo ?? null,
      };
    }

    const id = u.alumnoId ?? u.id_nino ?? u.id ?? null;
    const nombre = u.alumnoNombre ?? u.nombre ?? null;
    if (id && nombre) {
      return {
        id: Number(id),
        nombre: String(nombre),
        email: u.email ?? null,
        tutor_id: u.tutor_id ?? null,
        avatar_url: u.avatar_url ?? null,
        rol: u.rol ?? null,
        tipo: u.tipo ?? null,
      };
    }
    return null;
  }
}

// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export type RolUsuario = 'ADMIN' | 'MAESTRO' | 'ESTUDIANTE' | 'TUTOR' | string;

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  token?: string; // opcional: algunos backends lo incluyen en user
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: Usuario;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY_USER  = 'user';
  private readonly KEY_TOKEN = 'token';

  private http   = inject(HttpClient);
  private router = inject(Router);

  /** Estado observable del usuario actual */
  private _user$ = new BehaviorSubject<Usuario | null>(null);
  public  currentUser$ = this._user$.asObservable();

  constructor() {
    this.loadFromStorage(); // hidrata estado al refrescar
  }

  /** Lee usuario/estado desde storage (compat con tu login.component.ts) */
  loadFromStorage(): void {
    const raw = localStorage.getItem(this.KEY_USER);
    if (!raw) { this._user$.next(null); return; }
    try {
      const u = JSON.parse(raw) as Usuario;
      this._user$.next(u);
    } catch {
      this._user$.next(null);
    }
  }

  /** Setters usados por tu login.component.ts (compat) */
  setUser(u: Usuario): void {
    this._user$.next(u);
    localStorage.setItem(this.KEY_USER, JSON.stringify(u));
  }
  setToken(token: string): void {
    localStorage.setItem(this.KEY_TOKEN, token);
  }

  /** Getter de token actual (o null) */
  get token(): string | null {
    const t = localStorage.getItem(this.KEY_TOKEN);
    return t && t !== 'null' && t !== 'undefined' ? t : null;
  }

  /** ¿Hay sesión válida? */
  isLoggedIn(): boolean {
    return !!this.token && !!this._user$.value;
  }

  /** Guarda usuario y token en memoria + storage (camino principal) */
  private setSession(user: Usuario, token: string): void {
    const u: Usuario = { ...user, token };
    this._user$.next(u);
    localStorage.setItem(this.KEY_USER, JSON.stringify(u));
    localStorage.setItem(this.KEY_TOKEN, token);
  }

  /** Cerrar sesión y redirigir a /auth/login */
  logout(): void {
    this._user$.next(null);
    localStorage.removeItem(this.KEY_USER);
    localStorage.removeItem(this.KEY_TOKEN);
    sessionStorage.clear();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  /**
   * LOGIN real contra PHP
   * Con tu proxy.conf.js, esta ruta apunta a:
   *   /api/Login/login.php  ->  http://localhost/gestion_e/Login/login.php
   * Asegúrate de que login.php acepte JSON (php://input).
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const body = { email, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginResponse>('/api/Login/login.php', body, { headers }).pipe(
      tap((res) => {
        // Guarda sesión solo si viene success + user + token
        if (res?.success && res.user && (res.token || res.user.token)) {
          const token = res.token || (res.user.token as string);
          this.setSession(res.user, token);
        }
      }),
      map(res => res ?? { success: false, message: 'Respuesta inválida del servidor' }),
      catchError(err => {
        const msg = (err?.error?.message as string) || 'No se pudo iniciar sesión';
        return of({ success: false, message: msg } as LoginResponse);
      })
    );
  }

  // === Alternativa si tu PHP espera x-www-form-urlencoded ===
  // login(email: string, password: string): Observable<LoginResponse> {
  //   const body = new URLSearchParams({ email, password });
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  //   return this.http.post<LoginResponse>('/api/Login/login.php', body.toString(), { headers }).pipe(
  //     tap(res => {
  //       if (res?.success && res.user && (res.token || res.user.token)) {
  //         const token = res.token || (res.user.token as string);
  //         this.setSession(res.user, token);
  //       }
  //     }),
  //     catchError(() => of({ success: false, message: 'No se pudo iniciar sesión' }))
  //   );
  // }

  /** Usuario actual (sincrónico) si lo necesitas en cualquier componente */
  get currentUser(): Usuario | null {
    return this._user$.value;
  }
}

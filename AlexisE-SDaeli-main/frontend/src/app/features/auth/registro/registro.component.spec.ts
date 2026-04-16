// registro.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RegistrarTutorNinoBody {
  tutor_nombre: string;
  tutor_email: string;
  tutor_telefono: string;
  tutor_password: string;
  nino_nombre: string;
  nino_condiciones: string;
  fecha_nacimiento: string;
  security_questions: string[];
}

export interface RegistrarTutorNinoResponse {
  success: boolean;
  message?: string;
  tutor_id?: number;
  nino_id?: number;
  error?: string;
}

export interface ValidarEmailResponse {
  disponible: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistroService {
  // ✅ URL para MySQL Workbench - AJUSTA SEGÚN TU BACKEND
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * ✅ REGISTRO COMPLETO - Tutor + Niño + Preguntas Seguridad
   */
  registrarTutorNino(
    body: RegistrarTutorNinoBody
  ): Observable<RegistrarTutorNinoResponse> {
    return this.http
      .post<RegistrarTutorNinoResponse>(
        `${this.baseUrl}/registro/completo`,
        body,
        this.jsonOpts()
      )
      .pipe(
        catchError((e) =>
          this.handleError(e, 'Error al registrar tutor y niño')
        )
      );
  }

  /**
   * ✅ VALIDAR EMAIL ÚNICO
   */
  validarEmailUnico(email: string): Observable<ValidarEmailResponse> {
    return this.http
      .get<ValidarEmailResponse>(
        `${this.baseUrl}/registro/validar-email/${encodeURIComponent(email)}`
      )
      .pipe(
        catchError((e) =>
          this.handleError(e, 'Error al validar email')
        )
      );
  }

  // 🔧 UTILIDADES
  private jsonOpts() {
    return { 
      headers: new HttpHeaders({ 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }) 
    };
  }

  private handleError(
    err: HttpErrorResponse,
    fallbackMsg = 'Error de conexión'
  ): Observable<never> {
    console.error('Error en RegistroService:', err);
    
    let errorMsg = fallbackMsg;
    if (err.error instanceof ErrorEvent) {
      errorMsg = `Error: ${err.error.message}`;
    } else if (err.status === 0) {
      errorMsg = 'No hay conexión con el servidor. Verifica que el backend esté ejecutándose.';
    } else if (err.error?.message) {
      errorMsg = err.error.message;
    } else if (err.error?.error) {
      errorMsg = err.error.error;
    } else if (err.status === 404) {
      errorMsg = 'Endpoint no encontrado. Verifica la URL del servicio.';
    } else if (err.status === 500) {
      errorMsg = 'Error interno del servidor. Intenta más tarde.';
    }

    return throwError(() => new Error(errorMsg));
  }
}
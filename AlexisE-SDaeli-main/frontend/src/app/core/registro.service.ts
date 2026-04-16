// src/app/core/registro.service.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

// ==================== INTERFACES Y TIPOS ====================

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
  usuario_id?: number;
  error?: string;
  timestamp?: string;
}

export interface ValidarEmailResponse {
  disponible: boolean;
  message?: string;
  timestamp?: string;
}

export interface MetricasSistema {
  total_usuarios: number;
  total_ninos: number;
  usuarios_activos: number;
  ultimo_registro?: string;
}

export interface RegistroConfig {
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
}

// ==================== SERVICIO PRINCIPAL ====================

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private readonly http = inject(HttpClient);
  
  private readonly baseUrl = 'http://localhost:3000/api';
  private serviceConfig: RegistroConfig = {
    timeout: 10000,
    retryAttempts: 3,
    enableCache: false
  };

  private emailCache = new Map<string, { disponible: boolean; timestamp: number }>();
  private readonly CACHE_DURATION = 30000;

  // ==================== MÉTODOS PRINCIPALES ====================

  registrarTutorNino(
    body: RegistrarTutorNinoBody
  ): Observable<RegistrarTutorNinoResponse> {
    const validationError = this.validarDatosRegistro(body);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return this.http
      .post<RegistrarTutorNinoResponse>(
        `${this.baseUrl}/registro/completo`,
        this.sanitizarDatos(body),
        this.jsonOpts()
      )
      .pipe(
        timeout(this.serviceConfig.timeout),
        retry(this.serviceConfig.retryAttempts),
        map(response => this.agregarTimestamp(response)),
        catchError((error: HttpErrorResponse) => 
          this.handleRegistroError(error, body.tutor_email)
        )
      );
  }

  validarEmailUnico(email: string): Observable<ValidarEmailResponse> {
    if (!this.validarEmail(email)) {
      return throwError(() => new Error('Formato de email inválido'));
    }

    const cached = this.obtenerEmailCache(email);
    if (cached) {
      return timer(300).pipe(
        map(() => ({
          disponible: cached.disponible,
          message: cached.disponible ? 'Email disponible (cache)' : 'Email ya registrado (cache)',
          timestamp: new Date().toISOString()
        }))
      );
    }

    return this.http
      .get<ValidarEmailResponse>(
        `${this.baseUrl}/registro/validar-email/${encodeURIComponent(email)}`
      )
      .pipe(
        timeout(5000),
        retry(2),
        map(response => {
          const enhancedResponse = this.agregarTimestamp(response);
          this.guardarEmailCache(email, enhancedResponse.disponible);
          return enhancedResponse;
        }),
        catchError((error: HttpErrorResponse) => 
          this.handleValidacionError(error, email)
        )
      );
  }

  obtenerMetricas(): Observable<MetricasSistema> {
    return this.http
      .get<MetricasSistema>(`${this.baseUrl}/usuarios`)
      .pipe(
        timeout(8000),
        catchError((error: HttpErrorResponse) => 
          this.handleError(error, 'Error al obtener métricas del sistema')
        )
      );
  }

  registrarMultiple(registros: RegistrarTutorNinoBody[]): Observable<RegistrarTutorNinoResponse[]> {
    if (!registros.length) {
      return throwError(() => new Error('No hay registros para procesar'));
    }

    return new Observable(observer => {
      const resultados: RegistrarTutorNinoResponse[] = [];
      let procesados = 0;

      const procesarSiguiente = () => {
        if (procesados >= registros.length) {
          observer.next(resultados);
          observer.complete();
          return;
        }

        this.registrarTutorNino(registros[procesados]).subscribe({
          next: (resultado) => {
            resultados.push(resultado);
            procesados++;
            setTimeout(procesarSiguiente, 500);
          },
          error: (error) => {
            resultados.push({
              success: false,
              message: `Error en registro ${procesados + 1}: ${error.message}`,
              timestamp: new Date().toISOString()
            });
            procesados++;
            setTimeout(procesarSiguiente, 500);
          }
        });
      };

      procesarSiguiente();
    });
  }

  // ==================== MÉTODOS UTILITARIOS ====================

  private validarDatosRegistro(body: RegistrarTutorNinoBody): string | null {
    const validaciones = [
      { cond: !body.tutor_nombre?.trim(), mensaje: 'El nombre del tutor es requerido' },
      { cond: !body.tutor_email?.trim(), mensaje: 'El email del tutor es requerido' },
      { cond: !this.validarEmail(body.tutor_email), mensaje: 'El formato del email es inválido' },
      { cond: !body.tutor_password, mensaje: 'La contraseña es requerida' },
      { cond: body.tutor_password.length < 6, mensaje: 'La contraseña debe tener al menos 6 caracteres' },
      { cond: !body.nino_nombre?.trim(), mensaje: 'El nombre del niño es requerido' },
      { cond: !body.fecha_nacimiento, mensaje: 'La fecha de nacimiento es requerida' },
      { cond: !this.validarFechaNacimiento(body.fecha_nacimiento), mensaje: 'La fecha de nacimiento no es válida' },
      { cond: !body.security_questions || body.security_questions.length < 5, mensaje: 'Debe responder las 5 preguntas de seguridad' }
    ];

    const error = validaciones.find(v => v.cond);
    return error ? error.mensaje : null;
  }

  private sanitizarDatos(body: RegistrarTutorNinoBody): RegistrarTutorNinoBody {
    return {
      ...body,
      tutor_nombre: body.tutor_nombre.trim(),
      tutor_email: body.tutor_email.toLowerCase().trim(),
      tutor_telefono: body.tutor_telefono?.trim() || '',
      nino_nombre: body.nino_nombre.trim(),
      nino_condiciones: body.nino_condiciones?.trim() || '',
      security_questions: body.security_questions.map(q => q.trim())
    };
  }

  private handleRegistroError(error: HttpErrorResponse, email: string): Observable<never> {
    console.error('🚨 Error en registro:', {
      email,
      status: error.status,
      message: error.message
    });

    this.emailCache.delete(email);

    let userMessage = 'Error al procesar el registro';

    if (error.status === 0) {
      userMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'Datos de registro inválidos';
    } else if (error.status === 409) {
      userMessage = 'El email ya está registrado en el sistema';
    } else if (error.status === 500) {
      userMessage = 'Error interno del servidor. Por favor, intente más tarde.';
    } else if (error.status === 504) {
      userMessage = 'La solicitud tardó demasiado tiempo. Verifique su conexión.';
    }

    // Manejo específico para timeout (cuando error.status es 0 pero fue por timeout)
    if (error.status === 0 && error.message && error.message.includes('Timeout')) {
      userMessage = 'La solicitud tardó demasiado tiempo. Verifique su conexión.';
    }

    return throwError(() => new Error(userMessage));
  }

  private handleValidacionError(error: HttpErrorResponse, email: string): Observable<never> {
    console.warn('⚠️ Error validando email:', email, error.status);

    let userMessage = 'Error al validar el email';

    if (error.status === 0) {
      userMessage = 'Sin conexión al servidor';
    } else if (error.status >= 500) {
      userMessage = 'Error temporal del servidor';
    }

    return throwError(() => new Error(userMessage));
  }

  private handleError(error: HttpErrorResponse, context: string): Observable<never> {
    console.error(`🚨 ${context}:`, error);
    
    const userMessage = error.status === 0 
      ? 'Error de conexión: Verifique que el servidor esté ejecutándose'
      : `Error ${error.status}: ${error.error?.message || error.message}`;

    return throwError(() => new Error(userMessage));
  }

  // ==================== UTILIDADES DE VALIDACIÓN ====================

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validarFechaNacimiento(fecha: string): boolean {
    const fechaNac = new Date(fecha);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    
    return !isNaN(fechaNac.getTime()) && edad >= 3 && edad <= 12;
  }

  private agregarTimestamp<T>(response: T): T & { timestamp: string } {
    return {
      ...response,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== MANEJO DE CACHE ====================

  private obtenerEmailCache(email: string): { disponible: boolean; timestamp: number } | null {
    const cached = this.emailCache.get(email);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    this.emailCache.delete(email);
    return null;
  }

  private guardarEmailCache(email: string, disponible: boolean): void {
    this.emailCache.set(email, {
      disponible,
      timestamp: Date.now()
    });
  }

  limpiarCache(): void {
    this.emailCache.clear();
  }

  obtenerEstadisticasCache(): { total: number; entradas: string[] } {
    return {
      total: this.emailCache.size,
      entradas: Array.from(this.emailCache.keys())
    };
  }

  // ==================== CONFIGURACIÓN HTTP ====================

  private jsonOpts(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      })
    };
  }

  actualizarConfig(nuevaConfig: Partial<RegistroConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...nuevaConfig };
    console.log('⚙️ Configuración actualizada:', this.serviceConfig);
  }

  obtenerConfig(): RegistroConfig {
    return { ...this.serviceConfig };
  }
}

// ==================== SERVICIO DE LOGGER ====================

@Injectable({
  providedIn: 'root'
})
export class RegistroLoggerService {
  private readonly LOG_PREFIX = '📝 [RegistroService]';

  logRegistroExitoso(usuarioId: number, email: string): void {
    console.log(`${this.LOG_PREFIX} ✅ Registro exitoso - ID: ${usuarioId}, Email: ${email}`);
  }

  logErrorRegistro(error: any, contexto: string): void {
    console.error(`${this.LOG_PREFIX} 🚨 Error en ${contexto}:`, error);
  }

  logValidacionEmail(email: string, disponible: boolean): void {
    const estado = disponible ? '✅ Disponible' : '❌ Ocupado';
    console.log(`${this.LOG_PREFIX} ${estado} - Email: ${email}`);
  }
}
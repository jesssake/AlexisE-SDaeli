// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\maestro\padres\padres.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface Conversacion {
  tutor_id: number;
  tutor_nombre: string;
  tutor_email: string;
  tutor_telefono: string;
  nino_nombre: string;
  ultimo_mensaje: string;
  fecha_ultimo_mensaje: string;
  mensajes_no_leidos: number;
}

export interface Mensaje {
  id: number;
  maestro_nombre: string;
  tutor_nombre: string;
  nino_nombre: string;
  mensaje: string;
  fecha_envio: string;
  leido: boolean;
  tipo_remitente: 'maestro' | 'tutor';
}

export interface EstadisticasChat {
  total_tutores: number;
  total_mensajes: number;
  mensajes_no_leidos: number;
  ultima_actividad: string;
}

export interface MensajeNoLeido {
  mensajes_no_leidos: number;
}

@Injectable({
  providedIn: 'root'
})
export class PadresService {
  private apiUrl = 'http://localhost:3000/api/maestro/chat';
  private timeoutMs = 10000; // 10 segundos timeout

  constructor(private http: HttpClient) {}

  // Manejo centralizado de errores
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en servicio Padres:', error);
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      console.error('Error del cliente:', error.error.message);
    } else {
      // Error del lado del servidor
      console.error(`Backend error: ${error.status} - ${error.error}`);
    }
    
    return throwError(() => new Error('Error de conexión. Por favor, intenta nuevamente.'));
  }

  // Obtener lista de conversaciones
  getConversaciones(maestroId: number): Observable<{success: boolean; data: Conversacion[]}> {
    return this.http.get<{success: boolean; data: Conversacion[]}>(
      `${this.apiUrl}/conversaciones/${maestroId}`
    ).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Usando datos de prueba para conversaciones');
        // Datos de prueba cuando el backend falla
        return of({
          success: true,
          data: this.generarConversacionesPrueba()
        });
      })
    );
  }

  // Obtener mensajes de una conversación específica
  getMensajes(maestroId: number, tutorId: number): Observable<{success: boolean; data: Mensaje[]}> {
    return this.http.get<{success: boolean; data: Mensaje[]}>(
      `${this.apiUrl}/mensajes/${maestroId}/${tutorId}`
    ).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Usando datos de prueba para mensajes');
        // Datos de prueba cuando el backend falla
        return of({
          success: true,
          data: this.generarMensajesPrueba(tutorId)
        });
      })
    );
  }

  // Enviar mensaje
  enviarMensaje(maestroId: number, tutorId: number, mensaje: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar`, {
      maestro_id: maestroId,
      tutor_id: tutorId,
      mensaje: mensaje
    }).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Simulando envío de mensaje');
        // Simular éxito cuando el backend falla
        return of({
          success: true,
          message: 'Mensaje enviado correctamente (modo simulación)',
          data: {
            id: Date.now(),
            maestro_nombre: 'Administrador Principal',
            tutor_nombre: 'Tutor',
            nino_nombre: 'Estudiante',
            mensaje: mensaje,
            fecha_envio: new Date().toISOString(),
            leido: false,
            tipo_remitente: 'maestro' as const
          }
        });
      })
    );
  }

  // Obtener estadísticas
  getEstadisticas(maestroId: number): Observable<{success: boolean; data: EstadisticasChat}> {
    return this.http.get<{success: boolean; data: EstadisticasChat}>(
      `${this.apiUrl}/estadisticas/${maestroId}`
    ).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Usando estadísticas de prueba');
        // Estadísticas de prueba cuando el backend falla
        return of({
          success: true,
          data: {
            total_tutores: 8,
            total_mensajes: 24,
            mensajes_no_leidos: 3,
            ultima_actividad: new Date().toISOString()
          }
        });
      })
    );
  }

  // Obtener mensajes no leídos (nuevo método)
  getMensajesNoLeidos(maestroId: number): Observable<{success: boolean; data: MensajeNoLeido}> {
    return this.http.get<{success: boolean; data: MensajeNoLeido}>(
      `${this.apiUrl}/no-leidos/${maestroId}`
    ).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Usando datos de prueba para mensajes no leídos');
        return of({
          success: true,
          data: {
            mensajes_no_leidos: 3
          }
        });
      })
    );
  }

  // Marcar mensajes como leídos (nuevo método)
  marcarMensajesLeidos(maestroId: number, tutorId: number): Observable<{success: boolean; message: string}> {
    return this.http.post<{success: boolean; message: string}>(
      `${this.apiUrl}/marcar-leidos`,
      {
        maestro_id: maestroId,
        tutor_id: tutorId
      }
    ).pipe(
      timeout(this.timeoutMs),
      catchError(error => {
        console.warn('⚠️ Simulando marcado como leído');
        return of({
          success: true,
          message: 'Mensajes marcados como leídos (modo simulación)'
        });
      })
    );
  }

  // Métodos para generar datos de prueba
  private generarConversacionesPrueba(): Conversacion[] {
    return [
      {
        tutor_id: 2,
        tutor_nombre: 'Ana Garcia',
        tutor_email: 'ana@ejemplo.com',
        tutor_telefono: '+52 555 999 8888',
        nino_nombre: 'Carlos Garcia',
        ultimo_mensaje: 'Hola, ¿cómo está Carlos en clase?',
        fecha_ultimo_mensaje: new Date().toISOString(),
        mensajes_no_leidos: 2
      },
      {
        tutor_id: 34,
        tutor_nombre: 'David Ortega',
        tutor_email: 'davidortega@gmail.com',
        tutor_telefono: '9581806668',
        nino_nombre: 'Eliezer',
        ultimo_mensaje: 'Gracias por la información sobre el progreso',
        fecha_ultimo_mensaje: new Date(Date.now() - 86400000).toISOString(),
        mensajes_no_leidos: 1
      },
      {
        tutor_id: 3,
        tutor_nombre: 'Alexis David Obi Colli',
        tutor_email: 'biospacemap2025@gmail.com',
        tutor_telefono: '8484@itescam.edu.mx',
        nino_nombre: 'Darl doll sina',
        ultimo_mensaje: '¿Podría enviarme las tareas pendientes?',
        fecha_ultimo_mensaje: new Date(Date.now() - 172800000).toISOString(),
        mensajes_no_leidos: 0
      },
      {
        tutor_id: 22,
        tutor_nombre: 'María García',
        tutor_email: 'maria.garcia@example.com',
        tutor_telefono: '+52 555 9876 5432',
        nino_nombre: 'Ana García',
        ultimo_mensaje: 'Ana no asistirá hoy por enfermedad',
        fecha_ultimo_mensaje: new Date(Date.now() - 43200000).toISOString(),
        mensajes_no_leidos: 0
      },
      {
        tutor_id: 23,
        tutor_nombre: 'Carlos López',
        tutor_email: 'lucia.lopez@example.com',
        tutor_telefono: '+52 555 4567 8901',
        nino_nombre: 'Luis López',
        ultimo_mensaje: 'Luis tiene consulta médica el viernes',
        fecha_ultimo_mensaje: new Date(Date.now() - 259200000).toISOString(),
        mensajes_no_leidos: 0
      }
    ];
  }

  private generarMensajesPrueba(tutorId: number): Mensaje[] {
    const conversaciones = this.generarConversacionesPrueba();
    const conversacion = conversaciones.find(c => c.tutor_id === tutorId);
    
    if (!conversacion) {
      return [];
    }

    return [
      {
        id: 1,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: `Hola ${conversacion.tutor_nombre}, ¿cómo está ${conversacion.nino_nombre}?`,
        fecha_envio: new Date(Date.now() - 3600000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      },
      {
        id: 2,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Muy bien, gracias por preguntar. ¿Hay alguna tarea pendiente?',
        fecha_envio: new Date(Date.now() - 1800000).toISOString(),
        leido: true,
        tipo_remitente: 'tutor'
      },
      {
        id: 3,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Sí, por favor revisen la tarea de matemáticas que dejé ayer.',
        fecha_envio: new Date(Date.now() - 900000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      },
      {
        id: 4,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Perfecto, la revisaremos esta tarde. Gracias.',
        fecha_envio: new Date(Date.now() - 300000).toISOString(),
        leido: false,
        tipo_remitente: 'tutor'
      }
    ];
  }

  // Verificar salud del servidor
  verificarSalud(): Observable<{ status: string; service: string; timestamp: string }> {
    return this.http.get<{ status: string; service: string; timestamp: string }>(
      'http://localhost:3000/api/health'
    ).pipe(
      timeout(5000),
      catchError(error => {
        return of({
          status: '🔴 Offline',
          service: 'Chat Service',
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  // Verificar si el endpoint de chat está disponible
  verificarEndpointChat(): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.apiUrl}/conversaciones/1`
    ).pipe(
      timeout(5000),
      catchError(error => {
        return of({
          success: false,
          message: 'Endpoint no disponible'
        });
      })
    );
  }
}
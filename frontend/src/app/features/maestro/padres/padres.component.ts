// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\maestro\padres\padres.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

// Interfaces definidas localmente
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

@Component({
  selector: 'app-padres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './padres.component.html',
  styleUrls: ['./padres.component.scss']
})
export class PadresComponent implements OnInit, OnDestroy {
  // Variables principales
  conversaciones: Conversacion[] = [];
  mensajes: Mensaje[] = [];
  estadisticas: EstadisticasChat | null = null;
  conversacionSeleccionada: Conversacion | null = null;
  nuevoMensaje: string = '';
  maestroId: number = 1; // ID del maestro logueado
  
  // Estados
  loading: boolean = false;
  enviando: boolean = false;
  error: string = '';
  serverStatus: string = '🟡 Verificando...';
  
  // Configuración
  private apiUrl = 'http://localhost:3000/api/maestro/chat';
  private timeoutMs = 10000; // 10 segundos
  
  // Auto-refresh
  private refreshInterval: any;
  private refreshIntervalMs = 30000; // 30 segundos
  
  // Salud del servidor
  serverHealth: { status: string; service: string; timestamp: string } | null = null;
  endpointAvailable: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.verificarSaludServidor();
    this.cargarTodo();
    
    // Configurar auto-refresh
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  // ========================================
  // 🔄 CONFIGURACIÓN AUTOMÁTICA
  // ========================================
  private setupAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.conversacionSeleccionada) {
        this.cargarMensajes(this.conversacionSeleccionada.tutor_id, true);
      }
      this.cargarEstadisticas();
      this.verificarEndpointChat();
    }, this.refreshIntervalMs);
  }

  private detenerAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ========================================
  // 🌐 MÉTODOS HTTP DIRECTOS
  // ========================================
  private get<T>(url: string) {
    return this.http.get<T>(url).pipe(
      timeout(this.timeoutMs),
      catchError(error => this.handleHttpError(error, url))
    );
  }

  private post<T>(url: string, body: any) {
    return this.http.post<T>(url, body).pipe(
      timeout(this.timeoutMs),
      catchError(error => this.handleHttpError(error, url))
    );
  }

  private handleHttpError(error: any, url: string) {
    console.error(`❌ Error en ${url}:`, error);
    return throwError(() => new Error('Error de conexión con el servidor'));
  }

  // ========================================
  // 🔍 VERIFICACIÓN DE SERVIDOR
  // ========================================
  verificarSaludServidor() {
    this.get<{ status: string; service: string; timestamp: string }>(
      'http://localhost:3000/api/maestro/chat/status'
    ).subscribe({
      next: (response) => {
        this.serverHealth = response;
        this.serverStatus = response.status;
        console.log('✅ Salud del servidor:', response);
      },
      error: (error) => {
        this.serverHealth = {
          status: '🔴 Offline',
          service: 'Chat Service',
          timestamp: new Date().toISOString()
        };
        this.serverStatus = '🔴 Offline';
        console.error('❌ Error verificar salud:', error);
      }
    });
  }

  verificarEndpointChat() {
    this.get<{ success: boolean; message: string }>(
      `${this.apiUrl}/conversaciones/1`
    ).subscribe({
      next: (response) => {
        this.endpointAvailable = response.success;
      },
      error: () => {
        this.endpointAvailable = false;
      }
    });
  }

  // ========================================
  // 📂 CARGA DE DATOS
  // ========================================
  cargarTodo() {
    this.cargarConversaciones();
    this.cargarEstadisticas();
  }

  cargarConversaciones() {
    this.loading = true;
    this.error = '';
    
    this.get<{success: boolean; data: Conversacion[]}>(
      `${this.apiUrl}/conversaciones/${this.maestroId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.conversaciones = response.data;
          console.log('✅ Conversaciones cargadas:', this.conversaciones.length);
          
          // Si no hay datos del servidor, usar datos locales
          if (this.conversaciones.length === 0) {
            this.conversaciones = this.generarConversacionesLocales();
          }
          
          // Si hay una conversación seleccionada, actualizar sus datos
          if (this.conversacionSeleccionada) {
            const conversacionActualizada = this.conversaciones.find(
              c => c.tutor_id === this.conversacionSeleccionada!.tutor_id
            );
            if (conversacionActualizada) {
              this.conversacionSeleccionada = conversacionActualizada;
            }
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando conversaciones:', error);
        this.conversaciones = this.generarConversacionesLocales();
        this.error = 'Usando datos locales (servidor offline)';
        this.loading = false;
      }
    });
  }

  cargarMensajes(tutorId: number, silent: boolean = false) {
    if (!silent) {
      this.loading = true;
    }
    
    this.get<{success: boolean; data: Mensaje[]}>(
      `${this.apiUrl}/mensajes/${this.maestroId}/${tutorId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajes = response.data;
          console.log('✅ Mensajes cargados:', this.mensajes.length);
          
          // Si no hay datos del servidor, usar datos locales
          if (this.mensajes.length === 0) {
            this.mensajes = this.generarMensajesLocales(tutorId);
          }
          
          if (!silent) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando mensajes:', error);
        this.mensajes = this.generarMensajesLocales(tutorId);
        if (!silent) {
          this.error = 'Usando mensajes locales';
        }
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  cargarEstadisticas() {
    this.get<{success: boolean; data: EstadisticasChat}>(
      `${this.apiUrl}/estadisticas/${this.maestroId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          console.log('✅ Estadísticas cargadas');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        this.estadisticas = this.generarEstadisticasLocales();
      }
    });
  }

  // ========================================
  // 🎯 ACCIONES DEL USUARIO
  // ========================================
  seleccionarConversacion(conversacion: Conversacion) {
    this.conversacionSeleccionada = conversacion;
    this.error = '';
    this.cargarMensajes(conversacion.tutor_id);
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.conversacionSeleccionada || this.enviando) return;

    const mensajeTexto = this.nuevoMensaje.trim();
    this.enviando = true;
    this.error = '';

    this.post<any>(`${this.apiUrl}/enviar`, {
      maestro_id: this.maestroId,
      tutor_id: this.conversacionSeleccionada.tutor_id,
      mensaje: mensajeTexto
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta enviar mensaje:', response);
        
        // Agregar el mensaje enviado a la lista
        if (response.success && response.data) {
          this.mensajes.push(response.data);
        } else {
          // Si el servidor no responde, agregar localmente
          this.agregarMensajeLocal(mensajeTexto);
        }
        
        this.nuevoMensaje = '';
        this.enviando = false;
        
        // Actualizar datos
        setTimeout(() => {
          this.cargarConversaciones();
          this.cargarEstadisticas();
          this.scrollToBottom();
        }, 500);
      },
      error: (error) => {
        console.error('❌ Error enviando mensaje:', error);
        this.error = 'Error al enviar mensaje. Guardando localmente.';
        this.enviando = false;
        
        // Agregar localmente si falla el servidor
        this.agregarMensajeLocal(mensajeTexto);
      }
    });
  }

  private agregarMensajeLocal(mensajeTexto: string) {
    if (!this.conversacionSeleccionada) return;

    const nuevoMensaje: Mensaje = {
      id: Date.now(),
      maestro_nombre: 'Yo',
      tutor_nombre: this.conversacionSeleccionada.tutor_nombre,
      nino_nombre: this.conversacionSeleccionada.nino_nombre,
      mensaje: mensajeTexto,
      fecha_envio: new Date().toISOString(),
      leido: false,
      tipo_remitente: 'maestro'
    };
    
    this.mensajes.push(nuevoMensaje);
    this.nuevoMensaje = '';
    
    // Actualizar última conversación localmente
    const conversacionIndex = this.conversaciones.findIndex(
      c => c.tutor_id === this.conversacionSeleccionada!.tutor_id
    );
    
    if (conversacionIndex !== -1) {
      this.conversaciones[conversacionIndex].ultimo_mensaje = mensajeTexto;
      this.conversaciones[conversacionIndex].fecha_ultimo_mensaje = new Date().toISOString();
      this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
    }
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  marcarMensajesLeidos(tutorId: number) {
    this.post<{success: boolean; message: string}>(
      `${this.apiUrl}/marcar-leidos`,
      { maestro_id: this.maestroId, tutor_id: tutorId }
    ).subscribe({
      next: (response) => {
        console.log('📖 Mensajes marcados como leídos:', response.message);
        
        // Actualizar localmente
        const conversacionIndex = this.conversaciones.findIndex(c => c.tutor_id === tutorId);
        if (conversacionIndex !== -1) {
          this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
        }
      },
      error: (error) => {
        console.error('❌ Error marcando mensajes como leídos:', error);
        // Actualizar localmente igualmente
        const conversacionIndex = this.conversaciones.findIndex(c => c.tutor_id === tutorId);
        if (conversacionIndex !== -1) {
          this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
        }
      }
    });
  }

  // ========================================
  // 📋 DATOS LOCALES (BACKUP)
  // ========================================
  private generarConversacionesLocales(): Conversacion[] {
    return [
      {
        tutor_id: 1,
        tutor_nombre: 'Ana García',
        tutor_email: 'ana@ejemplo.com',
        tutor_telefono: '+52 555 123 4567',
        nino_nombre: 'Carlos García',
        ultimo_mensaje: 'Hola, ¿cómo está Carlos en clase?',
        fecha_ultimo_mensaje: new Date().toISOString(),
        mensajes_no_leidos: 2
      },
      {
        tutor_id: 2,
        tutor_nombre: 'David López',
        tutor_email: 'david@ejemplo.com',
        tutor_telefono: '+52 555 987 6543',
        nino_nombre: 'Sofía López',
        ultimo_mensaje: 'Gracias por la información sobre el progreso',
        fecha_ultimo_mensaje: new Date(Date.now() - 86400000).toISOString(),
        mensajes_no_leidos: 1
      },
      {
        tutor_id: 3,
        tutor_nombre: 'María Rodríguez',
        tutor_email: 'maria@ejemplo.com',
        tutor_telefono: '+52 555 456 7890',
        nino_nombre: 'Juan Rodríguez',
        ultimo_mensaje: 'Juan no asistirá hoy por enfermedad',
        fecha_ultimo_mensaje: new Date(Date.now() - 43200000).toISOString(),
        mensajes_no_leidos: 0
      },
      {
        tutor_id: 4,
        tutor_nombre: 'Carlos Martínez',
        tutor_email: 'carlos@ejemplo.com',
        tutor_telefono: '+52 555 321 6549',
        nino_nombre: 'Laura Martínez',
        ultimo_mensaje: '¿Podría enviarme las tareas pendientes?',
        fecha_ultimo_mensaje: new Date(Date.now() - 172800000).toISOString(),
        mensajes_no_leidos: 0
      }
    ];
  }

  private generarMensajesLocales(tutorId: number): Mensaje[] {
    const conversacion = this.conversaciones.find(c => c.tutor_id === tutorId) || 
      this.generarConversacionesLocales()[0];
    
    return [
      {
        id: 1,
        maestro_nombre: 'Profesor',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: `Hola ${conversacion.tutor_nombre}, ¿cómo está ${conversacion.nino_nombre}?`,
        fecha_envio: new Date(Date.now() - 3600000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      },
      {
        id: 2,
        maestro_nombre: 'Profesor',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Muy bien, gracias por preguntar. ¿Hay alguna tarea pendiente?',
        fecha_envio: new Date(Date.now() - 1800000).toISOString(),
        leido: true,
        tipo_remitente: 'tutor'
      },
      {
        id: 3,
        maestro_nombre: 'Profesor',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Sí, por favor revisen la tarea de matemáticas que dejé ayer.',
        fecha_envio: new Date(Date.now() - 900000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      },
      {
        id: 4,
        maestro_nombre: 'Profesor',
        tutor_nombre: conversacion.tutor_nombre,
        nino_nombre: conversacion.nino_nombre,
        mensaje: 'Perfecto, la revisaremos esta tarde. Gracias.',
        fecha_envio: new Date(Date.now() - 300000).toISOString(),
        leido: false,
        tipo_remitente: 'tutor'
      }
    ];
  }

  private generarEstadisticasLocales(): EstadisticasChat {
    return {
      total_tutores: this.conversaciones.length,
      total_mensajes: 24,
      mensajes_no_leidos: this.conversaciones.reduce((acc, conv) => acc + (conv.mensajes_no_leidos || 0), 0),
      ultima_actividad: new Date().toISOString()
    };
  }

  // ========================================
  // 🛠️ UTILIDADES
  // ========================================
  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - date.getTime();
      const unDia = 24 * 60 * 60 * 1000;

      if (diferencia < unDia) {
        // Hoy - mostrar solo hora
        return date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diferencia < 2 * unDia) {
        // Ayer
        return 'Ayer ' + date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        // Fecha completa
        return date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return fecha;
    }
  }

  formatearFechaCorta(fecha: string): string {
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - date.getTime();
      const unDia = 24 * 60 * 60 * 1000;

      if (diferencia < unDia) {
        // Hoy - mostrar solo hora
        return date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diferencia < 7 * unDia) {
        // Esta semana - mostrar día
        return date.toLocaleDateString('es-MX', {
          weekday: 'short'
        });
      } else {
        // Fecha corta
        return date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: '2-digit'
        });
      }
    } catch (error) {
      return fecha;
    }
  }

  limpiarError() {
    this.error = '';
  }

  recargarTodo() {
    this.cargarConversaciones();
    this.cargarEstadisticas();
    this.verificarSaludServidor();
    if (this.conversacionSeleccionada) {
      this.cargarMensajes(this.conversacionSeleccionada.tutor_id);
    }
  }

  getServerStatusClass(): string {
    if (this.serverStatus.includes('🟢')) return 'status-online';
    if (this.serverStatus.includes('🔴')) return 'status-offline';
    return 'status-checking';
  }

  // Manejo de teclas en textarea
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }
}
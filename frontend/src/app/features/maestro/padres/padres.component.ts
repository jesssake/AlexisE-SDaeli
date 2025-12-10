// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\maestro\padres\padres.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PadresService, Conversacion, Mensaje, EstadisticasChat } from './padres.service';

@Component({
  selector: 'app-padres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './padres.component.html',
  styleUrls: ['./padres.component.scss']
})
export class PadresComponent implements OnInit, OnDestroy {
  conversaciones: Conversacion[] = [];
  mensajes: Mensaje[] = [];
  estadisticas: EstadisticasChat | null = null;
  conversacionSeleccionada: Conversacion | null = null;
  nuevoMensaje: string = '';
  maestroId: number = 1; // ID del maestro logueado
  loading: boolean = false;
  error: string = '';
  enviando: boolean = false;
  private refreshInterval: any;

  constructor(private padresService: PadresService) {}

  ngOnInit() {
    this.cargarConversaciones();
    this.cargarEstadisticas();
    
    // Actualizar automáticamente cada 30 segundos
    this.refreshInterval = setInterval(() => {
      if (this.conversacionSeleccionada) {
        this.cargarMensajes(this.conversacionSeleccionada.tutor_id, true);
      }
      this.cargarEstadisticas();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarConversaciones() {
    this.loading = true;
    this.error = '';
    
    this.padresService.getConversaciones(this.maestroId).subscribe({
      next: (response) => {
        if (response.success) {
          this.conversaciones = response.data;
          console.log('✅ Conversaciones cargadas:', this.conversaciones.length);
        } else {
          this.error = 'Error al cargar conversaciones';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando conversaciones:', error);
        this.error = 'Error de conexión al cargar conversaciones';
        this.loading = false;
        this.cargarDatosPrueba();
      }
    });
  }

  seleccionarConversacion(conversacion: Conversacion) {
    this.conversacionSeleccionada = conversacion;
    this.error = '';
    this.cargarMensajes(conversacion.tutor_id);
    
    // Marcar mensajes como leídos
    this.marcarMensajesLeidos(conversacion.tutor_id);
  }

  cargarMensajes(tutorId: number, silent: boolean = false) {
    if (!silent) {
      this.loading = true;
    }
    
    this.padresService.getMensajes(this.maestroId, tutorId).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajes = response.data;
          console.log('✅ Mensajes cargados:', this.mensajes.length);
          
          if (!silent) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          }
        } else {
          this.error = 'Error al cargar mensajes';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando mensajes:', error);
        this.error = 'Error de conexión al cargar mensajes';
        this.loading = false;
        this.cargarMensajesPrueba();
      }
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.conversacionSeleccionada || this.enviando) return;

    const mensajeTexto = this.nuevoMensaje.trim();
    this.enviando = true;
    this.error = '';

    this.padresService.enviarMensaje(
      this.maestroId, 
      this.conversacionSeleccionada.tutor_id, 
      mensajeTexto
    ).subscribe({
      next: (response) => {
        console.log('✅ Mensaje enviado:', response);
        this.nuevoMensaje = '';
        this.enviando = false;
        
        // Recargar mensajes y conversaciones
        this.cargarMensajes(this.conversacionSeleccionada!.tutor_id);
        this.cargarConversaciones();
        this.cargarEstadisticas();
      },
      error: (error) => {
        console.error('❌ Error enviando mensaje:', error);
        this.error = 'Error al enviar mensaje. Intenta nuevamente.';
        this.enviando = false;
        this.simularEnvioMensaje(mensajeTexto);
      }
    });
  }

  cargarEstadisticas() {
    this.padresService.getEstadisticas(this.maestroId).subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          console.log('✅ Estadísticas cargadas:', this.estadisticas);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        // Cargar estadísticas de prueba
        this.estadisticas = {
          total_tutores: this.conversaciones.length,
          total_mensajes: this.conversaciones.reduce((acc, conv) => acc + (conv.mensajes_no_leidos || 0), 0) + 15,
          mensajes_no_leidos: this.conversaciones.reduce((acc, conv) => acc + (conv.mensajes_no_leidos || 0), 0),
          ultima_actividad: new Date().toISOString()
        };
      }
    });
  }

  marcarMensajesLeidos(tutorId: number) {
    // En una implementación real, aquí llamarías al endpoint para marcar como leídos
    console.log('📨 Marcando mensajes como leídos para tutor:', tutorId);
    
    // Actualizar localmente
    const conversacionIndex = this.conversaciones.findIndex(c => c.tutor_id === tutorId);
    if (conversacionIndex !== -1) {
      this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
    }
  }

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

  formatearFechaConversacion(fecha: string): string {
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
        // Fecha completa
        return date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: '2-digit'
        });
      }
    } catch (error) {
      return fecha;
    }
  }

  // Métodos de prueba para cuando el backend falle
  private cargarDatosPrueba() {
    this.conversaciones = [
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
      }
    ];
    console.log('📋 Datos de prueba cargados');
  }

  private cargarMensajesPrueba() {
    if (!this.conversacionSeleccionada) return;

    this.mensajes = [
      {
        id: 1,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: this.conversacionSeleccionada.tutor_nombre,
        nino_nombre: this.conversacionSeleccionada.nino_nombre,
        mensaje: 'Hola ' + this.conversacionSeleccionada.tutor_nombre + ', ¿cómo está ' + this.conversacionSeleccionada.nino_nombre + '?',
        fecha_envio: new Date(Date.now() - 3600000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      },
      {
        id: 2,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: this.conversacionSeleccionada.tutor_nombre,
        nino_nombre: this.conversacionSeleccionada.nino_nombre,
        mensaje: 'Muy bien, gracias por preguntar. ¿Hay alguna tarea pendiente?',
        fecha_envio: new Date(Date.now() - 1800000).toISOString(),
        leido: true,
        tipo_remitente: 'tutor'
      },
      {
        id: 3,
        maestro_nombre: 'Administrador Principal',
        tutor_nombre: this.conversacionSeleccionada.tutor_nombre,
        nino_nombre: this.conversacionSeleccionada.nino_nombre,
        mensaje: 'Sí, por favor revisen la tarea de matemáticas que dejé ayer.',
        fecha_envio: new Date(Date.now() - 900000).toISOString(),
        leido: true,
        tipo_remitente: 'maestro'
      }
    ];
    
    setTimeout(() => this.scrollToBottom(), 100);
    console.log('📋 Mensajes de prueba cargados');
  }

  private simularEnvioMensaje(mensaje: string) {
    if (!this.conversacionSeleccionada) return;

    const nuevoMensaje: Mensaje = {
      id: Date.now(),
      maestro_nombre: 'Administrador Principal',
      tutor_nombre: this.conversacionSeleccionada.tutor_nombre,
      nino_nombre: this.conversacionSeleccionada.nino_nombre,
      mensaje: mensaje,
      fecha_envio: new Date().toISOString(),
      leido: false,
      tipo_remitente: 'maestro'
    };
    
    this.mensajes.push(nuevoMensaje);
    this.nuevoMensaje = '';
    this.enviando = false;
    
    // Actualizar última conversación
    const conversacionIndex = this.conversaciones.findIndex(
      c => c.tutor_id === this.conversacionSeleccionada!.tutor_id
    );
    
    if (conversacionIndex !== -1) {
      this.conversaciones[conversacionIndex].ultimo_mensaje = mensaje;
      this.conversaciones[conversacionIndex].fecha_ultimo_mensaje = new Date().toISOString();
    }
    
    setTimeout(() => this.scrollToBottom(), 100);
    console.log('📤 Mensaje simulado enviado:', mensaje);
  }

  // Método para manejar tecla Enter (sin Shift)
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  // Limpiar error
  limpiarError() {
    this.error = '';
  }

  // Recargar todo
  recargarTodo() {
    this.cargarConversaciones();
    this.cargarEstadisticas();
    if (this.conversacionSeleccionada) {
      this.cargarMensajes(this.conversacionSeleccionada.tutor_id);
    }
  }
}
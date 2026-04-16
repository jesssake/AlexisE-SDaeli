// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\features\Estudiantes\padres\padres.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggingService } from '../../../services/logging.service';

// Interfaces
export interface ConversacionEstudiante {
  maestro_id: number;
  maestro_nombre: string;
  maestro_email: string;
  nino_nombre: string;
  ultimo_mensaje: string;
  fecha_ultimo_mensaje: string;
  mensajes_no_leidos: number;
  tiene_conversacion?: boolean;
}

export interface MensajeEstudiante {
  id: number;
  maestro_nombre: string;
  tutor_nombre: string;
  nino_nombre: string;
  mensaje: string;
  fecha_envio: string;
  leido: boolean;
  tipo_remitente: 'maestro' | 'tutor';
}

export interface EstadisticasChatEstudiante {
  total_maestros: number;
  total_mensajes: number;
  mensajes_no_leidos: number;
  ultima_actividad: string;
}

export interface MaestroDisponible {
  maestro_id: number;
  maestro_nombre: string;
  maestro_email: string;
  nino_nombre: string;
  tiene_conversacion: boolean;
  descripcion?: string;
}

@Component({
  selector: 'app-padres-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './padres.component.html',
  styleUrls: ['./padres.component.scss']
})
export class PadresEstudianteComponent implements OnInit, OnDestroy {
  // Variables principales
  conversaciones: ConversacionEstudiante[] = [];
  maestrosDisponibles: MaestroDisponible[] = [];
  mensajes: MensajeEstudiante[] = [];
  estadisticas: EstadisticasChatEstudiante | null = null;
  conversacionSeleccionada: ConversacionEstudiante | null = null;
  nuevoMensaje: string = '';
  
  // Información del usuario autenticado
  estudianteId: number = 0;
  estudianteNombre: string = 'Estudiante';
  estudianteEmail: string = '';
  ninoNombre: string = '';
  userRole: string = '';
  
  // Estados
  loading: boolean = false;
  loadingMaestros: boolean = false;
  enviando: boolean = false;
  error: string = '';
  serverStatus: string = '🟡 Verificando...';
  sessionLoaded: boolean = false;
  mostrarMaestrosDisponibles: boolean = false;
  
  // Configuración
  private apiUrl = 'http://localhost:3000/api/estudiante/padres';
  private timeoutMs = 10000;
  
  // Auto-refresh
  private refreshInterval: any;
  private refreshIntervalMs = 30000;
  
  // Salud del servidor
  serverHealth: { success: boolean; service: string; status: string; timestamp: string } | null = null;

  constructor(
    private http: HttpClient,
    private logger: LoggingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarSesionUsuario();
      this.verificarSaludServidor();
      this.cargarTodo();
      
      // Configurar auto-refresh
      this.setupAutoRefresh();
    }
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  // ========================================
  // 🔐 CARGA DE SESIÓN DEL USUARIO - ACTUALIZADO A sessionStorage
  // ========================================
  private cargarSesionUsuario() {
    try {
      if (!isPlatformBrowser(this.platformId)) return;

      // ✅ ACTUALIZADO: Usar sessionStorage en lugar de localStorage
      const authToken = sessionStorage.getItem('authToken');
      const userId = sessionStorage.getItem('userId');
      const userRole = sessionStorage.getItem('userRole');
      const userEmail = sessionStorage.getItem('userEmail');
      const userNombre = sessionStorage.getItem('userNombre');
      const ninoNombre = sessionStorage.getItem('ninoNombre');
      const tutorId = sessionStorage.getItem('tutorId');

      this.logger.log('🔐 Datos de sesión encontrados en sessionStorage:');
      this.logger.log('   - authToken:', authToken ? '✅ Presente' : '❌ Ausente');
      this.logger.log('   - userId:', userId);
      this.logger.log('   - userRole:', userRole);
      this.logger.log('   - userEmail:', userEmail);
      this.logger.log('   - userNombre:', userNombre);
      this.logger.log('   - ninoNombre:', ninoNombre);
      this.logger.log('   - tutorId:', tutorId);

      // ✅ FALLBACK: Si no hay datos en sessionStorage, buscar en localStorage
      if (!authToken || !userId || !userRole) {
        this.logger.log('⚠️ No hay datos en sessionStorage, buscando en localStorage...');
        
        const fallbackAuthToken = localStorage.getItem('authToken');
        const fallbackUserId = localStorage.getItem('userId');
        const fallbackUserRole = localStorage.getItem('userRole');
        const fallbackUserEmail = localStorage.getItem('userEmail');
        const fallbackUserNombre = localStorage.getItem('userNombre');
        const fallbackNinoNombre = localStorage.getItem('ninoNombre');
        const fallbackTutorId = localStorage.getItem('tutorId');
        
        if (fallbackAuthToken && fallbackUserId && fallbackUserRole) {
          this.logger.log('✅ Datos encontrados en localStorage, migrando a sessionStorage...');
          
          // Migrar datos a sessionStorage
          sessionStorage.setItem('authToken', fallbackAuthToken);
          sessionStorage.setItem('userId', fallbackUserId);
          sessionStorage.setItem('userRole', fallbackUserRole);
          if (fallbackUserEmail) sessionStorage.setItem('userEmail', fallbackUserEmail);
          if (fallbackUserNombre) sessionStorage.setItem('userNombre', fallbackUserNombre);
          if (fallbackNinoNombre) sessionStorage.setItem('ninoNombre', fallbackNinoNombre);
          if (fallbackTutorId) sessionStorage.setItem('tutorId', fallbackTutorId);
          
          // Usar los valores migrados
          this.estudianteId = parseInt(fallbackUserId, 10);
          this.estudianteEmail = fallbackUserEmail || '';
          this.estudianteNombre = fallbackUserNombre || 'Estudiante';
          this.ninoNombre = fallbackNinoNombre || '';
          this.userRole = fallbackUserRole;
        } else {
          this.logger.error('❌ Sesión no válida. Redirigiendo a login...');
          this.error = 'Sesión no válida. Por favor, inicia sesión nuevamente.';
          this.sessionLoaded = false;
          return;
        }
      } else {
        // Usar datos de sessionStorage
        this.estudianteId = parseInt(userId, 10);
        this.estudianteEmail = userEmail || '';
        this.estudianteNombre = userNombre || 'Estudiante';
        this.ninoNombre = ninoNombre || '';
        this.userRole = userRole;
      }

      // Si es tutor, usar tutorId si está disponible
      if (this.userRole === 'TUTOR' && sessionStorage.getItem('tutorId')) {
        const tutorIdNum = parseInt(sessionStorage.getItem('tutorId')!, 10);
        if (!isNaN(tutorIdNum)) {
          this.logger.log(`👨‍👩‍👧‍👦 Usando tutorId: ${tutorIdNum} en lugar de userId: ${this.estudianteId}`);
          this.estudianteId = tutorIdNum;
        }
      }

      this.logger.log('✅ Sesión cargada exitosamente:');
      this.logger.log(`   👤 ID: ${this.estudianteId}`);
      this.logger.log(`   📧 Email: ${this.estudianteEmail}`);
      this.logger.log(`   🎭 Rol: ${this.userRole}`);
      this.logger.log(`   👶 Niño: ${this.ninoNombre}`);

      this.sessionLoaded = true;

    } catch (error) {
      this.logger.error('❌ Error cargando sesión:', error);
      this.error = 'Error al cargar sesión. Por favor, inicia sesión nuevamente.';
      this.sessionLoaded = false;
    }
  }

  // ========================================
  // 🔄 CONFIGURACIÓN AUTOMÁTICA
  // ========================================
  private setupAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.conversacionSeleccionada && this.sessionLoaded) {
        this.cargarMensajes(this.conversacionSeleccionada.maestro_id, true);
      }
      if (this.sessionLoaded) {
        this.cargarEstadisticas();
        this.cargarConversaciones();
      }
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
    this.logger.error(`❌ Error en ${url}:`, error);
    
    if (error.name === 'TimeoutError') {
      return throwError(() => new Error('Tiempo de espera agotado. El servidor no responde.'));
    }
    
    if (error.status === 0) {
      return throwError(() => new Error('No se puede conectar al servidor. Verifica que esté ejecutándose.'));
    }
    
    return throwError(() => new Error('Error de conexión con el servidor'));
  }

  // ========================================
  // 🔍 VERIFICACIÓN DE SERVIDOR
  // ========================================
  verificarSaludServidor() {
    this.get<{ success: boolean; service: string; status: string; timestamp: string }>(
      `${this.apiUrl}/status`
    ).subscribe({
      next: (response) => {
        this.serverHealth = response;
        this.serverStatus = response.status;
        this.logger.log('✅ Salud del servidor:', response);
      },
      error: (error) => {
        this.serverHealth = {
          success: false,
          service: 'Chat Estudiante/Padres',
          status: '🔴 Offline',
          timestamp: new Date().toISOString()
        };
        this.serverStatus = '🔴 Offline';
        this.logger.error('❌ Error verificar salud:', error);
      }
    });
  }

  // ========================================
  // 📂 CARGA DE DATOS
  // ========================================
  cargarTodo() {
    if (!this.sessionLoaded || this.estudianteId === 0) {
      this.logger.error('❌ No se puede cargar datos: sesión no válida');
      this.error = 'No se puede cargar datos. Sesión no válida.';
      return;
    }

    this.cargarConversaciones();
    this.cargarEstadisticas();
    this.verificarDatosUsuario();
  }

  cargarConversaciones() {
    if (this.estudianteId === 0) {
      this.logger.error('❌ No se puede cargar conversaciones: ID de estudiante no válido');
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.logger.log(`📞 Cargando conversaciones para estudiante ID: ${this.estudianteId}`);
    
    this.get<{success: boolean; data: ConversacionEstudiante[]}>(
      `${this.apiUrl}/conversaciones/${this.estudianteId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.conversaciones = response.data || [];
          this.logger.log('✅ Conversaciones cargadas:', this.conversaciones.length);
          
          // Si no hay conversaciones, cargar maestros disponibles
          if (this.conversaciones.length === 0) {
            this.logger.log('ℹ️  No hay conversaciones, mostrando maestros disponibles');
            this.cargarMaestrosDisponibles();
          }
          
          // Si hay una conversación seleccionada, actualizar sus datos
          if (this.conversacionSeleccionada) {
            const conversacionActualizada = this.conversaciones.find(
              c => c.maestro_id === this.conversacionSeleccionada!.maestro_id
            );
            if (conversacionActualizada) {
              this.conversacionSeleccionada = conversacionActualizada;
            }
          }
        } else {
          this.error = 'No se pudieron cargar las conversaciones';
        }
        this.loading = false;
      },
      error: (error) => {
        this.logger.error('❌ Error cargando conversaciones:', error);
        this.error = 'Error al cargar conversaciones. Verifica la conexión.';
        this.loading = false;
      }
    });
  }

  cargarMaestrosDisponibles() {
    if (this.estudianteId === 0) return;

    this.loadingMaestros = true;
    
    this.logger.log(`👨‍🏫 Cargando maestros disponibles para estudiante ID: ${this.estudianteId}`);
    
    this.get<{success: boolean; data: MaestroDisponible[]}>(
      `${this.apiUrl}/maestros-disponibles/${this.estudianteId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.maestrosDisponibles = response.data || [];
          this.logger.log('✅ Maestros disponibles cargados:', this.maestrosDisponibles.length);
          this.mostrarMaestrosDisponibles = true;
        }
        this.loadingMaestros = false;
      },
      error: (error) => {
        this.logger.error('❌ Error cargando maestros disponibles:', error);
        this.loadingMaestros = false;
      }
    });
  }

  cargarMensajes(maestroId: number, silent: boolean = false) {
    if (this.estudianteId === 0) {
      this.logger.error('❌ No se puede cargar mensajes: ID de estudiante no válido');
      return;
    }

    if (!silent) {
      this.loading = true;
    }
    
    this.logger.log(`💬 Cargando mensajes para estudiante ${this.estudianteId} y maestro ${maestroId}`);
    
    this.get<{success: boolean; data: MensajeEstudiante[]}>(
      `${this.apiUrl}/mensajes/${this.estudianteId}/${maestroId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajes = response.data || [];
          this.logger.log('✅ Mensajes cargados:', this.mensajes.length);
          
          if (!silent) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          }
        } else {
          if (!silent) this.error = 'No se pudieron cargar los mensajes';
        }
        this.loading = false;
      },
      error: (error) => {
        this.logger.error('❌ Error cargando mensajes:', error);
        if (!silent) {
          this.error = 'Error al cargar mensajes. Verifica la conexión.';
        }
        this.loading = false;
      }
    });
  }

  cargarEstadisticas() {
    if (this.estudianteId === 0) {
      this.logger.error('❌ No se puede cargar estadísticas: ID de estudiante no válido');
      return;
    }

    this.get<{success: boolean; data: EstadisticasChatEstudiante}>(
      `${this.apiUrl}/estadisticas/${this.estudianteId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          this.logger.log('✅ Estadísticas cargadas:', this.estadisticas);
        }
      },
      error: (error) => {
        this.logger.error('❌ Error cargando estadísticas:', error);
      }
    });
  }

  verificarDatosUsuario() {
    if (this.estudianteId === 0) return;

    this.logger.log(`🔍 Verificando datos del usuario ID: ${this.estudianteId}`);
    
    this.get<{success: boolean; data: any}>(
      `${this.apiUrl}/verificar-datos/${this.estudianteId}`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.logger.log('📋 Datos del usuario verificados:', response.data);
          
          // Si el usuario no tiene datos completos, sugerir completar perfil
          if (response.data.usuario && !response.data.usuario.nino_nombre) {
            this.logger.warn('⚠️ Usuario sin nombre de estudiante configurado');
          }
          
          // Mostrar recomendación si existe
          if (response.data.recomendacion) {
            this.logger.log('💡 Recomendación:', response.data.recomendacion);
          }
        }
      },
      error: (error) => {
        this.logger.error('❌ Error verificando datos:', error);
      }
    });
  }

  // ========================================
  // 🎯 ACCIONES DEL USUARIO
  // ========================================
  seleccionarConversacion(conversacion: ConversacionEstudiante) {
    this.conversacionSeleccionada = conversacion;
    this.error = '';
    this.mostrarMaestrosDisponibles = false;
    this.cargarMensajes(conversacion.maestro_id);
  }

  seleccionarMaestroDisponible(maestro: MaestroDisponible) {
    this.logger.log(`🤝 Seleccionando maestro disponible: ${maestro.maestro_nombre}`);
    
    // Crear una conversación temporal
    this.conversacionSeleccionada = {
      maestro_id: maestro.maestro_id,
      maestro_nombre: maestro.maestro_nombre,
      maestro_email: maestro.maestro_email,
      nino_nombre: maestro.nino_nombre || this.ninoNombre,
      ultimo_mensaje: 'Iniciar conversación...',
      fecha_ultimo_mensaje: new Date().toISOString(),
      mensajes_no_leidos: 0,
      tiene_conversacion: maestro.tiene_conversacion
    };
    
    this.mensajes = []; // Limpiar mensajes anteriores
    this.error = '';
    this.mostrarMaestrosDisponibles = false;
    
    // Si ya tiene conversación, cargar mensajes
    if (maestro.tiene_conversacion) {
      this.cargarMensajes(maestro.maestro_id);
    }
  }

  iniciarConversacion(maestroId: number) {
    if (!maestroId || this.estudianteId === 0) return;

    this.logger.log(`🚀 Iniciando conversación con maestro ID: ${maestroId}`);
    
    this.post<any>(`${this.apiUrl}/iniciar-conversacion`, {
      estudiante_id: this.estudianteId,
      maestro_id: maestroId,
      mensaje_inicial: this.nuevoMensaje.trim() || 'Hola, me gustaría iniciar una conversación'
    }).subscribe({
      next: (response) => {
        this.logger.log('✅ Conversación iniciada:', response);
        
        if (response.success) {
          // Recargar conversaciones y mensajes
          this.cargarConversaciones();
          this.cargarMensajes(maestroId);
          this.nuevoMensaje = '';
          this.error = '';
        } else {
          this.error = response.message || 'Error al iniciar conversación';
        }
      },
      error: (error) => {
        this.logger.error('❌ Error iniciando conversación:', error);
        this.error = 'Error al iniciar conversación. Intenta nuevamente.';
      }
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.conversacionSeleccionada || this.enviando || this.estudianteId === 0) return;

    const mensajeTexto = this.nuevoMensaje.trim();
    this.enviando = true;
    this.error = '';

    this.logger.log(`📤 Enviando mensaje de estudiante ${this.estudianteId} a maestro ${this.conversacionSeleccionada.maestro_id}`);

    // Si no tiene conversación, iniciar una nueva
    if (!this.conversacionSeleccionada.tiene_conversacion) {
      this.iniciarConversacion(this.conversacionSeleccionada.maestro_id);
      return;
    }

    this.post<any>(`${this.apiUrl}/enviar`, {
      estudiante_id: this.estudianteId,
      maestro_id: this.conversacionSeleccionada.maestro_id,
      mensaje: mensajeTexto
    }).subscribe({
      next: (response: any) => {
        this.logger.log('✅ Respuesta enviar mensaje:', response);
        
        // Agregar el mensaje enviado a la lista
        if (response.success && response.data) {
          this.mensajes.push(response.data);
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
        this.logger.error('❌ Error enviando mensaje:', error);
        this.error = 'Error al enviar mensaje. Intenta nuevamente.';
        this.enviando = false;
      }
    });
  }

  marcarMensajesLeidos(maestroId: number) {
    if (this.estudianteId === 0) return;

    this.post<{success: boolean; message: string}>(
      `${this.apiUrl}/marcar-leidos`,
      { estudiante_id: this.estudianteId, maestro_id: maestroId }
    ).subscribe({
      next: (response) => {
        this.logger.log('📖 Mensajes marcados como leídos:', response.message);
        
        // Actualizar localmente
        const conversacionIndex = this.conversaciones.findIndex(c => c.maestro_id === maestroId);
        if (conversacionIndex !== -1) {
          this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
        }
      },
      error: (error) => {
        this.logger.error('❌ Error marcando mensajes como leídos:', error);
        // Actualizar localmente igualmente
        const conversacionIndex = this.conversaciones.findIndex(c => c.maestro_id === maestroId);
        if (conversacionIndex !== -1) {
          this.conversaciones[conversacionIndex].mensajes_no_leidos = 0;
        }
      }
    });
  }

  // ========================================
  // 🚪 MANEJO DE SESIÓN - ACTUALIZADO A sessionStorage
  // ========================================
  logout() {
    this.logger.log('🚪 Cerrando sesión...');
    
    if (isPlatformBrowser(this.platformId)) {
      // ✅ ACTUALIZADO: Limpiar datos de sesión de sessionStorage
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userNombre');
      sessionStorage.removeItem('ninoNombre');
      sessionStorage.removeItem('tutorId');
      sessionStorage.removeItem('userData');
      
      // También limpiar localStorage por si acaso
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userNombre');
      localStorage.removeItem('ninoNombre');
      localStorage.removeItem('tutorId');
      localStorage.removeItem('userData');
      
      // Resetear variables del componente
      this.sessionLoaded = false;
      this.estudianteId = 0;
      this.estudianteNombre = 'Estudiante';
      this.estudianteEmail = '';
      this.ninoNombre = '';
      
      // Limpiar datos
      this.conversaciones = [];
      this.mensajes = [];
      this.conversacionSeleccionada = null;
      this.estadisticas = null;
      this.maestrosDisponibles = [];
      
      // Mostrar mensaje
      this.error = 'Sesión cerrada. Redirigiendo...';
      
      // Redirigir a la página de login después de 1 segundo
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }

  // ✅ CORREGIDO: Quitados todos los puntos y coma dentro de los logs
  mostrarDatosSesion() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.logger.group('🐛 DEBUG - Datos de Sesión');
    this.logger.log('🆔 ID:', this.estudianteId);
    this.logger.log('👤 Nombre:', this.estudianteNombre);
    this.logger.log('📧 Email:', this.estudianteEmail);
    this.logger.log('👶 Niño:', this.ninoNombre);
    this.logger.log('🎭 Rol:', this.userRole);
    this.logger.log('🔐 Sesión cargada:', this.sessionLoaded);
    
    this.logger.log('📊 Datos sessionStorage:');
    this.logger.log('   authToken:', sessionStorage.getItem('authToken'));
    this.logger.log('   userId:', sessionStorage.getItem('userId'));
    this.logger.log('   userRole:', sessionStorage.getItem('userRole'));
    this.logger.log('   userEmail:', sessionStorage.getItem('userEmail'));
    this.logger.log('   userNombre:', sessionStorage.getItem('userNombre'));
    this.logger.log('   ninoNombre:', sessionStorage.getItem('ninoNombre'));
    this.logger.log('   tutorId:', sessionStorage.getItem('tutorId'));
    this.logger.log('   userData:', sessionStorage.getItem('userData'));
    
    this.logger.log('💬 Conversaciones:', this.conversaciones.length);
    this.logger.log('👨‍🏫 Maestros disponibles:', this.maestrosDisponibles.length);
    this.logger.log('📈 Estadísticas:', this.estadisticas);
    this.logger.log('🌐 Estado servidor:', this.serverStatus);
    this.logger.groupEnd();
    
    // Mostrar alerta con información básica
    alert(`🐛 DEBUG Sesión:\n\n` +
          `ID: ${this.estudianteId}\n` +
          `Nombre: ${this.estudianteNombre}\n` +
          `Email: ${this.estudianteEmail}\n` +
          `Niño: ${this.ninoNombre}\n` +
          `Rol: ${this.userRole}\n` +
          `Sesión válida: ${this.tieneSesionValida()}\n` +
          `Conversaciones: ${this.conversaciones.length}\n` +
          `Maestros disponibles: ${this.maestrosDisponibles.length}\n` +
          `Estado servidor: ${this.serverStatus}`);
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
      if (!fecha) return 'Fecha inválida';
      
      const date = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - date.getTime();
      const unDia = 24 * 60 * 60 * 1000;

      if (diferencia < unDia) {
        return date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diferencia < 2 * unDia) {
        return 'Ayer ' + date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
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
      if (!fecha) return 'Nunca';
      
      const date = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - date.getTime();
      const unDia = 24 * 60 * 60 * 1000;

      if (diferencia < unDia) {
        return date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diferencia < 7 * unDia) {
        return date.toLocaleDateString('es-MX', {
          weekday: 'short'
        });
      } else {
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
    this.cargarSesionUsuario(); // Recargar sesión primero
    if (this.sessionLoaded) {
      this.cargarConversaciones();
      this.cargarEstadisticas();
      this.verificarSaludServidor();
      this.verificarDatosUsuario();
      if (this.conversacionSeleccionada) {
        this.cargarMensajes(this.conversacionSeleccionada.maestro_id);
      }
    }
  }

  getServerStatusClass(): string {
    if (this.serverStatus.includes('🟢')) return 'status-online';
    if (this.serverStatus.includes('🔴')) return 'status-offline';
    return 'status-checking';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  tieneSesionValida(): boolean {
    return this.sessionLoaded && this.estudianteId > 0;
  }

  getUsuarioInfo(): string {
    if (!this.tieneSesionValida()) {
      return 'Sesión no válida';
    }
    
    let info = `👤 ${this.estudianteNombre}`;
    if (this.ninoNombre) {
      info += ` | 👶 ${this.ninoNombre}`;
    }
    return info;
  }

  toggleMaestrosDisponibles() {
    this.mostrarMaestrosDisponibles = !this.mostrarMaestrosDisponibles;
    if (this.mostrarMaestrosDisponibles && this.maestrosDisponibles.length === 0) {
      this.cargarMaestrosDisponibles();
    }
  }

  verificarServidorCompleto() {
    this.logger.log('🔄 Verificando estado completo del servidor...');
    this.verificarSaludServidor();
    
    setTimeout(() => {
      this.get<any>(`${this.apiUrl}/debug`).subscribe({
        next: (response) => {
          this.logger.log('🔧 Debug del servidor:', response);
        },
        error: (error) => {
          this.logger.error('❌ Error en debug:', error);
        }
      });
    }, 500);
  }

  isDevelopmentMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    return window.location.hostname === 'localhost' ||
           window.location.hostname.includes('localhost') ||
           window.location.hostname === '127.0.0.1';
  }
}
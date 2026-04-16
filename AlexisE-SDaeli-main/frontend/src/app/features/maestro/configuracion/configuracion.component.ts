// configuracion.component.ts
import { Component, OnInit, Renderer2 } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoggingService } from '../../../services/logging.service';

interface UsuarioData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fechaRegistro?: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  modoOscuro = false;
  mensaje = '';
  mensajeTipo: 'success' | 'error' | 'info' = 'info';

  // Datos del usuario actual
  usuarioActual: UsuarioData | null = null;
  
  // Campos editables
  nuevoNombre = '';
  nuevoCorreo = '';
  contrasenaActual = '';
  contrasenaNueva = '';

  // Estado de la UI
  cargando = false;
  editando = false;

  // URL base de la API
  private apiUrl = 'http://localhost:3000/api/maestro/configuracion';

  constructor(
    private http: HttpClient, 
    private renderer: Renderer2,
    private router: Router,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    this.cargarModoOscuro();
    this.cargarDatosUsuario();
  }

  private cargarModoOscuro(): void {
    try {
      const darkStored = localStorage.getItem('modoOscuro');
      if (darkStored === 'true') {
        this.modoOscuro = true;
        this.renderer.addClass(document.body, 'dark-mode');
      }
    } catch (error) {
      this.logger.warn('Error cargando modo oscuro:', error);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    this.logger.log('🔑 Token recuperado:', token ? '✅ Sí' : '❌ No');
    
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private cargarDatosUsuario(): void {
    try {
      // Intentar cargar desde localStorage primero
      const userDataStr = localStorage.getItem('userData');
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const userNombre = localStorage.getItem('userNombre');
      const userRole = localStorage.getItem('userRole');
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        this.usuarioActual = {
          id: userData.id || parseInt(userId || '0'),
          nombre: userData.nombre || userData.admin_nombre || userNombre || 'Usuario',
          email: userData.email || userData.admin_email || userEmail || '',
          rol: userData.rol || userRole || 'MAESTRO',
          fechaRegistro: userData.fechaRegistro || ''
        };
        this.nuevoNombre = this.usuarioActual.nombre;
        this.nuevoCorreo = this.usuarioActual.email;
        this.logger.log('✅ Usuario cargado desde localStorage:', this.usuarioActual);
      } else if (userId) {
        // Fallback a datos individuales
        this.usuarioActual = {
          id: parseInt(userId),
          nombre: userNombre || 'Maestro',
          email: userEmail || '',
          rol: userRole || 'MAESTRO',
          fechaRegistro: ''
        };
        this.nuevoNombre = this.usuarioActual.nombre;
        this.nuevoCorreo = this.usuarioActual.email;
      }

      // Obtener datos actualizados del backend
      this.obtenerPerfilActualizado();
    } catch (error) {
      this.logger.error('Error cargando usuario:', error);
      this.mostrarMensaje('Error al cargar datos del usuario', 'error');
    }
  }

  private obtenerPerfilActualizado(): void {
    if (!this.usuarioActual?.id) return;

    this.logger.log('📡 Solicitando perfil actualizado...');
    
    this.http.get<{success: boolean, ok: boolean, usuario: UsuarioData}>(`${this.apiUrl}/perfil`, { 
      headers: this.getHeaders() 
    }).subscribe({
      next: (response) => {
        this.logger.log('✅ Perfil obtenido:', response);
        if ((response.success || response.ok) && response.usuario) {
          this.usuarioActual = response.usuario;
          this.nuevoNombre = response.usuario.nombre;
          this.nuevoCorreo = response.usuario.email;
          
          // Actualizar localStorage
          try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.nombre = response.usuario.nombre;
            userData.email = response.usuario.email;
            userData.fechaRegistro = response.usuario.fechaRegistro;
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('userEmail', response.usuario.email);
            localStorage.setItem('userNombre', response.usuario.nombre);
          } catch (e) {
            this.logger.warn('No se pudo actualizar localStorage');
          }
        }
      },
      error: (error) => {
        this.logger.warn('No se pudo obtener perfil actualizado:', error);
        if (error.status === 401) {
          this.logger.log('🔑 Token inválido, redirigiendo a login...');
          this.mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      }
    });
  }

  activarModoOscuro(): void {
    try {
      if (this.modoOscuro) {
        this.renderer.addClass(document.body, 'dark-mode');
      } else {
        this.renderer.removeClass(document.body, 'dark-mode');
      }
      localStorage.setItem('modoOscuro', this.modoOscuro.toString());
    } catch (error) {
      this.logger.warn('Error cambiando modo oscuro:', error);
    }
  }

  activarEdicion(): void {
    this.editando = true;
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.editando = false;
    // Restaurar valores originales
    if (this.usuarioActual) {
      this.nuevoNombre = this.usuarioActual.nombre;
      this.nuevoCorreo = this.usuarioActual.email;
    }
    this.contrasenaActual = '';
    this.contrasenaNueva = '';
  }

  guardarCambiosUsuario(): void {
    // Validaciones
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    const datosActualizar: any = {};
    
    // Verificar cambios en nombre
    if (this.nuevoNombre && this.nuevoNombre !== this.usuarioActual?.nombre) {
      datosActualizar.nuevoNombre = this.nuevoNombre;
    }
    
    // Verificar cambios en email
    if (this.nuevoCorreo && this.nuevoCorreo !== this.usuarioActual?.email) {
      datosActualizar.nuevoCorreo = this.nuevoCorreo;
    }
    
    // Verificar cambio de contraseña
    if (this.contrasenaNueva) {
      datosActualizar.contrasenaActual = this.contrasenaActual;
      datosActualizar.contrasenaNueva = this.contrasenaNueva;
    }

    // Si no hay cambios
    if (Object.keys(datosActualizar).length === 0) {
      this.mostrarMensaje('No hay cambios para guardar', 'info');
      this.cargando = false;
      return;
    }

    this.logger.log('📤 Enviando datos al servidor:', datosActualizar);

    this.http.post<{
      success: boolean, 
      ok: boolean,
      message: string,
      usuario?: UsuarioData
    }>(`${this.apiUrl}/actualizar`, datosActualizar, { 
      headers: this.getHeaders() 
    }).subscribe({
      next: (response) => {
        this.logger.log('✅ Respuesta del servidor:', response);
        
        if (response.success || response.ok) {
          this.mostrarMensaje(response.message || 'Cambios guardados correctamente', 'success');
          
          // Actualizar datos locales
          if (response.usuario) {
            this.usuarioActual = response.usuario;
            this.nuevoNombre = response.usuario.nombre;
            this.nuevoCorreo = response.usuario.email;
            
            // Actualizar localStorage
            try {
              const userData = JSON.parse(localStorage.getItem('userData') || '{}');
              userData.nombre = response.usuario.nombre;
              userData.email = response.usuario.email;
              userData.fechaRegistro = response.usuario.fechaRegistro;
              localStorage.setItem('userData', JSON.stringify(userData));
              localStorage.setItem('userEmail', response.usuario.email);
              localStorage.setItem('userNombre', response.usuario.nombre);
            } catch (e) {
              this.logger.warn('No se pudo actualizar localStorage');
            }
          } else {
            // Si no viene el usuario, actualizar manualmente
            if (this.nuevoNombre && this.usuarioActual) {
              this.usuarioActual.nombre = this.nuevoNombre;
            }
            if (this.nuevoCorreo && this.usuarioActual) {
              this.usuarioActual.email = this.nuevoCorreo;
            }
          }
          
          // Limpiar campos de contraseña
          this.contrasenaActual = '';
          this.contrasenaNueva = '';
          
          // Salir del modo edición
          this.editando = false;
        } else {
          this.mostrarMensaje(response.message || 'Error al guardar cambios', 'error');
        }
      },
      error: (error) => {
        this.logger.error('❌ Error en la petición:', error);
        
        let mensajeError = 'Error al conectar con el servidor';
        
        if (error.error?.message) {
          mensajeError = error.error.message;
        } else if (error.status === 401) {
          mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else if (error.status === 400) {
          mensajeError = error.error?.message || 'Datos inválidos';
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        }
        
        this.mostrarMensaje(mensajeError, 'error');
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  private validarFormulario(): boolean {
    // Validar nombre si se proporciona
    if (this.nuevoNombre && this.nuevoNombre.trim().length < 3) {
      this.mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
      return false;
    }

    // Validar correo si se proporciona
    if (this.nuevoCorreo && !this.validarEmail(this.nuevoCorreo)) {
      this.mostrarMensaje('El formato del correo electrónico no es válido', 'error');
      return false;
    }

    // Validar cambio de contraseña
    if (this.contrasenaNueva) {
      if (!this.contrasenaActual) {
        this.mostrarMensaje('Debes proporcionar tu contraseña actual', 'error');
        return false;
      }

      if (this.contrasenaNueva.length < 6) {
        this.mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return false;
      }
    }

    return true;
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    
    // Auto-limpiar mensaje después de 5 segundos
    setTimeout(() => {
      if (this.mensaje === texto) {
        this.mensaje = '';
      }
    }, 5000);
  }

  // ✅ MÉTODO CORREGIDO - verificarToken
  verificarToken(): void {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    // ✅ CORREGIDO: Quitado el punto y coma
    this.logger.log('🔑 Token actual:', token ? token.substring(0, 20) + '...' : 'No hay token');
    
    const userData = localStorage.getItem('userData');
    // ✅ CORREGIDO: Quitado el punto y coma
    this.logger.log('👤 UserData:', userData ? JSON.parse(userData) : 'No hay userData');
  }
}
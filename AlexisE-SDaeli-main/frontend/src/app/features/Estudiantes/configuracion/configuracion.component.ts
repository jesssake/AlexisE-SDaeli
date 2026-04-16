import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LoggingService } from '../../../services/logging.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {

  apiConfig = 'http://localhost:3000/api/configuracion';
  
  cargando = false;
  errorMsg = '';
  successMsg = '';

  usuarioNombre = '';
  usuarioEmail = '';
  usuarioRol = '';
  usuarioId: number | null = null;
  usuarioTelefono = '';
  usuarioFechaRegistro = '';

  listaNinos: any[] = [];
  datosTutor: any = null;

  // Modales
  modalPerfilVisible = false;
  modalPasswordVisible = false;
  modalAlumnoVisible = false;
  
  // Datos de edición
  perfilEdit = { nombre: '', email: '', telefono: '' };
  passwordData = { actual: '', nueva: '', confirmar: '' };
  alumnoEdit: any = { id: null, nombre: '', fecha_nacimiento: '', condiciones_medicas: '' };
  
  guardando = false;
  guardandoPassword = false;
  guardandoAlumno = false;
  passwordError = '';

  constructor(
    private http: HttpClient, 
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    this.logger.log('🎯 Iniciando componente CONFIGURACIÓN...');
    this.cargarSesion();
  }

  // ✅ ACTUALIZADO: Usar sessionStorage en lugar de localStorage
  cargarSesion() {
    try {
      // Buscar en sessionStorage primero
      let data = sessionStorage.getItem('userData');
      
      // Si no hay en sessionStorage, buscar en localStorage (fallback)
      if (!data) {
        data = localStorage.getItem('userData');
        if (data) {
          // ✅ CORREGIDO: Quitado punto y coma
          this.logger.log('⚠️ Datos encontrados en localStorage (fallback), migrando a sessionStorage...');
          // Migrar datos a sessionStorage
          const userData = JSON.parse(data);
          sessionStorage.setItem('userData', JSON.stringify(userData));
          if (userData.id) sessionStorage.setItem('userId', userData.id.toString());
          if (userData.rol) sessionStorage.setItem('userRole', userData.rol);
          if (userData.nombre) sessionStorage.setItem('userNombre', userData.nombre);
          if (userData.email) sessionStorage.setItem('userEmail', userData.email);
          if (userData.nino_nombre) sessionStorage.setItem('ninoNombre', userData.nino_nombre);
          if (userData.tutor_nombre) sessionStorage.setItem('tutorNombre', userData.tutor_nombre);
          if (userData.tutor_telefono) sessionStorage.setItem('tutorTelefono', userData.tutor_telefono);
        }
      }
      
      if (!data) {
        // Intentar obtener datos de campos individuales en sessionStorage
        const userId = sessionStorage.getItem('userId');
        const userNombre = sessionStorage.getItem('userNombre');
        const userEmail = sessionStorage.getItem('userEmail');
        const userRole = sessionStorage.getItem('userRole');
        
        if (userId) {
          this.usuarioId = parseInt(userId, 10);
          this.usuarioNombre = userNombre || '';
          this.usuarioEmail = userEmail || '';
          this.usuarioRol = (userRole || 'ALUMNO').toUpperCase();
          
          if (this.usuarioRol === 'TUTOR') {
            this.cargarInfoTutor();
            this.cargarNinos();
          }
          return;
        }
        
        this.errorMsg = 'No se encontró la sesión. Por favor, inicia sesión nuevamente.';
        return;
      }

      const user = JSON.parse(data);
      
      // ✅ CORRECCIÓN: Priorizar nino_id y nino_nombre
      this.usuarioNombre = user.tutor_nombre || user.nombre || user.userNombre || '';
      this.usuarioEmail = user.tutor_email || user.email || user.userEmail || '';
      this.usuarioRol = (user.rol || user.userRole || 'ALUMNO').toUpperCase();
      this.usuarioId = user.tutor_id || user.id || user.userId || null;
      this.usuarioTelefono = user.tutor_telefono || '';

      this.logger.log('👤 Datos de sesión cargados desde sessionStorage:', {
        id: this.usuarioId,
        nombre: this.usuarioNombre,
        email: this.usuarioEmail,
        rol: this.usuarioRol,
        telefono: this.usuarioTelefono
      });

      if (this.usuarioRol === 'TUTOR') {
        this.cargarInfoTutor();
        this.cargarNinos();
      }
      
    } catch (err) {
      this.logger.error('Error cargando sesión:', err);
      this.errorMsg = 'Error al leer la sesión';
    }
  }

  cargarInfoTutor() {
    if (!this.usuarioId) return;
    
    const url = `${this.apiConfig}/tutor/${this.usuarioId}/info`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.tutor) {
          this.datosTutor = res.tutor;
          this.usuarioTelefono = res.tutor.telefono || '';
          this.usuarioFechaRegistro = res.tutor.fecha_registro_formateada || '';
          
          // Actualizar sessionStorage con los datos completos
          this.actualizarSessionStorage(res.tutor);
        }
      },
      // ✅ CORREGIDO: Quitado punto y coma
      error: (err) => {
        this.logger.error('Error cargando info tutor:', err);
      }
    });
  }

  cargarNinos() {
    this.cargando = true;
    if (!this.usuarioId) {
      this.errorMsg = 'ID de tutor no encontrado';
      this.cargando = false;
      return;
    }

    const url = `${this.apiConfig}/tutor/${this.usuarioId}/ninos`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.listaNinos = res.ninos || [];
          if (this.listaNinos.length > 0) {
            this.successMsg = `✅ ${this.listaNinos.length} alumno(s) cargado(s)`;
            setTimeout(() => this.successMsg = '', 3000);
          }
        } else {
          this.errorMsg = res.message || 'Error al cargar alumnos';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('Error:', err);
        this.errorMsg = `Error: ${err.status} - ${err.statusText}`;
        this.cargando = false;
      }
    });
  }

  // ✅ NUEVO: Actualizar sessionStorage con datos del tutor
  private actualizarSessionStorage(tutorData: any): void {
    try {
      const currentData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const updatedData = {
        ...currentData,
        tutor_nombre: tutorData.nombre,
        tutor_email: tutorData.email,
        tutor_telefono: tutorData.telefono,
        tutor_id: tutorData.id,
        fecha_registro: tutorData.fecha_registro
      };
      sessionStorage.setItem('userData', JSON.stringify(updatedData));
      sessionStorage.setItem('tutorNombre', tutorData.nombre);
      sessionStorage.setItem('tutorEmail', tutorData.email);
      sessionStorage.setItem('tutorTelefono', tutorData.telefono);
      sessionStorage.setItem('tutorId', tutorData.id?.toString());
      
      this.logger.log('✅ Datos de tutor actualizados en sessionStorage');
    } catch (err) {
      this.logger.error('Error actualizando sessionStorage:', err);
    }
  }

  // ========================================
  // MODAL EDITAR PERFIL
  // ========================================
  abrirModalEditarPerfil() {
    this.perfilEdit = {
      nombre: this.datosTutor?.nombre || this.usuarioNombre,
      email: this.datosTutor?.email || this.usuarioEmail,
      telefono: this.datosTutor?.telefono || this.usuarioTelefono
    };
    this.modalPerfilVisible = true;
  }

  cerrarModalPerfil() {
    this.modalPerfilVisible = false;
    this.errorMsg = '';
    this.successMsg = '';
  }

  guardarPerfil() {
    if (!this.perfilEdit.nombre || !this.perfilEdit.email) {
      this.errorMsg = 'Nombre y email son requeridos';
      return;
    }

    this.guardando = true;
    const url = `${this.apiConfig}/tutor/${this.usuarioId}/perfil`;
    
    this.http.post(url, this.perfilEdit).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMsg = '✅ Perfil actualizado correctamente';
          this.usuarioNombre = res.tutor.nombre;
          this.usuarioEmail = res.tutor.email;
          this.usuarioTelefono = res.tutor.telefono;
          this.datosTutor = res.tutor;
          
          // ✅ ACTUALIZADO: Usar sessionStorage
          this.actualizarSessionStorage(res.tutor);
          
          // También actualizar campos individuales en sessionStorage
          sessionStorage.setItem('userNombre', res.tutor.nombre);
          sessionStorage.setItem('userEmail', res.tutor.email);
          
          setTimeout(() => this.successMsg = '', 3000);
          this.cerrarModalPerfil();
        } else {
          this.errorMsg = res.message || 'Error al actualizar';
        }
        this.guardando = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al guardar los cambios';
        this.guardando = false;
      }
    });
  }

  // ========================================
  // MODAL CAMBIAR CONTRASEÑA
  // ========================================
  abrirModalCambiarPassword() {
    this.passwordData = { actual: '', nueva: '', confirmar: '' };
    this.passwordError = '';
    this.modalPasswordVisible = true;
  }

  cerrarModalPassword() {
    this.modalPasswordVisible = false;
    this.passwordError = '';
  }

  cambiarPassword() {
    this.passwordError = '';
    
    if (!this.passwordData.actual) {
      this.passwordError = 'Ingresa tu contraseña actual';
      return;
    }
    if (!this.passwordData.nueva) {
      this.passwordError = 'Ingresa una nueva contraseña';
      return;
    }
    if (this.passwordData.nueva.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.passwordData.nueva !== this.passwordData.confirmar) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    this.guardandoPassword = true;
    const url = `${this.apiConfig}/tutor/${this.usuarioId}/password`;
    
    this.http.post(url, {
      password_actual: this.passwordData.actual,
      password_nueva: this.passwordData.nueva
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMsg = '✅ Contraseña actualizada correctamente';
          setTimeout(() => this.successMsg = '', 3000);
          this.cerrarModalPassword();
        } else {
          this.passwordError = res.message || 'Error al cambiar contraseña';
        }
        this.guardandoPassword = false;
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña';
        this.guardandoPassword = false;
      }
    });
  }

  // ========================================
  // MODAL EDITAR ALUMNO
  // ========================================
  abrirModalEditarAlumno(alumno: any) {
    this.alumnoEdit = {
      id: alumno.id,
      nombre: alumno.nombre,
      fecha_nacimiento: alumno.fecha_nacimiento?.split('T')[0] || alumno.fecha_nacimiento,
      condiciones_medicas: alumno.condiciones_medicas || ''
    };
    this.modalAlumnoVisible = true;
  }

  cerrarModalAlumno() {
    this.modalAlumnoVisible = false;
  }

  guardarAlumno() {
    if (!this.alumnoEdit.nombre) {
      this.errorMsg = 'El nombre del alumno es requerido';
      return;
    }

    this.guardandoAlumno = true;
    const url = `${this.apiConfig}/nino/${this.alumnoEdit.id}`;
    
    this.http.post(url, this.alumnoEdit).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMsg = '✅ Datos del alumno actualizados correctamente';
          this.cargarNinos(); // Recargar lista
          setTimeout(() => this.successMsg = '', 3000);
          this.cerrarModalAlumno();
        } else {
          this.errorMsg = res.message || 'Error al actualizar';
        }
        this.guardandoAlumno = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al guardar los cambios';
        this.guardandoAlumno = false;
      }
    });
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const anio = date.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return fecha;
    }
  }

  calcularEdad(fechaNacimiento: string): number | null {
    if (!fechaNacimiento) return null;
    try {
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);
      if (isNaN(fechaNac.getTime())) return null;
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
      return edad;
    } catch {
      return null;
    }
  }

  recargar() {
    this.cargarInfoTutor();
    this.cargarNinos();
  }

  // ✅ NUEVO: Limpiar todos los datos de sesión
  limpiarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  // ✅ CORREGIDO: Quitados puntos y coma dentro de sessionStorage.getItem
  debug() {
    this.logger.group('🐛 DEBUG - Configuración');
    this.logger.log('ID:', this.usuarioId);
    this.logger.log('Nombre:', this.usuarioNombre);
    this.logger.log('Email:', this.usuarioEmail);
    this.logger.log('Teléfono:', this.usuarioTelefono);
    this.logger.log('Rol:', this.usuarioRol);
    this.logger.log('Niños:', this.listaNinos);
    this.logger.log('Datos tutor:', this.datosTutor);
    this.logger.log('📦 sessionStorage:');
    this.logger.log('   userId:', sessionStorage.getItem('userId'));
    this.logger.log('   userRole:', sessionStorage.getItem('userRole'));
    this.logger.log('   userNombre:', sessionStorage.getItem('userNombre'));
    this.logger.log('   userEmail:', sessionStorage.getItem('userEmail'));
    this.logger.log('   ninoNombre:', sessionStorage.getItem('ninoNombre'));
    this.logger.log('   tutorNombre:', sessionStorage.getItem('tutorNombre'));
    this.logger.log('   tutorTelefono:', sessionStorage.getItem('tutorTelefono'));
    this.logger.log('   userData:', sessionStorage.getItem('userData'));
    this.logger.groupEnd();
    
    alert(`DEBUG:\nID: ${this.usuarioId}\nNombre: ${this.usuarioNombre}\nEmail: ${this.usuarioEmail}\nAlumnos: ${this.listaNinos.length}`);
  }
}
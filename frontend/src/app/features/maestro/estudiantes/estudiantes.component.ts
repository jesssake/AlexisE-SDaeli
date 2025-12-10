import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Estudiante {
  id?: number;
  nombre: string;
  fecha_nacimiento: string;
  condiciones_medicas?: string;
  tutor_nombre?: string;
  tutor_email?: string;
  tutor_telefono?: string;
  tutor_password?: string;
  edad?: number;
}

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './estudiantes.component.html',
  styleUrls: ['./estudiantes.component.scss']
})
export class EstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];
  form: Estudiante = this.nuevoFormulario();
  editando: boolean = false;
  modalVisible: boolean = false;
  cargando: boolean = false;
  error: string = '';

  // ✅ URL COMPLETA del backend
  private apiUrl = 'http://localhost:3000/api/maestro/estudiantes';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log('🎯 EstudiantesComponent inicializado');
    this.cargarEstudiantes();
  }

  // Cargar estudiantes desde el backend REAL
  cargarEstudiantes() {
    this.cargando = true;
    this.error = '';
    
    console.log('🔄 Cargando estudiantes desde:', this.apiUrl);
    
    this.http.get<Estudiante[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          console.log('✅ Estudiantes cargados exitosamente:', data);
          this.estudiantes = data;
          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error cargando estudiantes:', err);
          this.error = `Error ${err.status}: No se puede conectar con el servidor backend`;
          this.cargando = false;
        }
      });
  }

  // Función para inicializar un formulario vacío
  nuevoFormulario(): Estudiante {
    return {
      nombre: '',
      fecha_nacimiento: '',
      condiciones_medicas: '',
      tutor_nombre: '',
      tutor_email: '',
      tutor_telefono: '',
      tutor_password: ''
    };
  }

  // Abrir modal para agregar nuevo
  abrirModalNuevo() {
    this.form = this.nuevoFormulario();
    this.editando = false;
    this.modalVisible = true;
    this.error = '';
    console.log('📝 Abriendo modal para nuevo estudiante');
  }

  // Cerrar modal
  cerrarModal() {
    this.modalVisible = false;
    this.error = '';
    console.log('❌ Cerrando modal');
  }

  // Guardar estudiante (nuevo o editado)
  guardarEstudiante() {
    console.log('💾 Guardando estudiante:', this.form);
    
    // ✅ FORMATEAR FECHA ANTES DE ENVIAR
    const formData = {
      ...this.form,
      fecha_nacimiento: this.formatearFechaParaMySQL(this.form.fecha_nacimiento)
    };
    
    console.log('📅 Fecha formateada para MySQL:', formData.fecha_nacimiento);
    
    // Validar formulario antes de enviar
    if (!this.validarFormulario()) {
      return;
    }
    
    if (this.editando && this.form.id != null) {
      this.actualizarEstudiante(formData);
    } else {
      this.crearEstudiante(formData);
    }
  }

  // Crear nuevo estudiante - BACKEND REAL
  crearEstudiante(formData: any) {
    console.log('🆕 Creando nuevo estudiante:', formData);
    this.cargando = true;
    this.error = '';
    
    this.http.post<any>(this.apiUrl, formData)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.cargando = false;
          if (response.success) {
            this.cargarEstudiantes();
            this.cerrarModal();
          } else {
            this.error = response.message || 'Error al crear estudiante';
          }
        },
        error: (err) => {
          console.error('❌ Error creando estudiante:', err);
          this.cargando = false;
          this.manejarError(err, 'crear');
        }
      });
  }

  // Actualizar estudiante existente - BACKEND REAL
  actualizarEstudiante(formData: any) {
    const url = `${this.apiUrl}/${this.form.id}`;
    console.log('📤 Enviando actualización a:', url);
    console.log('📝 Datos a enviar:', formData);
    
    this.cargando = true;
    this.error = '';

    this.http.put<any>(url, formData)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.cargando = false;
          if (response.success) {
            this.cargarEstudiantes();
            this.cerrarModal();
          } else {
            this.error = response.message || 'Error al actualizar estudiante';
            console.error('❌ Error del servidor:', response);
          }
        },
        error: (err) => {
          console.error('❌ Error HTTP actualizando estudiante:', err);
          this.cargando = false;
          this.manejarError(err, 'actualizar');
        }
      });
  }

  // ✅ FUNCIÓN PARA FORMATEAR FECHA PARA MySQL
  private formatearFechaParaMySQL(fecha: string): string {
    if (!fecha) return '';
    
    try {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      
      // Si es formato ISO (con timezone), convertirlo
      const date = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida:', fecha);
        return fecha; // Devolver original si no se puede parsear
      }
      
      // Formatear a YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('❌ Error formateando fecha:', error);
      return fecha; // Devolver original en caso de error
    }
  }

  // Preparar edición
  editarEstudiante(e: Estudiante) {
    console.log('📝 Editando estudiante:', e);
    
    // ✅ FORMATEAR FECHA AL CARGAR PARA EL FORMULARIO
    this.form = { 
      ...e,
      fecha_nacimiento: this.formatearFechaParaFormulario(e.fecha_nacimiento)
    };
    
    this.editando = true;
    this.modalVisible = true;
    this.error = '';
  }

  // ✅ FUNCIÓN PARA FORMATEAR FECHA PARA EL FORMULARIO HTML
  private formatearFechaParaFormulario(fecha: string): string {
    if (!fecha) return '';
    
    try {
      // Si ya está en formato YYYY-MM-DD, es perfecto para input[type="date"]
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      
      // Si es formato ISO, extraer la parte YYYY-MM-DD
      if (fecha.includes('T')) {
        return fecha.split('T')[0];
      }
      
      // Si es otra formato, intentar parsear
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return fecha;
    } catch {
      return fecha;
    }
  }

  // Eliminar estudiante - BACKEND REAL
  eliminarEstudiante(e: Estudiante) {
    console.log('🗑️ Solicitando eliminar estudiante:', e);
    
    if (confirm(`¿Estás seguro de eliminar a "${e.nombre}"? Esta acción no se puede deshacer.`)) {
      const url = `${this.apiUrl}/${e.id}`;
      console.log('🗑️ Eliminando estudiante en:', url);
      
      this.http.delete<any>(url)
        .subscribe({
          next: (response) => {
            console.log('✅ Respuesta del servidor:', response);
            if (response.success) {
              this.cargarEstudiantes();
            } else {
              this.error = response.message || 'Error al eliminar estudiante';
            }
          },
          error: (err) => {
            console.error('❌ Error eliminando estudiante:', err);
            this.manejarError(err, 'eliminar');
          }
        });
    }
  }

  // Manejar errores de forma centralizada
  private manejarError(err: any, operacion: string) {
    console.error(`❌ Error en ${operacion}:`, err);
    
    if (err.error) {
      if (err.error.error) {
        this.error = `Error del servidor: ${err.error.error}`;
      } else if (err.error.message) {
        this.error = `Error: ${err.error.message}`;
      } else if (err.error.sqlMessage) {
        this.error = `Error de base de datos: ${err.error.sqlMessage}`;
      } else {
        this.error = `Error al ${operacion} estudiante: ${err.status} ${err.statusText}`;
      }
    } else {
      this.error = `Error de conexión al ${operacion} estudiante: ${err.message}`;
    }
  }

  // Para trackear elementos en la tabla
  trackById(index: number, item: Estudiante): number {
    return item.id || index;
  }

  // Formatear fecha para mostrar en la tabla
  formatFecha(fecha: string): string {
    if (!fecha) return '';
    
    try {
      // Extraer solo la parte de la fecha si es formato ISO
      const fechaSimple = fecha.split('T')[0];
      const date = new Date(fechaSimple + 'T00:00:00');
      
      if (isNaN(date.getTime())) {
        return fecha;
      }
      
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  // Calcular edad a partir de la fecha de nacimiento
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    try {
      const fechaSimple = fechaNacimiento.split('T')[0];
      const nacimiento = new Date(fechaSimple + 'T00:00:00');
      const hoy = new Date();
      
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      
      return edad;
    } catch {
      return 0;
    }
  }

  // Validar formulario antes de enviar
  validarFormulario(): boolean {
    this.error = '';

    if (!this.form.nombre || !this.form.nombre.trim()) {
      this.error = 'El nombre del niño es requerido';
      return false;
    }
    
    if (!this.form.fecha_nacimiento) {
      this.error = 'La fecha de nacimiento es requerida';
      return false;
    }
    
    if (!this.form.tutor_nombre || !this.form.tutor_nombre.trim()) {
      this.error = 'El nombre del tutor es requerido';
      return false;
    }
    
    if (!this.form.tutor_email || !this.form.tutor_email.trim()) {
      this.error = 'El correo del tutor es requerido';
      return false;
    }
    
    if (!this.form.tutor_telefono || !this.form.tutor_telefono.trim()) {
      this.error = 'El teléfono del tutor es requerido';
      return false;
    }
    
    if (!this.editando && (!this.form.tutor_password || !this.form.tutor_password.trim())) {
      this.error = 'La contraseña del tutor es requerida';
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.tutor_email)) {
      this.error = 'El formato del correo electrónico no es válido';
      return false;
    }
    
    return true;
  }

  // Forzar recarga de datos
  recargarDatos() {
    console.log('🔄 Forzando recarga de datos...');
    this.cargarEstudiantes();
  }

  // Probar conexión manualmente
  probarConexion() {
    console.log('🔍 Probando conexión con el backend...');
    this.http.get(this.apiUrl).subscribe({
      next: (data) => console.log('✅ Backend responde:', data),
      error: (err) => console.error('❌ Backend no responde:', err)
    });
  }

  // Alias para compatibilidad con tests
  get modalAbierto(): boolean {
    return this.modalVisible;
  }

  abrirModalEditar(e: Estudiante) {
    this.editarEstudiante(e);
  }

  // Limpiar errores
  limpiarError() {
    this.error = '';
  }
}
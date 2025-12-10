import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tareas-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss']
})
export class TareasEstudianteComponent implements OnInit, OnDestroy {

  // ========================
  // CONFIG DE BACKEND
  // ========================
  baseUrl = 'http://localhost/gestion_e/TareasAlumno';
  baseArchivos = 'http://localhost/gestion_e/';

  // ========================
  // DATOS DEL ESTUDIANTE
  // ========================
  estudiante: any = {
    id_nino: 0,
    email: '',
    nombre: 'Estudiante',
    carrera: 'Ingeniería',
    semestre: '2024-1'
  };

  // ========================
  // LISTA DE TAREAS
  // ========================
  tareas: any[] = [];
  loadingTareas = false;
  errorTareas: string | null = null;

  // ========================
  // MIS ENTREGAS
  // ========================
  misEntregas: any[] = [];
  loadingEntregas = false;

  // ========================
  // MODALES
  // ========================
  modalDetallesAbierto = false;
  modalEntregaAbierto = false;
  modalAlertaAbierto = false;
  
  tareaSeleccionada: any = null;
  archivoEntrega: File | null = null;
  comentarioAlumno: string = '';
  subiendoEntrega = false;
  isDragover = false;

  // ========================
  // ALERTAS
  // ========================
  alertaTitulo: string = '';
  alertaMensaje: string = '';

  // ========================
  // FECHA ACTUAL
  // ========================
  fechaActual: Date = new Date();
  private intervalId: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.cargarDatosEstudiante();
    this.cargarTareasEstudiante();
    this.cargarMisEntregas();
    
    this.intervalId = setInterval(() => {
      this.fechaActual = new Date();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ========================
  // CARGAR DATOS DEL ESTUDIANTE - SIN AFECTAR OTROS MÓDULOS
  // ========================
  private cargarDatosEstudiante(): void {
    const usuarioId = localStorage.getItem('id');
    const usuarioEmail = localStorage.getItem('correo');
    const usuarioNombre = localStorage.getItem('nombre');
    
    this.estudiante.id_nino = usuarioId ? parseInt(usuarioId) : 0;
    
    this.estudiante = {
      id_nino: this.estudiante.id_nino,
      email: usuarioEmail || 'estudiante@ejemplo.com',
      nombre: usuarioNombre || this.obtenerNombreDesdeEmail(usuarioEmail || ''),
      carrera: 'Ingeniería de Sistemas',
      semestre: '2024-1'
    };

    console.log('🎯 Estudiante inicializado:', this.estudiante);

    // ✅ VERIFICAR SI EL USUARIO EXISTE EN TABLA NINOS
    this.verificarYCorregirEstudiante();
  }

  // ========================
  // VERIFICAR Y CORREGIR ESTUDIANTE EN TABLA NINOS
  // ========================
  private verificarYCorregirEstudiante(): void {
    if (!this.estudiante.id_nino) return;

    // Primero verificar si existe en ninos
    this.http.get<any>(`${this.baseUrl}/verificar_estudiante.php`, {
      params: { id_estudiante: this.estudiante.id_nino.toString() }
    }).subscribe({
      next: (response) => {
        if (response.existe) {
          console.log('✅ Estudiante existe en tabla ninos');
        } else {
          console.warn('⚠️ Estudiante NO existe en tabla ninos. Se usará ID temporal.');
          // No crear automáticamente para no afectar otros módulos
        }
      },
      error: (err) => {
        console.error('❌ Error verificando estudiante:', err);
      }
    });
  }

  private obtenerNombreDesdeEmail(email: string): string {
    const username = email.split('@')[0];
    if (/^\d+$/.test(username)) {
      return 'Estudiante';
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  // ========================
  // CARGAR TAREAS
  // ========================
  cargarTareasEstudiante(): void {
    this.loadingTareas = true;
    this.errorTareas = null;
    this.tareas = [];

    this.http.get<any>(`${this.baseUrl}/tareas_estudiante.php`).subscribe({
      next: (response) => {
        if (response && response.ok === false) {
          this.errorTareas = `Error: ${response.error}`;
          this.loadingTareas = false;
          return;
        }

        if (response && Array.isArray(response.tareas)) {
          this.tareas = response.tareas;
        } else if (Array.isArray(response)) {
          this.tareas = response;
        } else if (response && response.tareas) {
          this.tareas = response.tareas;
        } else {
          this.tareas = [];
        }

        this.loadingTareas = false;
      },
      error: (err) => {
        console.error('💥 Error cargando tareas:', err);
        this.loadingTareas = false;
        this.errorTareas = 'Error al cargar las tareas';
      }
    });
  }

  // ========================
  // CARGAR MIS ENTREGAS
  // ========================
  cargarMisEntregas(): void {
    if (!this.estudiante.id_nino) {
      this.misEntregas = [];
      this.loadingEntregas = false;
      return;
    }

    this.loadingEntregas = true;

    this.http.get<any>(`${this.baseUrl}/mis_entregas.php`, {
      params: { id_estudiante: this.estudiante.id_nino.toString() }
    }).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.misEntregas = response;
        } else if (response && Array.isArray(response.entregas)) {
          this.misEntregas = response.entregas;
        } else {
          this.misEntregas = [];
        }
        
        this.loadingEntregas = false;
      },
      error: (err) => {
        console.error('❌ Error cargando mis entregas:', err);
        this.loadingEntregas = false;
        this.misEntregas = [];
      }
    });
  }

  // ========================
  // MÉTODOS PARA TEMPLATE
  // ========================
  permiteTarde(t: any): boolean {
    return t && Number(t?.permitir_entrega_tarde) === 1;
  }

  estaActiva(t: any): boolean {
    return t && Number(t?.activa) === 1;
  }

  // ========================
  // MODAL DETALLES
  // ========================
  abrirModalDetalles(tarea: any): void {
    this.tareaSeleccionada = tarea;
    this.modalDetallesAbierto = true;
  }

  cerrarModalDetalles(): void {
    this.modalDetallesAbierto = false;
    this.tareaSeleccionada = null;
  }

  // ========================
  // MODAL ENTREGA
  // ========================
  abrirModalEntrega(tarea: any): void {
    if (!this.estudiante.id_nino) {
      this.mostrarAlerta('❌ Error', 'No se ha identificado correctamente al estudiante');
      return;
    }

    this.tareaSeleccionada = tarea;
    this.archivoEntrega = null;
    this.comentarioAlumno = '';
    this.isDragover = false;
    this.modalEntregaAbierto = true;
  }

  cerrarModalEntrega(): void {
    this.modalEntregaAbierto = false;
    this.tareaSeleccionada = null;
    this.archivoEntrega = null;
    this.comentarioAlumno = '';
    this.isDragover = false;
  }

  // ========================
  // MANEJO DE ARCHIVOS
  // ========================
  onFileSelectedEntrega(event: any): void {
    const file: File = event.target.files[0];
    this.procesarArchivo(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivo(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = false;
  }

  private procesarArchivo(file: File): void {
    if (!file) return;

    const tiposPermitidos = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (!tiposPermitidos.includes(file.type)) {
      this.mostrarAlerta(
        '❌ Tipo de Archivo No Permitido', 
        'Solo se aceptan: PDF, Word, ZIP, RAR, JPEG, PNG, GIF'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.mostrarAlerta('❌ Archivo Demasiado Grande', 'El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    this.archivoEntrega = file;
  }

  // ========================
  // ENVIAR ENTREGA
  // ========================
  enviarEntrega(): void {
    if (!this.tareaSeleccionada || !this.estudiante.id_nino) {
      this.mostrarAlerta('❌ Error', 'Datos incompletos para la entrega');
      return;
    }

    if (!this.archivoEntrega && !this.comentarioAlumno.trim()) {
      this.mostrarAlerta('❌ Error', 'Debes adjuntar un archivo o escribir un comentario');
      return;
    }

    if (this.esTareaVencida(this.tareaSeleccionada) && !this.permiteTarde(this.tareaSeleccionada)) {
      this.mostrarAlerta('❌ Tarea Vencida', 'Esta tarea está vencida y no acepta entregas tardías');
      return;
    }

    this.subiendoEntrega = true;

    const formData = new FormData();
    formData.append('id_tarea', this.tareaSeleccionada.id_tarea.toString());
    formData.append('id_estudiante', this.estudiante.id_nino.toString());
    formData.append('comentario_alumno', this.comentarioAlumno.trim());

    if (this.archivoEntrega) {
      formData.append('archivo_entrega', this.archivoEntrega);
    }

    this.http.post<any>(`${this.baseUrl}/entregar_tarea.php`, formData).subscribe({
      next: (res) => {
        this.subiendoEntrega = false;

        if (!res?.ok) {
          this.mostrarAlerta('❌ Error', 'No se pudo enviar la entrega: ' + (res?.error || ''));
          return;
        }

        this.mostrarAlerta('✅ ¡Éxito!', '¡Tarea entregada correctamente!');
        this.cerrarModalEntrega();
        
        this.cargarTareasEstudiante();
        this.cargarMisEntregas();
        
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        console.error('❌ Error enviando entrega:', err);
        this.subiendoEntrega = false;
        this.mostrarAlerta('❌ Error', 'Error al enviar la entrega. Verifica tu conexión.');
      }
    });
  }

  // ========================
  // HELPERS PARA ARCHIVOS
  // ========================
  fileUrl(ruta: string | null | undefined): string | null {
    if (!ruta || ruta === 'null' || ruta === 'undefined' || ruta === '') return null;
    return this.baseArchivos + ruta.replace(/^\//, '');
  }

  obtenerIconoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📕';
      case 'doc': case 'docx': return '📄';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      case 'zip': case 'rar': return '📦';
      default: return '📎';
    }
  }

  obtenerNombreArchivo(ruta: string): string {
    if (!ruta) return 'archivo';
    return ruta.split('/').pop() || 'archivo';
  }

  // ========================
  // ALERTAS
  // ========================
  mostrarAlerta(titulo: string, mensaje: string): void {
    this.alertaTitulo = titulo;
    this.alertaMensaje = mensaje;
    this.modalAlertaAbierto = true;
  }

  cerrarAlerta(): void {
    this.modalAlertaAbierto = false;
    this.alertaTitulo = '';
    this.alertaMensaje = '';
  }

  // ========================
  // ESTADO DE ENTREGA
  // ========================
  obtenerEstadoEntrega(tareaId: number): any {
    return this.misEntregas.find(e => e.id_tarea === tareaId);
  }

  estadoEntregaClass(estado: string): string {
    if (!estado) return 'pendiente';
    
    const e = estado.toLowerCase().trim();
    if (e === 'revisado' || e === 'calificado') return 'revisado';
    if (e === 'entregado' || e === 'enviado') return 'entregado';
    return 'pendiente';
  }

  // ========================
  // FECHAS Y TIEMPOS
  // ========================
  esTareaVencida(tarea: any): boolean {
    if (!tarea?.fecha_cierre) return false;
    const fechaCierre = new Date(tarea.fecha_cierre);
    const ahora = new Date();
    return fechaCierre < ahora;
  }

  tiempoRestante(tarea: any): string {
    if (!tarea?.fecha_cierre) return 'Sin fecha límite';
    
    const fechaCierre = new Date(tarea.fecha_cierre);
    const ahora = new Date();
    const diffMs = fechaCierre.getTime() - ahora.getTime();
    
    if (diffMs <= 0) return 'Vencida';
    
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDias > 0) {
      return `${diffDias}d ${diffHoras}h`;
    } else if (diffHoras > 0) {
      return `${diffHoras}h ${diffMinutos}m`;
    } else {
      return `${diffMinutos}m`;
    }
  }

  // ========================
  // UTILIDADES
  // ========================
  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'E';
    return nombre.split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
  }

  // ========================
  // ACCIONES
  // ========================
  probarConexion(): void {
    this.mostrarAlerta('🔍 Probando Conexión', 'Conectando con el servidor...');

    this.http.get<any>(`${this.baseUrl}/test_conexion.php`).subscribe({
      next: (response) => {
        this.mostrarAlerta('✅ Conexión Exitosa', `Servidor funcionando correctamente.`);
      },
      error: (err) => {
        this.mostrarAlerta('❌ Error de Conexión', 'No se pudo conectar con el servidor.');
      }
    });
  }

  recargarTodo(): void {
    this.cargarTareasEstudiante();
    this.cargarMisEntregas();
  }
}
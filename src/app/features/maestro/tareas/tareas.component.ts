import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss']
})
export class TareasComponent implements OnInit {

  // ========================
  // CONFIG DE BACKEND
  // ========================

  // Endpoint base para las APIs de tareas
  // (si luego usas proxy cambia a '/api')
  baseUrl = 'http://localhost/gestion_e/Tareas';

  // Carpeta pública donde Apache sirve archivos subidos
  // ej: "uploads/entregas/archivo1.jpg"
  // -> http://localhost/gestion_e/uploads/entregas/archivo1.jpg
  baseArchivos = 'http://localhost/gestion_e/';

  jsonHeaders = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  // ========================
  // LISTA DE TAREAS
  // ========================
  tareas: any[] = [];
  loadingTareas = false;
  errorTareas: string | null = null;

  // La tarea que está seleccionada para ver entregas
  tareaSeleccionada: any = null;

  // ========================
  // ENTREGAS DE ESA TAREA
  // ========================
  entregas: any[] = [];
  loadingEntregas = false;
  errorEntregas: string | null = null;

  // ========================
  // MODAL: CALIFICAR ENTREGA
  // ========================
  modalCalificarAbierto = false;
  entregaEditando: any = null;
  notaTemp: string = '';
  comentarioTemp: string = '';

  // ========================
  // MODAL: NUEVA / EDITAR TAREA
  // ========================
  modalTareaAbierto = false;
  editandoTarea = false; // false = creando nueva, true = editando existente
  guardandoTarea = false;
  errorModalTarea: string | null = null;

  // Form del modal de tarea
  formTarea = {
    id_tarea: 0,
    titulo: '',
    instrucciones: '',
    fecha_cierre: '',              // "2025-11-02 23:59:00"
    permitir_entrega_tarde: true,  // checkbox
    activa: true,                  // checkbox
    rubrica: '',
    created_by: 1                  // ID del maestro logueado
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTareas();
  }

  // ========================
  // CARGAR TODAS LAS TAREAS
  // ========================
  cargarTareas(): void {
    this.loadingTareas = true;
    this.errorTareas = null;

    this.http.get<any[]>(`${this.baseUrl}/tareas_list.php`).subscribe({
      next: (data) => {
        this.tareas = Array.isArray(data) ? data : [];
        this.loadingTareas = false;

        // si no hay selección, agarra la primera
        if (!this.tareaSeleccionada && this.tareas.length > 0) {
          this.seleccionarTarea(this.tareas[0]);
        }

        // si hay selección previa, refrescamos sus datos actuales
        if (this.tareaSeleccionada) {
          const match = this.tareas.find(t => t.id_tarea === this.tareaSeleccionada.id_tarea);
          if (match) this.tareaSeleccionada = match;
        }
      },
      error: (err) => {
        console.error('tareas_list.php error:', err);
        this.loadingTareas = false;
        this.errorTareas = 'Error cargando tareas';
      }
    });
  }

  recargarTodo(): void {
    this.cargarTareas();
    if (this.tareaSeleccionada) {
      this.cargarEntregas(this.tareaSeleccionada.id_tarea);
    }
  }

  seleccionarTarea(t: any): void {
    this.tareaSeleccionada = t;
    this.cargarEntregas(t.id_tarea);
  }

  // ========================
  // CARGAR ENTREGAS DE ESA TAREA
  // ========================
  cargarEntregas(id_tarea: number): void {
    this.loadingEntregas = true;
    this.errorEntregas = null;
    this.entregas = [];

    this.http.get<any[]>(`${this.baseUrl}/entregas_get.php`, {
      params: { id_tarea: id_tarea.toString() }
    }).subscribe({
      next: (rows) => {
        this.entregas = Array.isArray(rows) ? rows : [];
        this.loadingEntregas = false;
      },
      error: (err) => {
        console.error('entregas_get.php error:', err);
        this.loadingEntregas = false;
        this.errorEntregas = 'Error cargando entregas';
      }
    });
  }

  // ========================
  // MODAL CALIFICAR ENTREGA
  // ========================
  abrirModalCalificar(entrega: any): void {
    this.entregaEditando = entrega;
    this.notaTemp = entrega.calificacion ?? '';
    this.comentarioTemp = entrega.comentario_docente ?? '';
    this.modalCalificarAbierto = true;
  }

  cerrarModalCalificar(): void {
    this.modalCalificarAbierto = false;
    this.entregaEditando = null;
    this.notaTemp = '';
    this.comentarioTemp = '';
  }

  guardarCalificacion(): void {
    if (!this.entregaEditando) return;

    const body = {
      id_entrega: this.entregaEditando.id_entrega,
      calificacion: this.notaTemp,
      comentario_docente: this.comentarioTemp
    };

    this.http.post<any>(
      `${this.baseUrl}/calificar_entrega.php`,
      body,
      this.jsonHeaders
    ).subscribe({
      next: (res) => {
        if (!res?.ok) {
          alert('No se pudo guardar: ' + (res?.error || ''));
          return;
        }
        alert('Calificación guardada ✔');

        // recargar entregas (para ver cambios)
        if (this.tareaSeleccionada) {
          this.cargarEntregas(this.tareaSeleccionada.id_tarea);
        }

        this.cerrarModalCalificar();
      },
      error: (err) => {
        console.error('calificar_entrega.php error:', err);
        alert('Error al calificar');
      }
    });
  }

  // ========================
  // ARCHIVO ENTREGADO POR EL ALUMNO
  // ========================
  fileUrl(ruta: string | null | undefined): string | null {
    if (!ruta) return null;
    // ejemplo:
    // ruta = "uploads/entregas/archivito.pdf"
    // -> http://localhost/gestion_e/uploads/entregas/archivito.pdf
    return this.baseArchivos + ruta.replace(/^\//, '');
  }

  // ========================
  // MODAL NUEVA / EDITAR TAREA
  // ========================
  abrirModalNuevaTarea(): void {
    this.editandoTarea = false;
    this.errorModalTarea = null;
    this.guardandoTarea = false;

    this.formTarea = {
      id_tarea: 0,
      titulo: '',
      instrucciones: '',
      fecha_cierre: '',
      permitir_entrega_tarde: true,
      activa: true,
      rubrica: '',
      created_by: 1
    };

    this.modalTareaAbierto = true;
  }

  abrirModalEditarTarea(): void {
    if (!this.tareaSeleccionada) {
      alert('Primero selecciona una tarea en la tabla.');
      return;
    }

    this.editandoTarea = true;
    this.errorModalTarea = null;
    this.guardandoTarea = false;

    this.formTarea = {
      id_tarea: this.tareaSeleccionada.id_tarea,
      titulo: this.tareaSeleccionada.titulo || '',
      instrucciones: this.tareaSeleccionada.instrucciones || '',
      fecha_cierre: this.tareaSeleccionada.fecha_cierre || '',
      permitir_entrega_tarde: this.tareaSeleccionada.permitir_entrega_tarde === 1,
      activa: this.tareaSeleccionada.activa === 1,
      rubrica: this.tareaSeleccionada.rubrica || '',
      created_by: this.tareaSeleccionada.created_by || 1
    };

    this.modalTareaAbierto = true;
  }

  cerrarModalTarea(): void {
    this.modalTareaAbierto = false;
  }

  guardarTarea(): void {
    // Validaciones simples
    if (!this.formTarea.titulo.trim()) {
      this.errorModalTarea = 'Falta título';
      return;
    }
    if (!this.formTarea.fecha_cierre.trim()) {
      this.errorModalTarea = 'Falta fecha límite';
      return;
    }

    this.guardandoTarea = true;
    this.errorModalTarea = null;

    // body que mandamos al backend
    const body: any = {
      titulo: this.formTarea.titulo.trim(),
      instrucciones: this.formTarea.instrucciones.trim(),
      fecha_cierre: this.formTarea.fecha_cierre.trim(),
      permitir_entrega_tarde: this.formTarea.permitir_entrega_tarde ? 1 : 0,
      activa: this.formTarea.activa ? 1 : 0,
      rubrica: this.formTarea.rubrica.trim(),
      created_by: this.formTarea.created_by
    };

    // si es edición, necesitamos incluir id_tarea y pegarle a tarea_update.php
    let endpoint = `${this.baseUrl}/tarea_create.php`;
    if (this.editandoTarea) {
      body.id_tarea = this.formTarea.id_tarea;
      endpoint = `${this.baseUrl}/tarea_update.php`;
    }

    this.http.post<any>(
      endpoint,
      body,
      this.jsonHeaders
    ).subscribe({
      next: (res) => {
        this.guardandoTarea = false;

        if (!res?.ok) {
          this.errorModalTarea = res?.error || 'No se pudo guardar la tarea';
          return;
        }

        alert(this.editandoTarea ? 'Tarea actualizada ✔' : 'Tarea creada ✔');

        // Cerrar modal, refrescar todo
        this.cerrarModalTarea();
        this.cargarTareas();
      },
      error: (err) => {
        console.error('guardarTarea error:', err);
        this.guardandoTarea = false;
        this.errorModalTarea = 'Error al guardar tarea';
      }
    });
  }

  // ========================
  // ELIMINAR TAREA
  // ========================
  eliminarTareaActual(): void {
    if (!this.tareaSeleccionada) {
      alert('No hay tarea seleccionada');
      return;
    }

    const ok = confirm(
      `¿Eliminar la tarea "${this.tareaSeleccionada.titulo}"? Esto BORRA también TODAS las entregas de los alumnos.`
    );
    if (!ok) return;

    const body = {
      id_tarea: this.tareaSeleccionada.id_tarea
    };

    this.http.post<any>(
      `${this.baseUrl}/tarea_delete.php`,
      body,
      this.jsonHeaders
    ).subscribe({
      next: (res) => {
        if (!res?.ok) {
          alert('No se pudo eliminar: ' + (res?.error || ''));
          return;
        }

        alert('Tarea eliminada ✔');

        // limpiar selección y recargar lista
        this.tareaSeleccionada = null;
        this.entregas = [];
        this.cargarTareas();
      },
      error: (err) => {
        console.error('tarea_delete.php error:', err);
        alert('Error eliminando tarea');
      }
    });
  }

  // ========================
  // HELPERS VISUALES
  // ========================
  permitidoTardeText(t: any): string {
    if (!t) return '—';
    return t.permitir_entrega_tarde === 1
      ? 'Sí (acepta tarde)'
      : 'No';
  }

  activaText(t: any): string {
    if (!t) return '—';
    return t.activa === 1 ? 'Activa' : 'Inactiva';
  }

  estadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'revisado')   return 'estado-chip revisado';
    if (e === 'entregado')  return 'estado-chip entregado';
    return 'estado-chip pendiente';
  }
}

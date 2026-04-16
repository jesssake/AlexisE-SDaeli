import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TareasEstudianteComponent } from './tareas.component';
import { TareaEstudiante } from './tareas.component';

describe('TareasEstudianteComponent', () => {
  let component: TareasEstudianteComponent;
  let fixture: ComponentFixture<TareasEstudianteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        TareasEstudianteComponent
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TareasEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial values', () => {
    expect(component.tareas).toEqual([]);
    expect(component.estadisticas.total).toBe(0);
    expect(component.usuario.nombre).toBe('Estudiante');
  });

  it('should filter tasks correctly', () => {
    // Simular tareas de prueba
    component.tareas = [
      { 
        id_tarea: 1, 
        titulo: 'Tarea 1', 
        estado_tarea: 'PENDIENTE',
        entregada: 0,
        dias_restantes: 3,
        nombre_materia: 'Matemáticas',
        color_materia: '#667eea',
        icono_materia: '📐',
        nombre_profesor: 'Profesor',
        fecha_cierre: '',
        permitir_entrega_tarde: 1,
        activa: 1,
        instrucciones: '',
        id_materia: 1
      } as TareaEstudiante,
      { 
        id_tarea: 2, 
        titulo: 'Tarea 2', 
        estado_tarea: 'ENTREGADA',
        entregada: 1,
        dias_restantes: -1,
        nombre_materia: 'Ciencias',
        color_materia: '#48bb78',
        icono_materia: '🔬',
        nombre_profesor: 'Profesor',
        fecha_cierre: '',
        permitir_entrega_tarde: 1,
        activa: 1,
        instrucciones: '',
        id_materia: 2
      } as TareaEstudiante
    ];

    // Filtrar pendientes
    component.filtroEstado = 'pendientes';
    fixture.detectChanges();
    expect(component.tareasFiltradas.length).toBe(1);
    expect(component.tareasFiltradas[0].estado_tarea).toBe('PENDIENTE');

    // Filtrar entregadas
    component.filtroEstado = 'entregadas';
    fixture.detectChanges();
    expect(component.tareasFiltradas.length).toBe(1);
    expect(component.tareasFiltradas[0].estado_tarea).toBe('ENTREGADA');
  });

  it('should format dates correctly', () => {
    const fecha = '2024-12-20T14:30:00';
    const fechaFormateada = component.formatearFecha(fecha);
    expect(fechaFormateada).toContain('20/12/2024');
  });

  it('should get file icon based on extension', () => {
    expect(component.obtenerIconoArchivo('documento.pdf')).toBe('📕');
    expect(component.obtenerIconoArchivo('imagen.jpg')).toBe('🖼️');
    expect(component.obtenerIconoArchivo('archivo.zip')).toBe('📦');
    expect(component.obtenerIconoArchivo('desconocido.xyz')).toBe('📎');
  });

  it('should show correct delivery status', () => {
    const tareaPendiente = {
      id_tarea: 1,
      titulo: 'Tarea',
      entregada: 0,
      fecha_cierre: new Date(Date.now() + 86400000).toISOString(), // Mañana
      permitir_entrega_tarde: 0,
      estado_tarea: 'PENDIENTE',
      dias_restantes: 1,
      nombre_materia: 'Matemáticas',
      color_materia: '#667eea',
      icono_materia: '📐',
      nombre_profesor: 'Profesor',
      activa: 1,
      instrucciones: '',
      id_materia: 1
    } as TareaEstudiante;

    expect(component.puedeEntregar(tareaPendiente)).toBe(true);
    expect(component.mensajeEstado(tareaPendiente)).toContain('horas');

    const tareaVencida = {
      ...tareaPendiente,
      fecha_cierre: new Date(Date.now() - 86400000).toISOString(), // Ayer
      estado_tarea: 'VENCIDA'
    } as TareaEstudiante;

    expect(component.puedeEntregar(tareaVencida)).toBe(false);
  });

  it('should calculate pagination correctly', () => {
    // Crear 25 tareas de prueba
    component.tareas = Array(25).fill(0).map((_, i) => ({
      id_tarea: i + 1,
      titulo: `Tarea ${i + 1}`,
      estado_tarea: 'PENDIENTE',
      entregada: 0,
      dias_restantes: 3,
      nombre_materia: 'Matemáticas',
      color_materia: '#667eea',
      icono_materia: '📐',
      nombre_profesor: 'Profesor',
      fecha_cierre: '',
      permitir_entrega_tarde: 1,
      activa: 1,
      instrucciones: '',
      id_materia: 1
    } as TareaEstudiante));

    fixture.detectChanges();
    
    expect(component.totalPaginas).toBe(3); // 25/10 = 2.5 -> 3 páginas
    expect(component.tareasPaginadas.length).toBe(10); // Primera página

    component.cambiarPagina(2);
    fixture.detectChanges();
    expect(component.paginaActual).toBe(2);
    expect(component.tareasPaginadas.length).toBe(10); // Segunda página

    component.cambiarPagina(3);
    fixture.detectChanges();
    expect(component.paginaActual).toBe(3);
    expect(component.tareasPaginadas.length).toBe(5); // Última página
  });

  it('should handle file selection', () => {
    // Crear un archivo mock
    const file = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    
    // Simular evento de selección de archivo
    const event = {
      target: {
        files: [file]
      }
    } as unknown as Event;

    component.onFileSelected(event);
    expect(component.archivoSeleccionado).toBeTruthy();
    expect(component.archivoSeleccionado?.name).toBe('documento.pdf');
  });

  it('should show alert messages', () => {
    component.mostrarAlerta('Éxito', 'Operación completada', 'success');
    expect(component.modalAlertaAbierto).toBe(true);
    expect(component.alertaTitulo).toBe('Éxito');
    expect(component.alertaMensaje).toBe('Operación completada');
    expect(component.alertaTipo).toBe('success');

    component.cerrarAlerta();
    expect(component.modalAlertaAbierto).toBe(false);
  });

  it('should handle confirmation modal', () => {
    let callbackExecuted = false;
    
    component.mostrarConfirmacion('Confirmar', '¿Estás seguro?', () => {
      callbackExecuted = true;
    });

    expect(component.modalConfirmacionAbierto).toBe(true);
    
    component.aceptarConfirmacion();
    expect(callbackExecuted).toBe(true);
    expect(component.modalConfirmacionAbierto).toBe(false);
  });

  it('should return unique subjects', () => {
    component.tareas = [
      { 
        id_tarea: 1, 
        titulo: 'Tarea 1', 
        estado_tarea: 'PENDIENTE',
        entregada: 0,
        dias_restantes: 3,
        nombre_materia: 'Matemáticas',
        color_materia: '#667eea',
        icono_materia: '📐',
        nombre_profesor: 'Profesor',
        fecha_cierre: '',
        permitir_entrega_tarde: 1,
        activa: 1,
        instrucciones: '',
        id_materia: 1
      } as TareaEstudiante,
      { 
        id_tarea: 2, 
        titulo: 'Tarea 2', 
        estado_tarea: 'PENDIENTE',
        entregada: 0,
        dias_restantes: 3,
        nombre_materia: 'Ciencias',
        color_materia: '#48bb78',
        icono_materia: '🔬',
        nombre_profesor: 'Profesor',
        fecha_cierre: '',
        permitir_entrega_tarde: 1,
        activa: 1,
        instrucciones: '',
        id_materia: 2
      } as TareaEstudiante,
      { 
        id_tarea: 3, 
        titulo: 'Tarea 3', 
        estado_tarea: 'PENDIENTE',
        entregada: 0,
        dias_restantes: 3,
        nombre_materia: 'Matemáticas', // Duplicado
        color_materia: '#667eea',
        icono_materia: '📐',
        nombre_profesor: 'Profesor',
        fecha_cierre: '',
        permitir_entrega_tarde: 1,
        activa: 1,
        instrucciones: '',
        id_materia: 1
      } as TareaEstudiante
    ];

    const materias = component.materiasUnicas;
    expect(materias.length).toBe(2);
    expect(materias).toEqual(['Ciencias', 'Matemáticas']); // Ordenados alfabéticamente
  });

  it('should return recent qualifications', () => {
    component.calificaciones = [
      { 
        id_entrega: 1, 
        id_tarea: 1, 
        titulo: 'Tarea 1',
        nombre_materia: 'Matemáticas',
        color_materia: '#667eea',
        nombre_profesor: 'Profesor 1',
        calificacion: 9,
        comentario_docente: 'Buen trabajo',
        fecha_entrega_formateada: '20/12/2024',
        fecha_revision_formateada: '21/12/2024',
        nivel_desempeno: 'Excelente'
      },
      { 
        id_entrega: 2, 
        id_tarea: 2, 
        titulo: 'Tarea 2',
        nombre_materia: 'Ciencias',
        color_materia: '#48bb78',
        nombre_profesor: 'Profesor 2',
        calificacion: 8,
        comentario_docente: 'Muy bien',
        fecha_entrega_formateada: '19/12/2024',
        fecha_revision_formateada: '20/12/2024',
        nivel_desempeno: 'Bueno'
      },
      { 
        id_entrega: 3, 
        id_tarea: 3, 
        titulo: 'Tarea 3',
        nombre_materia: 'Historia',
        color_materia: '#ed8936',
        nombre_profesor: 'Profesor 3',
        calificacion: 10,
        comentario_docente: 'Perfecto',
        fecha_entrega_formateada: '18/12/2024',
        fecha_revision_formateada: '19/12/2024',
        nivel_desempeno: 'Excelente'
      },
      { 
        id_entrega: 4, 
        id_tarea: 4, 
        titulo: 'Tarea 4',
        nombre_materia: 'Literatura',
        color_materia: '#f56565',
        nombre_profesor: 'Profesor 4',
        calificacion: 7,
        comentario_docente: 'Puede mejorar',
        fecha_entrega_formateada: '17/12/2024',
        fecha_revision_formateada: '18/12/2024',
        nivel_desempeno: 'Regular'
      },
      { 
        id_entrega: 5, 
        id_tarea: 5, 
        titulo: 'Tarea 5',
        nombre_materia: 'Física',
        color_materia: '#4299e1',
        nombre_profesor: 'Profesor 5',
        calificacion: 9,
        comentario_docente: 'Muy bien',
        fecha_entrega_formateada: '16/12/2024',
        fecha_revision_formateada: '17/12/2024',
        nivel_desempeno: 'Excelente'
      },
      { 
        id_entrega: 6, 
        id_tarea: 6, 
        titulo: 'Tarea 6',
        nombre_materia: 'Química',
        color_materia: '#9f7aea',
        nombre_profesor: 'Profesor 6',
        calificacion: 8,
        comentario_docente: 'Bien',
        fecha_entrega_formateada: '15/12/2024',
        fecha_revision_formateada: '16/12/2024',
        nivel_desempeno: 'Bueno'
      }
    ];

    const recientes = component.calificacionesRecientes;
    expect(recientes.length).toBe(5); // Solo las 5 más recientes
  });

  it('should calculate percentage of delivered tasks', () => {
    component.estadisticas.total = 10;
    component.estadisticas.entregadas = 7;
    
    expect(component.porcentajeEntregadas).toBe(70); // 7/10 = 70%
    
    component.estadisticas.total = 0;
    expect(component.porcentajeEntregadas).toBe(0); // Evitar división por cero
  });

  it('should return correct state class and text', () => {
    expect(component.estadoClass('PENDIENTE')).toBe('estado-chip pendiente');
    expect(component.estadoClass('ENTREGADA')).toBe('estado-chip entregada');
    expect(component.estadoClass('VENCIDA')).toBe('estado-chip vencida');
    expect(component.estadoClass('ENTREGADA_TARDE')).toBe('estado-chip tardia');
    expect(component.estadoClass('REVISADO')).toBe('estado-chip revisado');
    expect(component.estadoClass('DESCONOCIDO')).toBe('estado-chip');

    expect(component.estadoTexto('PENDIENTE')).toBe('Pendiente');
    expect(component.estadoTexto('ENTREGADA')).toBe('Entregada');
    expect(component.estadoTexto('VENCIDA')).toBe('Vencida');
    expect(component.estadoTexto('ENTREGADA_TARDE')).toBe('Entregada (tarde)');
    expect(component.estadoTexto('REVISADO')).toBe('Revisada');
    expect(component.estadoTexto('DESCONOCIDO')).toBe('DESCONOCIDO');
  });

  it('should get file name from path', () => {
    expect(component.getNombreArchivo('uploads/tareas/documento.pdf')).toBe('documento.pdf');
    expect(component.getNombreArchivo('imagen.jpg')).toBe('imagen.jpg');
    expect(component.getNombreArchivo('')).toBe('Sin archivo');
    expect(component.getNombreArchivo(null)).toBe('Sin archivo');
    expect(component.getNombreArchivo(undefined)).toBe('Sin archivo');
  });

  it('should update data', () => {
    spyOn(component, 'cargarTareas');
    spyOn(component, 'cargarCalificaciones');
    spyOn(component, 'cargarEstadisticas');
    spyOn(component, 'mostrarAlerta');
    
    component.actualizarDatos();
    
    expect(component.cargarTareas).toHaveBeenCalled();
    expect(component.cargarCalificaciones).toHaveBeenCalled();
    expect(component.cargarEstadisticas).toHaveBeenCalled();
    expect(component.mostrarAlerta).toHaveBeenCalledWith('Actualizado', 'Datos actualizados correctamente', 'success');
  });
});
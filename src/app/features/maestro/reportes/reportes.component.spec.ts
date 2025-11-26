import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportesComponent } from './reportes.component';
import { ReportesService, ReporteDTO, EstudianteOpt } from './reportes.service';

// --- Mock de ReportesService coherente con ReporteDTO ---
function createMockService() {
  const estudiantes: EstudianteOpt[] = [
    { id: 1, nombre: 'Luis Pérez' },
    { id: 2, nombre: 'Carla Pérez' },
  ];

  const reportes: ReporteDTO[] = [
    {
      id: 10,
      tipo: 'academico',
      estudianteId: 1,
      motivo: 'Bajo rendimiento',
      descripcion: 'No entrega tareas',
      estado: 'pendiente',
      prioridad: 'media',
      fecha: '2025-10-30',
      accionesTomadas: undefined, // << no null
    },
    {
      id: 11,
      tipo: 'conducta',
      estudianteId: 2,
      motivo: 'Interrumpe clase',
      descripcion: 'Interrupciones constantes',
      estado: 'resuelto',
      prioridad: 'alta',
      fecha: '2025-10-29',
      accionesTomadas: 'Llamada a tutor',
    },
  ];

  return {
    // GETs
    getEstudiantes: jasmine.createSpy('getEstudiantes').and.returnValue(of(estudiantes)),
    getReportes: jasmine.createSpy('getReportes').and.returnValue(
      of({
        ok: true,
        data: reportes,
        summary: { total: 2, pendientes: 1, resueltos: 1, altaPrioridad: 1 },
      })
    ),

    // Mutaciones (stub)
    crear: jasmine.createSpy('crear').and.returnValue(of({ ok: true, id: 99 })),
    cambiarEstado: jasmine.createSpy('cambiarEstado').and.returnValue(of({ ok: true })),
    eliminar: jasmine.createSpy('eliminar').and.returnValue(of({ ok: true })),
    exportarCSV: jasmine.createSpy('exportarCSV'),
  };
}

describe('ReportesComponent', () => {
  let component: ReportesComponent;
  let fixture: ComponentFixture<ReportesComponent>;
  let mockSvc: ReturnType<typeof createMockService>;

  beforeEach(async () => {
    mockSvc = createMockService();

    await TestBed.configureTestingModule({
      imports: [ReportesComponent],           // componente standalone
      providers: [{ provide: ReportesService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> cargarTodo()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on init and fill data', () => {
    expect(mockSvc.getEstudiantes).toHaveBeenCalled();
    expect(mockSvc.getReportes).toHaveBeenCalled();
    expect(component.estudiantes.length).toBe(2);
    expect(component.reportes.length).toBe(2);
    expect(component.resumen.total).toBe(2);
    expect(component.resumen.pendientes).toBe(1);
    expect(component.resumen.resueltos).toBe(1);
    expect(component.resumen.altaPrioridad).toBe(1);
  });

  it('should count pending reports correctly', () => {
    expect(component.obtenerCantidadPendientes()).toBe(1);
  });

  it('should count resolved reports correctly', () => {
    expect(component.obtenerCantidadResueltos()).toBe(1);
  });

  it('should count high priority reports correctly', () => {
    expect(component.obtenerCantidadAltaPrioridad()).toBe(1);
  });

  it('should count total reports correctly', () => {
    const total = component.obtenerTotalReportes();
    expect(total).toBe(component.reportes.length);
    expect(total).toBe(2);
  });

  it('should validate report correctly', () => {
    component.nuevoReporte = {
      tipo: 'academico',
      estudianteId: 1,
      motivo: 'Test motivo',
      descripcion: 'Test descripción',
      prioridad: 'media',
    };
    expect(component.validarReporte()).toBeTrue();

    component.nuevoReporte.estudianteId = 0;
    expect(component.validarReporte()).toBeFalse();
  });

  it('should filter by type', () => {
    component.filtroTipo = 'academico';
    const filtrados = component.reportesFiltrados;
    expect(filtrados.length).toBe(1);
    expect(filtrados[0].tipo).toBe('academico');
  });

  it('should filter by estado', () => {
    component.filtroTipo = 'todos';
    component.filtroEstado = 'resuelto';
    const filtrados = component.reportesFiltrados;
    expect(filtrados.length).toBe(1);
    expect(filtrados[0].estado).toBe('resuelto');
  });

  it('should filter by prioridad', () => {
    component.filtroTipo = 'todos';
    component.filtroEstado = 'todos';
    component.filtroPrioridad = 'alta';
    const filtrados = component.reportesFiltrados;
    expect(filtrados.length).toBe(1);
    expect(filtrados[0].prioridad).toBe('alta');
  });

  it('should filter by estudiante', () => {
    component.filtroTipo = 'todos';
    component.filtroEstado = 'todos';
    component.filtroPrioridad = 'todos';
    component.filtroEstudiante = 1;
    const filtrados = component.reportesFiltrados;
    expect(filtrados.length).toBe(1);
    expect(filtrados[0].estudianteId).toBe(1);
  });

  it('should format date nicely', () => {
    const pretty = component.fechaBonita('2025-10-30');
    expect(pretty.length).toBeGreaterThan(0);
  });

  it('should provide student name by id', () => {
    const nombre = component.nombreEstudiante(2);
    expect(nombre).toBe('Carla Pérez');
  });

  it('should map tipo to icon and label', () => {
    expect(component.iconoTipo('academico' as any)).toBeTruthy();
    expect(component.obtenerNombreTipo('academico' as any)).toBe('Académico');
  });

  it('should support generarReporteRapido helper', () => {
    component.generarReporteRapido('asistencia' as any, 1, 'Faltas recurrentes');
    expect(component.nuevoReporte.tipo).toBe('asistencia' as any);
    expect(component.nuevoReporte.estudianteId).toBe(1);
    expect(component.nuevoReporte.motivo).toContain('Faltas recurrentes');
    expect(component.nuevoReporte.descripcion).toContain('Luis Pérez');
  });

  it('should call eliminarReporte through eliminar adapter', () => {
    spyOn(component as any, 'eliminarReporte').and.callThrough();
    spyOn(window, 'confirm').and.returnValue(true);
    const r = component.reportes[0];
    component.eliminar(r);
    expect((component as any).eliminarReporte).toHaveBeenCalledWith(r.id);
  });
});

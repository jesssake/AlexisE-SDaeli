import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './dashboard.component';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  // Debe coincidir con tu TS:
  // private apiAvisosBase = 'http://localhost/gestion_e/Aviso'
  const BASE = 'http://localhost/gestion_e/Aviso';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debería inicializar fechaActual', () => {
      expect(component.fechaActual).toBeDefined();
      expect(component.fechaActual.dia).toBeDefined();
      expect(component.fechaActual.mes).toBeDefined();
      expect(component.fechaActual.anio).toBeDefined();
      expect(component.fechaActual.hora).toBeDefined();
    });

    it('ngOnInit: debería llamar a cargarAvisos (GET avisos_activos.php)', () => {
      const req = httpMock.expectOne(`${BASE}/avisos_activos.php`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Carga de avisos', () => {
    it('cargarAvisos: debería poblar avisos desde la API (GET avisos_activos.php)', () => {
      component.cargarAvisos();
      const req = httpMock.expectOne(`${BASE}/avisos_activos.php`);
      expect(req.request.method).toBe('GET');
      const mock = [{ id: 1, titulo: 'A', contenido: 'X', activo: true, prioridad: 'media', fecha_actualizacion: new Date() }];
      req.flush(mock);
      expect(component.avisos).toEqual(mock);
    });

    it('cargarTodosLosAvisos: debería abrir gestión y cargar datos (GET avisos.php)', () => {
      component.cargarTodosLosAvisos();
      const req = httpMock.expectOne(`${BASE}/avisos.php`);
      expect(req.request.method).toBe('GET');
      const mock = [{ id: 1, titulo: 'A', contenido: 'X', activo: true, prioridad: 'media', fecha_actualizacion: new Date() }];
      req.flush(mock);
      expect(component.todosLosAvisos).toEqual(mock);
      expect(component.mostrarGestionAvisos).toBeTrue();
      expect(component.mostrarSeleccionados).toBeFalse();
    });

    it('manejo de error al cargar avisos activos', () => {
      spyOn(console, 'error');
      component.cargarAvisos();
      const req = httpMock.expectOne(`${BASE}/avisos_activos.php`);
      req.flush('err', { status: 500, statusText: 'Server Error' });
      expect(console.error).toHaveBeenCalled();
      expect(component.avisos).toEqual([]);
    });
  });

  describe('Selección múltiple', () => {
    beforeEach(() => {
      component.todosLosAvisos = [
        { id: 1, titulo: 'A', contenido: 'X', activo: true, prioridad: 'media' },
        { id: 2, titulo: 'B', contenido: 'Y', activo: false, prioridad: 'alta' }
      ];
    });

    it('toggleSeleccionAviso', () => {
      component.toggleSeleccionAviso(1);
      expect(component.avisosSeleccionados.has(1)).toBeTrue();
      component.toggleSeleccionAviso(1);
      expect(component.avisosSeleccionados.has(1)).toBeFalse();
    });

    it('seleccionarTodos / deseleccionarTodos', () => {
      component.seleccionarTodos();
      expect(component.avisosSeleccionados.size).toBe(2);
      component.deseleccionarTodos();
      expect(component.avisosSeleccionados.size).toBe(0);
    });

    it('mostrarAvisosSeleccionados', () => {
      component.toggleSeleccionAviso(1);
      component.mostrarAvisosSeleccionados();
      expect(component.mostrarSeleccionados).toBeTrue();
      // no forzamos cerrar gestión aquí; depende del flujo de UI
    });

    it('aplicarSeleccion -> GET avisos_toggle.php por cada seleccionado y recargas', () => {
      spyOn(component, 'cargarAvisos');
      spyOn(component, 'cargarTodosLosAvisos');

      component.toggleSeleccionAviso(1);
      component.toggleSeleccionAviso(2);

      component.aplicarSeleccion();

      // Se esperan 2 llamadas (una por id)
      const req1 = httpMock.expectOne(`${BASE}/avisos_toggle.php?id=1`);
      expect(req1.request.method).toBe('GET');
      req1.flush({ success: true });

      const req2 = httpMock.expectOne(`${BASE}/avisos_toggle.php?id=2`);
      expect(req2.request.method).toBe('GET');
      req2.flush({ success: true });

      expect(component.cargarAvisos).toHaveBeenCalled();
      expect(component.cargarTodosLosAvisos).toHaveBeenCalled();
    });
  });

  describe('CRUD con backend', () => {
    it('guardarAviso (crear) -> POST avisos.php', () => {
      spyOn(component, 'cargarAvisos');
      component.editandoAviso = false;
      component.avisoEditando = { titulo: 'Nuevo', contenido: 'C', prioridad: 'alta', activo: true };

      component.guardarAviso();

      const req = httpMock.expectOne(`${BASE}/avisos.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(component.avisoEditando);
      req.flush({ success: true, id: 10 });

      expect(component.mostrarModalAviso).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('guardarAviso (actualizar) -> PUT avisos_id.php?id=:id', () => {
      spyOn(component, 'cargarAvisos');
      component.editandoAviso = true;
      component.avisoEditando = { id: 5, titulo: 'Edit', contenido: 'C', prioridad: 'media', activo: false };

      component.guardarAviso();

      const req = httpMock.expectOne(`${BASE}/avisos_id.php?id=5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(component.avisoEditando);
      req.flush({ success: true });

      expect(component.mostrarModalAviso).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('eliminarAviso -> DELETE avisos_id.php?id=:id', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'cargarAvisos');

      component.eliminarAviso(7);

      const req = httpMock.expectOne(`${BASE}/avisos_id.php?id=7`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });

      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('toggleAviso -> GET avisos_toggle.php?id=:id y recarga', () => {
      spyOn(component, 'cargarAvisos');
      spyOn(component, 'cargarTodosLosAvisos');
      const aviso = { id: 3, activo: true, titulo: 'T', contenido: 'X', prioridad: 'media' };

      component.toggleAviso(aviso);

      const req = httpMock.expectOne(`${BASE}/avisos_toggle.php?id=3`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true });

      expect(aviso.activo).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
      expect(component.cargarTodosLosAvisos).toHaveBeenCalled();
    });
  });

  describe('Utilidades y UI', () => {
    it('getAvisosActivos usa todosLosAvisos', () => {
      component.todosLosAvisos = [
        { id: 1, activo: true, prioridad: 'media' },
        { id: 2, activo: false, prioridad: 'baja' }
      ] as any;
      expect(component.getAvisosActivos().length).toBe(1);
    });

    it('getEstadoAviso', () => {
      expect(component.getEstadoAviso(true)).toBe('Activo');
      expect(component.getEstadoAviso(false)).toBe('Oculto');
    });

    it('formatearFecha: maneja nulos e inválidos y formatea válidos', () => {
      expect(component.formatearFecha(null as any)).toBe('—');
      expect(component.formatearFecha('x' as any)).toBe('x');
      const out = component.formatearFecha(new Date('2024-01-15T10:30:00'));
      expect(out).toContain('15/01/2024');
      expect(out).toContain('10:30');
    });

    it('muestra el modal de crear/editar cuando mostrarModalAviso es true', () => {
      component.mostrarModalAviso = true;
      fixture.detectChanges();
      // En tu HTML la clase del overlay es ".overlay"
      const modal = fixture.debugElement.query(By.css('.overlay'));
      expect(modal).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('navigateTo llama Router.navigate', () => {
      const router = TestBed.inject(Router);
      const spy = spyOn(router, 'navigate');
      component.navigateTo('/ruta');
      expect(spy).toHaveBeenCalledWith(['/ruta']);
    });
  });

  describe('Errores controlados', () => {
    it('obtenerMensajeError (0, 404, 500, genérico)', () => {
      // @ts-ignore - acceso a método privado solo para pruebas
      expect(component['obtenerMensajeError']({ status: 0 })).toContain('Servidor no disponible');
      // @ts-ignore
      expect(component['obtenerMensajeError']({ status: 404 })).toBe('Endpoint no encontrado.');
      // @ts-ignore
      expect(component['obtenerMensajeError']({ status: 500 })).toBe('Error interno del servidor.');
      // @ts-ignore
      expect(component['obtenerMensajeError']({ status: 400, message: 'Bad Request' }))
        .toBe('Error 400: Bad Request');
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './dashboard.component';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

describe('DashboardComponent (maestro)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  // ✅ URL BASE CORREGIDA - coincide con tu backend Express
  const BASE = 'http://localhost:3000/api/maestro/dashboard';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,      // standalone
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // ngOnInit ya se ejecutó en detectChanges -> hace un GET a /avisos/activos
    fixture.detectChanges();
    const initReq = httpMock.expectOne(`${BASE}/avisos/activos`);
    initReq.flush({ success: true, avisos: [] }); // ✅ Respuesta con objeto
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
  });

  describe('Carga de avisos', () => {
    it('cargarAvisos: debería poblar avisos desde la API (GET /avisos/activos)', () => {
      component.cargarAvisos();

      const req = httpMock.expectOne(`${BASE}/avisos/activos`);
      expect(req.request.method).toBe('GET');

      const mockResponse = {
        success: true,
        avisos: [
          {
            id: 1,
            titulo: 'Aviso de prueba',
            contenido: 'Contenido de prueba',
            activo: true,
            prioridad: 'media',
            fecha_creacion: new Date().toISOString(),
          },
        ]
      };
      
      req.flush(mockResponse); // ✅ Envía objeto completo

      expect(component.avisos.length).toBe(1);
      expect(component.avisos[0].titulo).toBe('Aviso de prueba');
    });

    it('cargarTodosLosAvisos: debería abrir gestión y cargar datos (GET /avisos)', () => {
      component.cargarTodosLosAvisos();

      const req = httpMock.expectOne(`${BASE}/avisos`);
      expect(req.request.method).toBe('GET');

      const mockResponse = {
        success: true,
        avisos: [
          {
            id: 1,
            titulo: 'Aviso 1',
            contenido: 'Contenido 1',
            activo: true,
            prioridad: 'media',
            fecha_creacion: new Date().toISOString(),
          },
        ]
      };
      
      req.flush(mockResponse);

      expect(component.todosLosAvisos.length).toBe(1);
      expect(component.todosLosAvisos[0].titulo).toBe('Aviso 1');
      expect(component.mostrarGestionAvisos).toBeTrue();
      expect(component.mostrarSeleccionados).toBeFalse();
    });

    it('manejo de error al cargar avisos activos', () => {
      spyOn(console, 'error');

      component.cargarAvisos();
      const req = httpMock.expectOne(`${BASE}/avisos/activos`);
      req.flush('err', { status: 500, statusText: 'Server Error' });

      expect(console.error).toHaveBeenCalled();
      expect(component.avisos).toEqual([]);
      expect(component.errorAvisos).toContain('Error interno');
    });
  });

  describe('Selección múltiple', () => {
    beforeEach(() => {
      component.todosLosAvisos = [
        {
          id: 1,
          titulo: 'Aviso A',
          contenido: 'Contenido A',
          activo: true,
          prioridad: 'media',
        },
        {
          id: 2,
          titulo: 'Aviso B',
          contenido: 'Contenido B',
          activo: false,
          prioridad: 'alta',
        },
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
    });

    it('aplicarSelección -> PATCH /avisos/{id}/toggle por cada seleccionado', () => {
      spyOn(component, 'cargarAvisos');
      spyOn(component, 'cargarTodosLosAvisos');

      component.toggleSeleccionAviso(1);
      component.toggleSeleccionAviso(2);

      component.aplicarSeleccion();

      // ✅ PRIMERA petición PATCH (no GET)
      const req1 = httpMock.expectOne(`${BASE}/avisos/1/toggle`);
      expect(req1.request.method).toBe('PATCH'); // ✅ Cambiado de GET a PATCH
      req1.flush({ success: true });

      // ✅ SEGUNDA petición PATCH (no GET)
      const req2 = httpMock.expectOne(`${BASE}/avisos/2/toggle`);
      expect(req2.request.method).toBe('PATCH'); // ✅ Cambiado de GET a PATCH
      req2.flush({ success: true });

      expect(component.cargarAvisos).toHaveBeenCalled();
      expect(component.cargarTodosLosAvisos).toHaveBeenCalled();
    });
  });

  describe('CRUD con backend', () => {
    it('guardarAviso (crear) -> POST /avisos', () => {
      spyOn(component, 'cargarAvisos');

      component.editandoAviso = false;
      component.avisoEditando = {
        titulo: 'Nuevo aviso',
        contenido: 'Contenido del nuevo aviso',
        prioridad: 'alta',
        activo: true,
      };

      component.guardarAviso();

      const req = httpMock.expectOne(`${BASE}/avisos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(component.avisoEditando);
      
      req.flush({ 
        success: true, 
        aviso: { 
          id: 10,
          titulo: 'Nuevo aviso',
          contenido: 'Contenido del nuevo aviso',
          prioridad: 'alta',
          activo: true,
          fecha_creacion: new Date().toISOString()
        } 
      });

      expect(component.mostrarModalAviso).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('guardarAviso (actualizar) -> PUT /avisos/:id', () => {
      spyOn(component, 'cargarAvisos');

      component.editandoAviso = true;
      component.avisoEditando = {
        id: 5,
        titulo: 'Aviso editado',
        contenido: 'Contenido editado',
        prioridad: 'media',
        activo: false,
      };

      component.guardarAviso();

      const req = httpMock.expectOne(`${BASE}/avisos/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(component.avisoEditando);
      
      req.flush({ 
        success: true, 
        aviso: { 
          id: 5,
          titulo: 'Aviso editado',
          contenido: 'Contenido editado',
          prioridad: 'media',
          activo: false,
          fecha_actualizacion: new Date().toISOString()
        } 
      });

      expect(component.mostrarModalAviso).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('eliminarAviso -> DELETE /avisos/:id', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'cargarAvisos');

      component.eliminarAviso(7);

      const req = httpMock.expectOne(`${BASE}/avisos/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Aviso eliminado correctamente' });

      expect(component.cargarAvisos).toHaveBeenCalled();
    });

    it('toggleAviso -> PATCH /avisos/:id/toggle y recarga', () => {
      spyOn(component, 'cargarAvisos');
      spyOn(component, 'cargarTodosLosAvisos');

      const aviso: any = {
        id: 3,
        activo: true,
        titulo: 'Aviso de prueba',
        contenido: 'Contenido de prueba',
        prioridad: 'media',
      };

      component.toggleAviso(aviso);

      // ✅ PATCH (no GET)
      const req = httpMock.expectOne(`${BASE}/avisos/3/toggle`);
      expect(req.request.method).toBe('PATCH'); // ✅ Cambiado de GET a PATCH
      req.flush({ success: true, nuevoEstado: 0 });

      expect(aviso.activo).toBeFalse();
      expect(component.cargarAvisos).toHaveBeenCalled();
      expect(component.cargarTodosLosAvisos).toHaveBeenCalled();
    });
  });

  describe('Utilidades y UI', () => {
    it('getAvisosActivos usa todosLosAvisos', () => {
      component.todosLosAvisos = [
        { id: 1, activo: true, prioridad: 'media' } as any,
        { id: 2, activo: false, prioridad: 'baja' } as any,
      ];
      expect(component.getAvisosActivos().length).toBe(1);
    });

    it('getEstadoAviso', () => {
      expect(component.getEstadoAviso(true)).toBe('Activo');
      expect(component.getEstadoAviso(false)).toBe('Oculto');
    });

    it('formatearFecha: maneja nulos e inválidos y formatea válidos', () => {
      expect(component.formatearFecha(null as any)).toBe('—');
      expect(component.formatearFecha('fecha inválida' as any)).toBe('fecha inválida');
      const fechaFormateada = component.formatearFecha(
        new Date('2024-01-15T10:30:00').toISOString()
      );
      expect(fechaFormateada).toContain('15/01/2024');
      expect(fechaFormateada).toContain('10:30');
    });

    it('muestra el modal de crear/editar cuando mostrarModalAviso es true', () => {
      component.mostrarModalAviso = true;
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.overlay'));
      expect(modal).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('navigateTo llama Router.navigate', () => {
      const router = TestBed.inject(Router);
      const spy = spyOn(router, 'navigate');
      component.navigateTo('/maestro/estudiantes');
      expect(spy).toHaveBeenCalledWith(['/maestro/estudiantes']);
    });
  });

  describe('Errores controlados', () => {
    // @ts-ignore acceso solo para pruebas
    const obtenerMensajeError = (err: any) =>
      // @ts-ignore
      component['obtenerMensajeError'](err);

    it('obtenerMensajeError distintos códigos', () => {
      expect(obtenerMensajeError({ status: 0 })).toContain(
        'Servidor no disponible'
      );
      expect(obtenerMensajeError({ status: 404 })).toBe(
        'Endpoint no encontrado.'
      );
      expect(obtenerMensajeError({ status: 500 })).toBe(
        'Error interno del servidor.'
      );
      expect(
        obtenerMensajeError({ status: 400, message: 'Bad Request' })
      ).toBe('Error 400: Bad Request');
    });
  });
});
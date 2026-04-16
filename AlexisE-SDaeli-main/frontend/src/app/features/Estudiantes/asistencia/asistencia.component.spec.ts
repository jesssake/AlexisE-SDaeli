// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\asistencia\asistencia.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { EstudianteAsistenciaComponent } from './asistencia.component';
import { of, throwError } from 'rxjs';

describe('EstudianteAsistenciaComponent', () => {
  let component: EstudianteAsistenciaComponent;
  let fixture: ComponentFixture<EstudianteAsistenciaComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        EstudianteAsistenciaComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EstudianteAsistenciaComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // ============================================
  // PRUEBAS BÁSICAS DEL COMPONENTE
  // ============================================

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct initial values', () => {
    expect(component.estudianteId).toBe(0);
    expect(component.estudianteNombre).toBe('');
    expect(component.tutorNombre).toBe('');
    expect(component.cargando).toBeFalse();
    expect(component.asistencias).toEqual([]);
    expect(component.resumenMensual).toEqual([]);
    expect(component.ultimaAsistencia).toBeNull();
    expect(component.error).toBe('');
    expect(component.mensajeExito).toBe('');
  });

  it('should get meses array correctly', () => {
    const meses = component.meses;
    expect(meses.length).toBe(12);
    expect(meses[0]).toEqual({ numero: '01', nombre: 'Enero' });
    expect(meses[11]).toEqual({ numero: '12', nombre: 'Diciembre' });
  });

  it('should get anios array correctly', () => {
    const anios = component.anios;
    const currentYear = new Date().getFullYear();
    
    expect(anios.length).toBe(5);
    expect(anios[0]).toBe(currentYear.toString());
    expect(anios[1]).toBe((currentYear - 1).toString());
    expect(anios[4]).toBe((currentYear - 4).toString());
  });

  it('should get limites array correctly', () => {
    expect(component.limites).toEqual([10, 25, 50, 100, 250]);
  });

  it('should initialize dates correctly', () => {
    const today = new Date();
    const expectedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const expectedYear = today.getFullYear().toString();
    
    expect(component.mesSeleccionado).toBe(expectedMonth);
    expect(component.anioSeleccionado).toBe(expectedYear);
    expect(component.limiteRegistros).toBe(50);
  });

  // ============================================
  // PRUEBAS DE MÉTODOS DE UI
  // ============================================

  describe('UI Methods', () => {
    it('should get estado class correctly', () => {
      expect(component.getEstadoClass('PRESENTE')).toBe('estado-presente');
      expect(component.getEstadoClass('AUSENTE')).toBe('estado-ausente');
      expect(component.getEstadoClass('JUSTIFICADO')).toBe('estado-justificado');
      expect(component.getEstadoClass('UNKNOWN')).toBe('estado-desconocido');
    });

    it('should get estado icon correctly', () => {
      expect(component.getEstadoIcon('PRESENTE')).toBe('✅');
      expect(component.getEstadoIcon('AUSENTE')).toBe('❌');
      expect(component.getEstadoIcon('JUSTIFICADO')).toBe('⚠️');
      expect(component.getEstadoIcon('UNKNOWN')).toBe('❓');
    });

    it('should get estado text correctly', () => {
      expect(component.getEstadoText('PRESENTE')).toBe('Presente');
      expect(component.getEstadoText('AUSENTE')).toBe('Ausente');
      expect(component.getEstadoText('JUSTIFICADO')).toBe('Justificado');
      expect(component.getEstadoText('UNKNOWN')).toBe('No registrado');
    });

    it('should get porcentaje color correctly', () => {
      expect(component.getPorcentajeColor(95)).toBe('excelente');
      expect(component.getPorcentajeColor(85)).toBe('bueno');
      expect(component.getPorcentajeColor(75)).toBe('bueno');
      expect(component.getPorcentajeColor(70)).toBe('regular');
      expect(component.getPorcentajeColor(65)).toBe('regular');
      expect(component.getPorcentajeColor(50)).toBe('bajo');
      expect(component.getPorcentajeColor(30)).toBe('bajo');
    });

    it('should format date correctly', () => {
      const testDate = '2025-12-15';
      const formatted = component.formatearFecha(testDate);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle empty date formatting', () => {
      expect(component.formatearFecha('')).toBe('');
      expect(component.formatearFecha(null as any)).toBe('');
      expect(component.formatearFecha(undefined as any)).toBe('');
    });

    it('should get day of week correctly', () => {
      const monday = '2025-12-15'; // Un lunes
      expect(component.getDiaSemana(monday)).toBe('Lunes');
      
      const friday = '2025-12-19'; // Un viernes
      expect(component.getDiaSemana(friday)).toBe('Viernes');
    });

    it('should update fechaActual on init', () => {
      expect(component.fechaActual).toBeTruthy();
      expect(typeof component.fechaActual).toBe('string');
      expect(component.fechaActual.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // PRUEBAS DE MÉTODOS DE FILTRO
  // ============================================

  describe('Filter Methods', () => {
    beforeEach(() => {
      spyOn(component, 'cargarAsistencia' as any);
    });

    it('should call cargarAsistencia on mes change', () => {
      component.onMesChange();
      expect(component['cargarAsistencia']).toHaveBeenCalled();
    });

    it('should call cargarAsistencia on anio change', () => {
      component.onAnioChange();
      expect(component['cargarAsistencia']).toHaveBeenCalled();
    });

    it('should call cargarAsistencia on limite change', () => {
      component.onLimiteChange();
      expect(component['cargarAsistencia']).toHaveBeenCalled();
    });

    it('should reset filters correctly', () => {
      spyOn(component as any, 'inicializarFechas');
      
      component.mesSeleccionado = '06';
      component.anioSeleccionado = '2024';
      component.limiteRegistros = 100;

      component.limpiarFiltros();

      expect(component['inicializarFechas']).toHaveBeenCalled();
      expect(component.limiteRegistros).toBe(50);
      expect(component['cargarAsistencia']).toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBAS DE MÉTODOS DE REPORTE
  // ============================================

  describe('Report Methods', () => {
    beforeEach(() => {
      spyOn(window, 'open');
      component.estudianteId = 1;
    });

    it('should open PDF report window', () => {
      component.descargarReporte('pdf');
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/api/estudiante/asistencia/1/reporte?formato=pdf',
        '_blank'
      );
    });

    it('should open Excel report window', () => {
      component.descargarReporte('excel');
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/api/estudiante/asistencia/1/reporte?formato=excel',
        '_blank'
      );
    });

    it('should open JSON report window', () => {
      component.descargarReporte('json');
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/api/estudiante/asistencia/1/reporte?formato=json',
        '_blank'
      );
    });

    it('should default to PDF when no format specified', () => {
      component.descargarReporte();
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/api/estudiante/asistencia/1/reporte?formato=pdf',
        '_blank'
      );
    });

    it('should set success message when generating report', () => {
      component.descargarReporte('pdf');
      expect(component.mensajeExito).toBe('Descargando reporte en formato PDF...');
    });
  });

  // ============================================
  // PRUEBAS DE CONEXIÓN CON BACKEND
  // ============================================

  describe('Backend Connection', () => {
    beforeEach(() => {
      component.estudianteId = 1;
    });

    it('should test backend connection successfully', fakeAsync(() => {
      const testUrl = 'http://localhost:3000/api/estudiante/asistencia/test';
      
      component.probarConexion();
      
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.method).toBe('GET');
      
      req.flush({
        ok: true,
        message: '✅ API de asistencia para estudiantes funcionando correctamente'
      });
      
      tick();
      
      expect(component.mensajeExito).toBe('✅ Conexión con el backend establecida correctamente');
      expect(component.error).toBe('');
    }));

    it('should handle backend connection error', fakeAsync(() => {
      const testUrl = 'http://localhost:3000/api/estudiante/asistencia/test';
      
      component.probarConexion();
      
      const req = httpTestingController.expectOne(testUrl);
      req.flush(
        { error: 'Connection failed' },
        { status: 500, statusText: 'Server Error' }
      );
      
      tick();
      
      expect(component.error).toBe('❌ No se puede conectar con el backend. Verifica que esté ejecutándose.');
    }));
  });

  // ============================================
  // PRUEBAS DE CARGA DE DATOS DEL ESTUDIANTE
  // ============================================

  describe('Student Data Loading', () => {
    it('should load student data from localStorage', () => {
      const mockUserData = {
        id: 123,
        nino_nombre: 'Juan Pérez',
        tutor_nombre: 'María Pérez',
        email: 'juan@email.com'
      };

      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUserData));
      
      // Llamar al método privado usando bracket notation
      component['cargarDatosEstudiante']();
      
      expect(component.estudianteId).toBe(123);
      expect(component.estudianteNombre).toBe('Juan Pérez');
      expect(component.tutorNombre).toBe('María Pérez');
    });

    it('should handle missing user data', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      
      component['cargarDatosEstudiante']();
      
      expect(component.estudianteId).toBe(0);
      expect(component.error).toBe('No hay datos de usuario. Por favor, inicia sesión nuevamente.');
    });

    it('should handle invalid JSON in localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue('invalid-json');
      spyOn(console, 'error');
      
      component['cargarDatosEstudiante']();
      
      expect(console.error).toHaveBeenCalled();
      expect(component.error).toBe('Error al cargar los datos del estudiante.');
    });
  });

  // ============================================
  // PRUEBAS DE CARGA DE ASISTENCIA (HTTP)
  // ============================================

  describe('Attendance Loading (HTTP)', () => {
    beforeEach(() => {
      component.estudianteId = 1;
    });

    it('should load attendance data successfully', fakeAsync(() => {
      const mockResponse = {
        ok: true,
        asistencias: [
          {
            id: 1,
            fecha: '2025-12-12',
            fecha_formateada: '12/12/2025',
            hora_clase: '08:00',
            estado: 'PRESENTE',
            comentario_maestro: 'Excelente participación',
            maestro_nombre: 'Profesor López',
            dia_semana: 'Viernes',
            dia: 12,
            mes_numero: 12,
            mes_nombre: 'Diciembre',
            anio: 2025
          }
        ],
        estadisticas: {
          generales: {
            total_dias: 10,
            presentes: 8,
            ausentes: 1,
            justificados: 1,
            porcentaje_asistencia: 90
          },
          mes_actual: {
            total_dias_mes: 5,
            presentes_mes: 4,
            ausentes_mes: 0,
            justificados_mes: 1,
            porcentaje_mes: 100
          }
        },
        ultima_asistencia: {
          fecha: '2025-12-12',
          estado: 'PRESENTE',
          comentario_maestro: 'Participó activamente'
        }
      };

      component.cargarAsistencia();
      
      const expectedUrl = `http://localhost:3000/api/estudiante/asistencia/1?mes=${component.mesSeleccionado}&año=${component.anioSeleccionado}&limite=${component.limiteRegistros}`;
      const req = httpTestingController.expectOne(expectedUrl);
      
      expect(req.request.method).toBe('GET');
      expect(component.cargando).toBeTrue();
      
      req.flush(mockResponse);
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.asistencias.length).toBe(1);
      expect(component.asistencias[0].estado).toBe('PRESENTE');
      expect(component.estadisticas.generales.porcentaje_asistencia).toBe(90);
      expect(component.ultimaAsistencia).toBeTruthy();
      expect(component.mensajeExito).toBe('Cargadas 1 asistencias');
      expect(component.error).toBe('');
    }));

    it('should handle empty attendance data', fakeAsync(() => {
      const mockResponse = {
        ok: true,
        asistencias: [],
        estadisticas: {
          generales: {
            total_dias: 0,
            presentes: 0,
            ausentes: 0,
            justificados: 0,
            porcentaje_asistencia: 0
          }
        }
      };

      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush(mockResponse);
      tick();
      
      expect(component.asistencias).toEqual([]);
      expect(component.cargando).toBeFalse();
    }));

    it('should handle API error response', fakeAsync(() => {
      const mockErrorResponse = {
        ok: false,
        message: 'Estudiante no encontrado'
      };

      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush(mockErrorResponse);
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.error).toBe('Estudiante no encontrado');
      expect(component.asistencias).toEqual([]);
    }));

    it('should handle network error', fakeAsync(() => {
      spyOn(console, 'error');
      
      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.error(new ProgressEvent('Network error'), { status: 0 });
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.error).toContain('No se pudo conectar con el servidor');
      expect(console.error).toHaveBeenCalled();
    }));

    it('should handle 404 error', fakeAsync(() => {
      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush(
        { error: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.error).toBe('Estudiante no encontrado en el sistema.');
    }));

    it('should handle 500 error', fakeAsync(() => {
      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush(
        { error: 'Internal Server Error' },
        { status: 500, statusText: 'Server Error' }
      );
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.error).toBe('Error del servidor. Por favor, intenta más tarde.');
    }));
  });

  // ============================================
  // PRUEBAS DE CARGA DE ASISTENCIA DE HOY
  // ============================================

  describe('Today\'s Attendance', () => {
    beforeEach(() => {
      component.estudianteId = 1;
    });

    it('should load today\'s attendance successfully', fakeAsync(() => {
      const mockResponse = {
        ok: true,
        tiene_asistencia: true,
        asistencia: {
          fecha: '2025-12-12',
          hora_clase: '08:00',
          estado: 'PRESENTE',
          comentario_maestro: 'Llegó puntual'
        }
      };

      component.cargarAsistenciaHoy();
      
      const req = httpTestingController.expectOne(
        'http://localhost:3000/api/estudiante/asistencia/1/hoy'
      );
      expect(req.request.method).toBe('GET');
      expect(component.cargando).toBeTrue();
      
      req.flush(mockResponse);
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.mensajeExito).toBe('Hoy: PRESENTE a las 08:00');
    }));

    it('should handle no attendance for today', fakeAsync(() => {
      const mockResponse = {
        ok: true,
        tiene_asistencia: false,
        asistencia: null
      };

      component.cargarAsistenciaHoy();
      
      const req = httpTestingController.expectOne(
        'http://localhost:3000/api/estudiante/asistencia/1/hoy'
      );
      req.flush(mockResponse);
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(component.mensajeExito).toBe('No hay asistencia registrada para hoy');
    }));

    it('should handle error loading today\'s attendance', fakeAsync(() => {
      spyOn(console, 'error');
      
      component.cargarAsistenciaHoy();
      
      const req = httpTestingController.expectOne(
        'http://localhost:3000/api/estudiante/asistencia/1/hoy'
      );
      req.flush(
        { error: 'Server Error' },
        { status: 500, statusText: 'Server Error' }
      );
      tick();
      
      expect(component.cargando).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    }));
  });

  // ============================================
  // PRUEBAS DE MANEJO DE ERRORES
  // ============================================

  describe('Error Handling', () => {
    it('should handle missing student ID when loading attendance', () => {
      component.estudianteId = 0;
      component.cargarAsistencia();
      
      expect(component.error).toBe('ID del estudiante no disponible');
      expect(component.cargando).toBeFalse();
    });

    it('should handle missing student ID when generating report', () => {
      component.estudianteId = 0;
      spyOn(window, 'open');
      
      component.descargarReporte('pdf');
      
      expect(window.open).not.toHaveBeenCalled();
      expect(component.mensajeExito).toBe('');
    });

    it('should handle missing student ID when checking today\'s attendance', () => {
      component.estudianteId = 0;
      component.cargarAsistenciaHoy();
      
      expect(component.cargando).toBeFalse();
    });
  });

  // ============================================
  // PRUEBAS DE RENDIMIENTO Y ESTADO
  // ============================================

  describe('Performance and State', () => {
    it('should reset loading state after API call', fakeAsync(() => {
      component.estudianteId = 1;
      component.cargarAsistencia();
      
      expect(component.cargando).toBeTrue();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush({ ok: true, asistencias: [] });
      tick();
      
      expect(component.cargando).toBeFalse();
    }));

    it('should clear error message on successful load', fakeAsync(() => {
      component.estudianteId = 1;
      component.error = 'Error anterior';
      
      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush({ ok: true, asistencias: [] });
      tick();
      
      expect(component.error).toBe('');
    }));

    it('should clear success message on error', fakeAsync(() => {
      component.estudianteId = 1;
      component.mensajeExito = 'Mensaje anterior';
      
      component.cargarAsistencia();
      
      const req = httpTestingController.expectOne(
        req => req.url.includes('/api/estudiante/asistencia/')
      );
      req.flush(
        { ok: false, message: 'Error' },
        { status: 400, statusText: 'Bad Request' }
      );
      tick();
      
      expect(component.mensajeExito).toBe('');
    }));
  });
});
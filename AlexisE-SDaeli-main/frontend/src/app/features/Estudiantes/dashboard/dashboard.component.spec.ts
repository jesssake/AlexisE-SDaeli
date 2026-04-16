import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardEstudianteComponent } from './dashboard.component';

describe('DashboardEstudianteComponent', () => {
  let component: DashboardEstudianteComponent;
  let fixture: ComponentFixture<DashboardEstudianteComponent>;
  let httpMock: HttpTestingController;

  const BASE = 'http://localhost:3000/api/estudiante/dashboard';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardEstudianteComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardEstudianteComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar avisos al inicializar', () => {
    fixture.detectChanges();
    
    const req = httpMock.expectOne(`${BASE}/avisos`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, avisos: [] });

    const reqStats = httpMock.expectOne(`${BASE}/estadisticas`);
    expect(reqStats.request.method).toBe('GET');
    reqStats.flush({ success: true, estadisticas: {} });
  });

  it('debería mostrar modal al hacer click en aviso', () => {
    const avisoMock = {
      id: 1,
      titulo: 'Test',
      contenido: 'Contenido test',
      prioridad: 'media' as const,
      publicado: '2024-01-01',
      fecha_formateada: '01/01/2024 10:00'
    };

    component.verDetalleAviso(avisoMock);
    expect(component.mostrarModalDetalle).toBeTrue();
    expect(component.avisoSeleccionado).toEqual(avisoMock);
  });

  it('debería cerrar modal correctamente', () => {
    component.mostrarModalDetalle = true;
    component.avisoSeleccionado = {} as any;
    
    component.cerrarModalDetalle();
    
    expect(component.mostrarModalDetalle).toBeFalse();
    expect(component.avisoSeleccionado).toBeNull();
  });

  it('debería actualizar fecha correctamente', () => {
    component.ngOnInit();
    expect(component.fechaActual.hora).toBeDefined();
    expect(component.fechaActual.dia).toBeDefined();
    expect(component.fechaActual.mes).toBeDefined();
    expect(component.fechaActual.anio).toBeDefined();
  });
});
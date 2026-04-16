// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\graduacion\graduacion.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EstudianteGraduacionComponent } from './graduacion.component';

describe('EstudianteGraduacionComponent', () => {
  let component: EstudianteGraduacionComponent;
  let fixture: ComponentFixture<EstudianteGraduacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EstudianteGraduacionComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EstudianteGraduacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería tener propiedades iniciales correctas', () => {
    expect(component.cargando).toBe(false);
    expect(component.certificados).toEqual([]);
    expect(component.ciclosUnicos).toEqual([]);
    expect(component.stats.total).toBe(0);
  });

  it('debería formatear números correctamente', () => {
    // Esta prueba es para un método privado, tendrías que hacerlo público o testear indirectamente
    const result = component['formatNumero']('10.5'); // Nota: esto es solo un ejemplo
    expect(result).toBe('10.50');
  });

  it('debería obtener colores según el promedio', () => {
    expect(component.getColorPromedio(9.8)).toBe('#059669'); // Excelente
    expect(component.getColorPromedio(8.7)).toBe('#34d399'); // Bueno
    expect(component.getColorPromedio(7.5)).toBe('#f97316'); // Aprobado
    expect(component.getColorPromedio(6.5)).toBe('#ef4444'); // Bajo
  });

  it('debería obtener texto correcto para estados', () => {
    expect(component.estadoTexto('enviado')).toBe('Enviado');
    expect(component.estadoTexto('pendiente')).toBe('Pendiente');
    expect(component.estadoTexto('cancelado')).toBe('Cancelado');
    expect(component.estadoTexto('desconocido')).toBe('desconocido');
  });

  it('debería obtener colores correctos para estados', () => {
    expect(component.getColorEstado('enviado')).toBe('#10b981');
    expect(component.getColorEstado('pendiente')).toBe('#f59e0b');
    expect(component.getColorEstado('cancelado')).toBe('#ef4444');
    expect(component.getColorEstado('desconocido')).toBe('#6b7280');
  });
});
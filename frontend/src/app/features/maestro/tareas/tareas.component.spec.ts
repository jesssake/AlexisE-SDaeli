import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TareasComponent } from './tareas.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('TareasComponent', () => {
  let fixture: ComponentFixture<TareasComponent>;
  let component: TareasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TareasComponent, // Componente standalone
        HttpClientTestingModule,
        CommonModule,
        FormsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe manejar correctamente los métodos de template', () => {
    const tareaMock = {
      permitir_entrega_tarde: 1,
      activa: 1,
      titulo: 'Test Tarea'
    };

    expect(component.permiteTarde(tareaMock)).toBeTrue();
    expect(component.estaActiva(tareaMock)).toBeTrue();
    expect(component.permitidoTardeText(tareaMock)).toContain('Sí');
    expect(component.activaText(tareaMock)).toContain('Activa');
  });

  it('debe manejar valores nulos en métodos de template', () => {
    expect(component.permiteTarde(null)).toBeFalse();
    expect(component.estaActiva(null)).toBeFalse();
    expect(component.permitidoTardeText(null)).toBe('—');
    expect(component.activaText(null)).toBe('—');
  });

  it('debe manejar correctamente fileUrl', () => {
    expect(component.fileUrl(null)).toBeNull();
    expect(component.fileUrl('undefined')).toBeNull();
    expect(component.fileUrl('null')).toBeNull();
    expect(component.fileUrl('/archivo.pdf')).toContain('http://localhost/gestion_e/');
  });

  it('debe manejar correctamente estadoClass', () => {
    expect(component.estadoClass('revisado')).toContain('revisado');
    expect(component.estadoClass('entregado')).toContain('entregado');
    expect(component.estadoClass('pendiente')).toContain('pendiente');
    expect(component.estadoClass(null)).toContain('pendiente');
  });
});
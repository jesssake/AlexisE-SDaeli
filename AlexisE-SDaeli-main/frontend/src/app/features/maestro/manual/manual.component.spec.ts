import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualComponent } from './manual.component';

describe('ManualComponent', () => {
  let component: ManualComponent;
  let fixture: ComponentFixture<ManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have sections defined', () => {
    expect(component.secciones.length).toBeGreaterThan(0);
  });

  it('should change active section', () => {
    const initialSection = component.seccionActiva;
    const newSection = 'estudiantes';
    
    component.cambiarSeccion(newSection);
    
    expect(component.seccionActiva).toBe(newSection);
    expect(component.seccionActiva).not.toBe(initialSection);
  });

  it('should get active section correctly', () => {
    component.seccionActiva = 'tareas';
    const activeSection = component.obtenerSeccionActiva();
    
    expect(activeSection.id).toBe('tareas');
    expect(activeSection.titulo).toBe('Tareas');
  });

  it('should have dashboard as default active section', () => {
    expect(component.seccionActiva).toBe('dashboard');
  });

  it('should have all required section properties', () => {
    component.secciones.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.titulo).toBeDefined();
      expect(section.icono).toBeDefined();
      expect(section.descripcion).toBeDefined();
      expect(section.pasos).toBeDefined();
      expect(Array.isArray(section.pasos)).toBeTrue();
    });
  });

  it('should call download method', () => {
    spyOn(component, 'descargarManualPDF');
    
    component.descargarManualPDF();
    
    expect(component.descargarManualPDF).toHaveBeenCalled();
  });

  it('should call print method', () => {
    spyOn(window, 'print');
    
    component.imprimirManual();
    
    expect(window.print).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuAlumnoComponent } from './menu-alumno.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('MenuAlumnoComponent', () => {
  let component: MenuAlumnoComponent;
  let fixture: ComponentFixture<MenuAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuAlumnoComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuAlumnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con estado de carga falso', () => {
    expect(component.cargando).toBeFalse();
  });

  it('debe cargar preferencias premium desde localStorage', () => {
    const mockPrefs = {
      mostrarMenuBotones: false,
      gridCols: 2,
      menuCompacto: true,
      tema: 'oscuro',
      animaciones: false
    };
    
    localStorage.setItem('prefs_estudiante', JSON.stringify(mockPrefs));
    component.cargarPrefs();
    
    expect(component.prefs.mostrarMenuBotones).toBeFalse();
    expect(component.prefs.gridCols).toBe(2);
    expect(component.prefs.menuCompacto).toBeTrue();
    expect(component.prefs.tema).toBe('oscuro');
    expect(component.prefs.animaciones).toBeFalse();
  });

  it('debe generar iniciales premium correctamente', () => {
    expect(component.getInitials('Juan Pérez García')).toBe('JP');
    expect(component.getInitials('Ana María López')).toBe('AM');
    expect(component.getInitials('Carlos')).toBe('CA');
  });

  it('debe alternar correctamente la barra lateral premium', () => {
    expect(component.sidebarColapsada).toBeFalse();
    component.toggleSidebar();
    expect(component.sidebarColapsada).toBeTrue();
    component.toggleSidebar();
    expect(component.sidebarColapsada).toBeFalse();
  });

  it('debe calcular correctamente la edad', () => {
    const fechaNacimiento = '2008-05-15';
    const edad = component.calcularEdad(fechaNacimiento);
    expect(edad).toBeGreaterThan(10);
    expect(edad).toBeLessThan(20);
  });

  it('debe generar métricas de rendimiento realistas', () => {
    const promedio = component['generarPromedioAleatorio']();
    const asistencia = component['generarAsistenciaAleatoria']();
    
    expect(promedio).toBeGreaterThanOrEqual(80);
    expect(promedio).toBeLessThanOrEqual(99);
    expect(asistencia).toBeGreaterThanOrEqual(85);
    expect(asistencia).toBeLessThanOrEqual(99);
  });

  it('debe alternar correctamente entre temas', () => {
    expect(component.prefs.tema).toBe('claro');
    component.toggleTema();
    expect(component.prefs.tema).toBe('oscuro');
    component.toggleTema();
    expect(component.prefs.tema).toBe('claro');
  });

  it('debe limitar correctamente los valores numéricos', () => {
    expect(component['clamp'](5, 1, 10)).toBe(5);
    expect(component['clamp'](15, 1, 10)).toBe(10);
    expect(component['clamp'](0, 1, 10)).toBe(1);
    expect(component['clamp'](NaN, 1, 10)).toBe(1);
  });

  it('debe detectar correctamente la vista móvil', () => {
    // Simular vista desktop
    spyOnProperty(window, 'innerWidth').and.returnValue(1200);
    component.checkMobileView();
    expect(component.isMobile).toBeFalse();
    
    // Simular vista móvil
    spyOnProperty(window, 'innerWidth').and.returnValue(768);
    component.checkMobileView();
    expect(component.isMobile).toBeTrue();
  });

  it('debe manejar correctamente el overlay en móvil', () => {
    component.isMobile = true;
    component.sidebarColapsada = true;
    
    expect(component.isMobileView()).toBeTrue();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
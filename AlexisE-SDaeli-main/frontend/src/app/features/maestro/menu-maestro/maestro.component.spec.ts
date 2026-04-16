import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MaestroComponent } from './maestro.component';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';

describe('MaestroComponent', () => {
  let component: MaestroComponent;
  let fixture: ComponentFixture<MaestroComponent>;
  let router: Router;
  let eventsSubject: Subject<any>;

  beforeEach(async () => {
    eventsSubject = new Subject<any>();

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([
          { path: 'auth/login', redirectTo: '' }
        ]),
        MaestroComponent
      ],
      providers: [
        { 
          provide: Router, 
          useValue: { 
            navigate: jasmine.createSpy('navigate'), 
            url: '/maestro/dashboard',
            events: eventsSubject.asObservable()
          } 
        },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaestroComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu', () => { 
    const initialValue = component.menuAbierto; 
    component.toggleMenu(); 
    expect(component.menuAbierto).toBe(!initialValue); 
  });

  it('should close menu', () => { 
    component.menuAbierto = true; 
    component.cerrarMenu(); 
    expect(component.menuAbierto).toBe(false); 
  });

  it('should close menu on mobile when cerrarMenuEnMovil is called', () => {
    component.isMobile = true;
    component.menuAbierto = true;
    component.cerrarMenuEnMovil();
    expect(component.menuAbierto).toBe(false);
  });

  it('should not close menu on desktop when cerrarMenuEnMovil is called', () => {
    component.isMobile = false;
    component.menuAbierto = true;
    component.cerrarMenuEnMovil();
    expect(component.menuAbierto).toBe(true);
  });

  it('should toggle user menu', () => {
    component.userMenuAbierto = false;
    component.toggleUserMenu();
    expect(component.userMenuAbierto).toBe(true);
    component.toggleUserMenu();
    expect(component.userMenuAbierto).toBe(false);
  });

  it('should close user menu', () => {
    component.userMenuAbierto = true;
    component.cerrarUserMenu();
    expect(component.userMenuAbierto).toBe(false);
  });

  it('should toggle category', () => {
    const initial = component.categoriasAbiertas.academica;
    component.toggleCategory('academica');
    expect(component.categoriasAbiertas.academica).toBe(!initial);
  });

  it('should navigate to login on cerrarSesion with confirmation', () => { 
    spyOn(window, 'confirm').and.returnValue(true);
    const navigateSpy = router.navigate as jasmine.Spy; 
    component.cerrarSesion();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login'], { 
      queryParams: jasmine.any(Object) 
    }); 
  });

  it('should not navigate to login on cerrarSesion without confirmation', () => { 
    spyOn(window, 'confirm').and.returnValue(false);
    const navigateSpy = router.navigate as jasmine.Spy; 
    component.cerrarSesion();
    expect(navigateSpy).not.toHaveBeenCalled(); 
  });

  it('should handle window resize', () => { 
    // Simular móvil
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: 500 
    }); 
    component.menuAbierto = true; 
    component['checkScreenSize'](); // Llamar directamente en lugar de dispatchEvent
    expect(component.isMobile).toBe(true);
    expect(component.isTablet).toBe(false);

    // Simular tablet
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: 900 
    }); 
    component['checkScreenSize']();
    expect(component.isMobile).toBe(false);
    expect(component.isTablet).toBe(true);

    // Simular desktop
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: 1200 
    }); 
    component['checkScreenSize']();
    expect(component.isMobile).toBe(false);
    expect(component.isTablet).toBe(false);
  });

  it('should update section on navigation end', () => {
    const url = '/maestro/estudiantes';
    Object.defineProperty(router, 'url', { value: url });
    eventsSubject.next(new NavigationEnd(1, url, url));
    expect(component.seccionActual).toBe('Estudiantes');
  });

  it('should get user initials', () => {
    component.nombreUsuario = 'Juan Perez';
    expect(component.obtenerIniciales()).toBe('JP');
  });

  it('should handle empty user name for initials', () => {
    component.nombreUsuario = '';
    expect(component.obtenerIniciales()).toBe('');
  });

  it('should handle single name for initials', () => {
    component.nombreUsuario = 'Juan';
    expect(component.obtenerIniciales()).toBe('J');
  });

  it('should close user menu on document click outside', () => {
    component.userMenuAbierto = true;
    
    // Crear elementos simulados
    const mockElement = document.createElement('div');
    const mockUserInfo = document.createElement('div');
    mockUserInfo.className = 'user-info';
    const mockUserDropdown = document.createElement('div');
    mockUserDropdown.className = 'user-dropdown';
    
    spyOn(document, 'querySelector').withArgs('.user-info').and.returnValue(mockUserInfo)
      .withArgs('.user-dropdown').and.returnValue(mockUserDropdown);
    
    const mockEvent = new MouseEvent('click');
    Object.defineProperty(mockEvent, 'target', { value: mockElement });
    
    spyOn(mockUserInfo, 'contains').and.returnValue(false);
    spyOn(mockUserDropdown, 'contains').and.returnValue(false);
    
    component.onDocumentClick(mockEvent);
    expect(component.userMenuAbierto).toBe(false);
  });

  it('should not close user menu when clicking inside', () => {
    component.userMenuAbierto = true;
    
    const mockElement = document.createElement('div');
    const mockUserInfo = document.createElement('div');
    mockUserInfo.className = 'user-info';
    const mockUserDropdown = document.createElement('div');
    mockUserDropdown.className = 'user-dropdown';
    
    spyOn(document, 'querySelector').withArgs('.user-info').and.returnValue(mockUserInfo)
      .withArgs('.user-dropdown').and.returnValue(mockUserDropdown);
    
    const mockEvent = new MouseEvent('click');
    Object.defineProperty(mockEvent, 'target', { value: mockUserInfo });
    
    spyOn(mockUserInfo, 'contains').and.returnValue(true);
    spyOn(mockUserDropdown, 'contains').and.returnValue(false);
    
    component.onDocumentClick(mockEvent);
    expect(component.userMenuAbierto).toBe(true);
  });

  it('should close menu on escape key when mobile', () => {
    component.isMobile = true;
    component.menuAbierto = true;
    component.userMenuAbierto = false;
    
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscapePress(mockEvent);
    
    expect(component.menuAbierto).toBe(false);
    expect(component.userMenuAbierto).toBe(false);
  });

  it('should close user menu on escape key', () => {
    component.isMobile = false;
    component.menuAbierto = true;
    component.userMenuAbierto = true;
    
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscapePress(mockEvent);
    
    expect(component.menuAbierto).toBe(true); // No se cierra en desktop
    expect(component.userMenuAbierto).toBe(false);
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    component['routerSubscription'] = { unsubscribe: unsubscribeSpy } as any;
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should load user from localStorage', () => {
    const userData = { nombre: 'Profesor Test' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(userData));
    component['cargarUsuarioActual']();
    expect(component.nombreUsuario).toBe('Profesor Test');
  });

  it('should handle localStorage error when loading user', () => {
    spyOn(localStorage, 'getItem').and.throwError('Error');
    component['cargarUsuarioActual']();
    expect(component.nombreUsuario).toBe('Maestro');
  });

  it('should save preferences to localStorage', () => {
    spyOn(localStorage, 'setItem');
    component['guardarPreferencias']();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'maestro_preferencias',
      jasmine.any(String)
    );
  });

  it('should load preferences from localStorage', () => {
    const preferencias = { categorias: { academica: false, comunicacion: true, administracion: true } };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(preferencias));
    component['cargarPreferencias']();
    expect(component.categoriasAbiertas.academica).toBe(false);
    expect(component.categoriasAbiertas.comunicacion).toBe(true);
    expect(component.categoriasAbiertas.administracion).toBe(true);
  });

  it('should handle error when loading preferences', () => {
    spyOn(localStorage, 'getItem').and.throwError('Error');
    component['cargarPreferencias']();
    // Debería mantener los valores por defecto
    expect(component.categoriasAbiertas.academica).toBe(true);
  });

  it('should handle error when saving preferences', () => {
    spyOn(localStorage, 'setItem').and.throwError('Error');
    // No debería lanzar error
    expect(() => component['guardarPreferencias']()).not.toThrow();
  });

  it('should clean cookies', () => {
    const mockCookie = 'test=value; another=value2';
    spyOnProperty(document, 'cookie', 'get').and.returnValue(mockCookie);
    spyOnProperty(document, 'cookie', 'set').and.returnValue();
    
    component['limpiarCookies']();
    
    // Verificar que se llamó a document.cookie para cada cookie
    expect(document.cookie).toHaveBeenCalledTimes(2);
  });

  it('should handle error when cleaning cookies', () => {
    spyOnProperty(document, 'cookie', 'get').and.throwError('Error');
    
    // No debería lanzar error
    expect(() => component['limpiarCookies']()).not.toThrow();
  });
});
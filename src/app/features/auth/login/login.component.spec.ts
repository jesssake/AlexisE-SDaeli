import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RegistroComponent } from '../registro/registro.component'; // â† AsegÃºrate que esta ruta es correcta (mismo folder que el spec)

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // EspÃ­a del Router con solo 'navigate'
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      // Si es componente standalone, basta importarlo aquÃ­
      imports: [RegistroComponent],
      providers: [{ provide: Router, useValue: routerSpyObj }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component.step).toBe(1);
  });

  it('should have empty form initially', () => {
    // Asegura que el modelo de form existe y con llaves esperadas
    expect(component.form).toBeDefined();
    expect(component.form.tutorName).toBe('');
    expect(component.form.tutorEmail).toBe('');
    expect(component.form.tutorPhone).toBe('');
    expect(component.form.tutorPassword).toBe('');
    expect(component.form.childName).toBe('');
    expect(component.form.childCondition).toBe('');
    expect(component.form.security).toEqual(['', '', '', '', '']);
  });

  it('should have correct days array', () => {
    expect(component.days.length).toBe(31);
    expect(component.days[0]).toBe(1);
    expect(component.days[30]).toBe(31);
  });

  it('should have correct months array', () => {
    expect(component.months.length).toBe(12);
    expect(component.months[0]).toBe(1);
    expect(component.months[11]).toBe(12);
  });

  it('should have years between 3 and 12 years ago', () => {
    const currentYear = new Date().getFullYear();
    expect(component.years.length).toBeGreaterThan(0);
    expect(component.years[0]).toBe(currentYear - 12);
    expect(component.years[component.years.length - 1]).toBe(currentYear - 3);
  });

  it('should have 5 recovery questions', () => {
    expect(component.recoveryQuestions.length).toBe(5);
    // Solo para validar que el contenido es el esperado (ej. incluye "mascota")
    expect(component.recoveryQuestions[0].toLowerCase()).toContain('mascota');
  });

  it('should move to next step when nextFromStep1 is called with valid data', () => {
    // Configurar datos vÃ¡lidos
    component.form.tutorName = 'Juan PÃ©rez';
    component.form.tutorEmail = 'juan@example.com';
    component.form.tutorPhone = '+52 555 1234 567';
    component.form.tutorPassword = 'Password123';
    component.confirmPassword = 'Password123';

    component.nextFromStep1();

    expect(component.step).toBe(2);
    expect(component.errors).toEqual({});
  });

  it('should not move to next step when nextFromStep1 is called with invalid data', () => {
    // Dejar datos invÃ¡lidos (vacÃ­os)
    component.confirmPassword = '';
    component.form.tutorName = '';
    component.form.tutorEmail = '';
    component.form.tutorPhone = '';
    component.form.tutorPassword = '';

    component.nextFromStep1();

    expect(component.step).toBe(1);
    expect(Object.keys(component.errors).length).toBeGreaterThan(0);
  });

  it('should validate email format correctly', () => {
    // Acceder a mÃ©todos privados usando bracket notation (si son privados)
    expect((component as any).emailOk('test@example.com')).toBeTrue();
    expect((component as any).emailOk('invalid-email')).toBeFalse();
  });

  it('should validate phone format correctly', () => {
    expect((component as any).phoneOk('+52 555 1234 567')).toBeTrue();
    expect((component as any).phoneOk('123')).toBeFalse();
  });

  it('should validate password format correctly', () => {
    expect((component as any).passOk('Password123')).toBeTrue();
    expect((component as any).passOk('weak')).toBeFalse();
  });

  it('should show password mismatch error', () => {
    component.form.tutorPassword = 'Password123';
    component.confirmPassword = 'DifferentPassword';

    component.nextFromStep1();

    expect(component.errors['confirmPassword']).toBe('Las contraseÃ±as no coinciden');
  });

  it('should have transition properties initialized', () => {
    expect(component.isTransitioning).toBeFalse();
    expect(component.transitionMessage).toBe('Cargando...');
  });

  it('should navigate to login when goToLogin is called', () => {
    component.goToLogin();
    expect(component.isTransitioning).toBeTrue();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});


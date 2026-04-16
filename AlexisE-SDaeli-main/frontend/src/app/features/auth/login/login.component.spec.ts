import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { LoginAuthService } from '../../../services/loginauth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<LoginAuthService>;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const authServiceSpyObj = jasmine.createSpyObj('LoginAuthService', [
      'login',
      'isAuthenticated',
      'logout'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: LoginAuthService, useValue: authServiceSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authServiceSpy = TestBed.inject(LoginAuthService) as jasmine.SpyObj<LoginAuthService>;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty model', () => {
    expect(component.model.email).toBe('');
    expect(component.model.password).toBe('');
  });

  it('should have initial state properties', () => {
    expect(component.loading).toBeFalse();
    expect(component.showPass).toBeFalse();
    expect(component.showMonkey).toBeTrue();
    expect(component.monkeyEyes).toBe('🙉');
  });

  it('should validate email format correctly', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';

    // Test valid email
    component.model.email = validEmail;
    expect((component as any).validarEmail(validEmail)).toBeTrue();

    // Test invalid email
    component.model.email = invalidEmail;
    expect((component as any).validarEmail(invalidEmail)).toBeFalse();
  });

  it('should show validation errors for empty form', () => {
    component.model.email = '';
    component.model.password = '';
    
    const isValid = (component as any).validarFormulario();
    
    expect(isValid).toBeFalse();
    expect(component.errors['email']).toBe('El email es requerido');
    expect(component.errors['password']).toBe('La contraseña es requerida');
  });

  it('should show error for invalid email format', () => {
    component.model.email = 'invalid';
    component.model.password = 'password123';
    
    const isValid = (component as any).validarFormulario();
    
    expect(isValid).toBeFalse();
    expect(component.errors['email']).toBe('Formato de email inválido');
  });

  it('should pass validation with correct data', () => {
    component.model.email = 'test@example.com';
    component.model.password = 'Password123';
    
    const isValid = (component as any).validarFormulario();
    
    expect(isValid).toBeTrue();
    expect(Object.keys(component.errors).length).toBe(0);
  });

  it('should toggle password visibility', () => {
    expect(component.showPass).toBeFalse();
    
    component.togglePasswordVisibility();
    expect(component.showPass).toBeTrue();
    
    component.togglePasswordVisibility();
    expect(component.showPass).toBeFalse();
  });

  it('should change monkey eyes on password input', () => {
    component.model.password = '';
    component.onPasswordInput();
    expect(component.monkeyEyes).toBe('🙈');
    
    component.model.password = 'pass';
    component.onPasswordInput();
    expect(component.monkeyEyes).toBe('🙊');
  });

  it('should handle email focus/blur', () => {
    component.onEmailFocus();
    expect(component.monkeyEyes).toBe('🙉');
    expect(component.showSpeech).toBeTrue();
    
    component.onEmailBlur();
    expect(component.showSpeech).toBeFalse();
  });

  it('should handle password focus/blur', () => {
    component.onPasswordFocus();
    expect(component.monkeyEyes).toBe('🙈');
    
    component.model.password = 'test';
    component.onPasswordBlur();
    expect(component.monkeyEyes).toBe('🙊');
  });

  it('should show monkey message', () => {
    const message = 'Test message';
    component.showMonkeyMessage(message);
    
    expect(component.monkeyMessage).toBe(message);
    expect(component.showSpeech).toBeTrue();
    
    // Message should hide after timeout
    fakeAsync(() => {
      tick(3000);
      expect(component.showSpeech).toBeFalse();
    });
  });

  it('should have test credentials for development', () => {
    expect(component['CREDENCIALES_PRUEBA']).toBeDefined();
    expect(component['CREDENCIALES_PRUEBA'].length).toBeGreaterThan(0);
    
    // Check structure of test credentials
    const testCred = component['CREDENCIALES_PRUEBA'][0];
    expect(testCred.email).toBeDefined();
    expect(testCred.password).toBeDefined();
    expect(testCred.rol).toBeDefined();
    expect(testCred.nombre).toBeDefined();
  });

  it('should have monkey messages dictionary', () => {
    expect(component['MONKEY_MESSAGES']).toBeDefined();
    expect(component['MONKEY_MESSAGES'].WELCOME).toContain('Hola');
    expect(component['MONKEY_MESSAGES'].EMAIL_FOCUS).toContain('correo');
    expect(component['MONKEY_MESSAGES'].PASSWORD_FOCUS).toContain('Shhh');
  });

  it('should get role-specific welcome message', () => {
    expect((component as any).obtenerMensajeRol('TUTOR')).toContain('Tutor');
    expect((component as any).obtenerMensajeRol('SuperAdmin')).toContain('Super Administrador');
    expect((component as any).obtenerMensajeRol('UNKNOWN_ROLE')).toContain('UNKNOWN_ROLE');
  });

  it('should navigate to register when goToRegister is called', fakeAsync(() => {
    component.goToRegister();
    tick(500);
    
    expect(component.isTransitioning).toBeTrue();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/registro']);
  }));

  it('should show recovery message when openRecovery is called', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.openRecovery(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.monkeyMessage).toContain('recuperación');
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', async () => {
      component.model.email = 'invalid';
      component.model.password = '';
      
      spyOn(component as any, 'iniciarLogin');
      
      await component.submit();
      
      expect((component as any).iniciarLogin).not.toHaveBeenCalled();
      expect(component.errors['email']).toBeDefined();
    });

    it('should call authService.login with correct parameters when form is valid', async () => {
      component.model.email = 'test@example.com';
      component.model.password = 'Password123';
      
      const mockResponse = {
        success: true,
        user: { email: 'test@example.com', rol: 'TUTOR', nombre: 'Test User' },
        token: 'mock-token'
      };
      
      authServiceSpy.login.and.returnValue(Promise.resolve(mockResponse) as any);
      
      await component.submit();
      
      expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  describe('Redirection Logic', () => {
    it('should redirect tutors to /estudiante/configuracion', async () => {
      const user = { rol: 'TUTOR', email: 'tutor@example.com' };
      
      await (component as any).redirigirSegunRol(user);
      
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(
        '/estudiante/configuracion',
        jasmine.objectContaining({ replaceUrl: true })
      );
    });

    it('should redirect admin roles to /maestro/dashboard', async () => {
      const roles = ['SuperAdmin', 'Admin', 'MAESTRO', 'PROFESOR', 'COORDINADOR'];
      
      for (const rol of roles) {
        routerSpy.navigateByUrl.calls.reset();
        const user = { rol, email: `${rol.toLowerCase()}@example.com` };
        
        await (component as any).redirigirSegunRol(user);
        
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(
          '/maestro/dashboard',
          jasmine.objectContaining({ replaceUrl: true })
        );
      }
    });

    it('should redirect unknown roles to /estudiante/dashboard', async () => {
      const user = { rol: 'UNKNOWN', email: 'unknown@example.com' };
      
      await (component as any).redirigirSegunRol(user);
      
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(
        '/estudiante/dashboard',
        jasmine.objectContaining({ replaceUrl: true })
      );
    });
  });
});
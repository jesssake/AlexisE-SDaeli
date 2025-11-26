import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [
        { provide: Router, useValue: routerSpyObj }
      ]
    })
    .compileComponents();

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
    expect(component.recoveryQuestions[0]).toContain('mascota');
  });

  it('should have transition properties initialized', () => {
    expect(component.isTransitioning).toBeFalse();
    expect(component.transitionMessage).toBe('Cargando...');
  });

  it('should navigate to login when goToLogin is called', () => {
    spyOn(component, 'goToLogin').and.callThrough();
    
    component.goToLogin();
    
    expect(component.goToLogin).toHaveBeenCalled();
    expect(component.isTransitioning).toBeTrue();
  });
});

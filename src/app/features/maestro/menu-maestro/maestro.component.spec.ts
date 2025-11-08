import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MaestroComponent } from './maestro.component';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

describe('MaestroComponent', () => {
  let component: MaestroComponent;
  let fixture: ComponentFixture<MaestroComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        MaestroComponent
      ],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate'), url: '/maestro/dashboard' } },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
    fixture = TestBed.createComponent(MaestroComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
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

  it('should navigate to login on cerrarSesion', () => { 
    const navigateSpy = spyOn(router, 'navigate'); 
    component.cerrarSesion();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']); 
  });

  it('should handle window resize', () => { 
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: 1024 
    }); 
    component.menuAbierto = true; 
    window.dispatchEvent(new Event('resize')); 
    expect(component.menuAbierto).toBe(false); 
  });
});

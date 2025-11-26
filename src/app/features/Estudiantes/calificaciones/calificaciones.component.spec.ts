import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalificacionesComponent } from './calificaciones.component';

describe('CalificacionesComponent (Alumno)', () => {
  let component: CalificacionesComponent;
  let fixture: ComponentFixture<CalificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalificacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });
});

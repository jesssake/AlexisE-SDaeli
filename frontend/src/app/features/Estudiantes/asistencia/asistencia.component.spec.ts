import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstudianteAsistenciaComponent } from './asistencia.component';

describe('EstudianteAsistenciaComponent', () => {
  let component: EstudianteAsistenciaComponent;
  let fixture: ComponentFixture<EstudianteAsistenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudianteAsistenciaComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EstudianteAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });
});

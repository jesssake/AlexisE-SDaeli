import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TareasEstudianteComponent } from './tareas.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TareasEstudianteComponent', () => {
  let fixture: ComponentFixture<TareasEstudianteComponent>;
  let component: TareasEstudianteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TareasEstudianteComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TareasEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe tener un alumno definido', () => {
    expect(component.alumno).toBeTruthy();
    expect(component.alumnoId).toBe(16);
  });

  it('debe cargar tareas al inicializar', () => {
    expect(component.loadingTareas).toBe(true);
  });
});
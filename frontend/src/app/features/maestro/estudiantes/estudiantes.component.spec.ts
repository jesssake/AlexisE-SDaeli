import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EstudiantesComponent, Estudiante } from './estudiantes.component';

describe('EstudiantesComponent', () => {
  let component: EstudiantesComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudiantesComponent, HttpClientTestingModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(EstudiantesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // ngOnInit -> recargar() -> GET /api/estudiantes.php
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/estudiantes.php');
    const mockData: Estudiante[] = [
      { id: 1, nombre: 'Luis Pérez', fecha_nacimiento: '2014-06-21', edad: 11, tutor_id: 1, correo_tutor: 'juanperez@example.com' },
      { id: 2, nombre: 'Carla Pérez', fecha_nacimiento: '2018-09-05', edad: 7, tutor_id: 1, correo_tutor: 'juanperez@example.com' },
    ];
    req.flush(mockData);
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load list into estudiantes', () => {
    expect(component.estudiantes.length).toBeGreaterThan(0);
  });

  it('should open and close modal for new record', () => {
    component.abrirModalNuevo();
    expect(component.modalAbierto).toBeTrue();
    expect(component.editando).toBeFalse();
    component.cerrarModal();
    expect(component.modalAbierto).toBeFalse();
  });

  it('should open modal in edit mode with prefilled form', () => {
    const e: Estudiante = {
      id: 5,
      nombre: 'Nino Prueba',
      fecha_nacimiento: '2016-05-20',
      edad: 9,
      tutor_id: 12,
      correo_tutor: 'tutor.prueba@example.com',
    };
    component.abrirModalEditar(e);
    expect(component.modalAbierto).toBeTrue();
    expect(component.editando).toBeTrue();
    expect(component.form.id).toBe(5);
    expect(component.form.nombre).toBe('Nino Prueba');
  });
});

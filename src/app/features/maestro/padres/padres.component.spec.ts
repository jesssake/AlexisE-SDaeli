import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PadresComponent } from './padres.component';
import { provideHttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PadresComponent', () => {
  let component: PadresComponent;
  let fixture: ComponentFixture<PadresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PadresComponent],
      providers: [provideHttpClient()],
      schemas: [NO_ERRORS_SCHEMA], // ignora <app-chat-panel> en pruebas
    }).compileComponents();

    fixture = TestBed.createComponent(PadresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('abrir y cerrar chat actualiza estado', () => {
    const fila = {
      alumno_id: 7,
      alumno_nombre: 'Juan Pérez',
      tutor_id: 12,
      tutor_nombre: 'Sr. Pérez',
      tutor_correo: 'tutor@correo.com',
    };

    component.abrirChatInline(fila as any);
    expect(component.chatAbierto()).toBeTrue();
    expect(component.selAlumnoId()).toBe(7);
    expect(component.selTutorId()).toBe(12);

    component.cerrarChatInline();
    expect(component.chatAbierto()).toBeFalse();
    expect(component.selAlumnoId()).toBeNull();
  });

  it('trackByAlumno usa el id del alumno', () => {
    const id = component.trackByAlumno(0, { alumno_id: 99 } as any);
    expect(id).toBe(99);
  });
});

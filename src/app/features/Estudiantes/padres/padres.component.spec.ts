import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PadresComponent } from './padres.component';
import { provideHttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PadresComponent (Alumno)', () => {
  let component: PadresComponent;
  let fixture: ComponentFixture<PadresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PadresComponent],
      providers: [provideHttpClient()],
      // Ignoramos <app-chat-panel> en las pruebas
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PadresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('abrir y cerrar chat actualiza estado', () => {
    // Simula que ya hay alumno y tutor
    component.alumnoId.set(5);
    component.tutorId.set(10);

    component.abrirChat();
    expect(component.chatAbierto()).toBeTrue();

    component.cerrarChat();
    expect(component.chatAbierto()).toBeFalse();
  });
});

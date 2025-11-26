import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionComponent } from './configuracion.component';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ConfiguracionComponent', () => {
  let component: ConfiguracionComponent;
  let fixture: ComponentFixture<ConfiguracionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionComponent, FormsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería alternar modo oscuro', () => {
    component.modoOscuro = false;
    component.activarModoOscuro();
    expect(component.modoOscuro).toBeTrue();
  });

  it('no debería guardar si todos los campos están vacíos', () => {
    component.nuevoCorreo = '';
    component.contrasenaActual = '';
    component.contrasenaNueva = '';
    component.guardarCambiosUsuario();
    expect(component.mensaje).toContain('Completa al menos un campo');
  });
});

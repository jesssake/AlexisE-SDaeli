import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraduacionComponent } from './graduacion.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CertificadoService } from '../../../services/certificado.service';

describe('GraduacionComponent', () => {
  let component: GraduacionComponent;
  let fixture: ComponentFixture<GraduacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraduacionComponent],
      imports: [HttpClientTestingModule],
      providers: [CertificadoService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraduacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load certificates', () => {
    component.cargarCertificados();
    expect(component.certificados.length).toBeGreaterThan(0);
  });
});

// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\reportes\reportes.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ReportesAlumnoComponent } from './reportes.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ReportesAlumnoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAlumnoComponent, HttpClientTestingModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportesAlumnoComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});

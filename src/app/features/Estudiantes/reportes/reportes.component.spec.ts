// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\reportes\reportes.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesAlumnoComponent } from './reportes.component';

describe('ReportesAlumnoComponent', () => {
  let component: ReportesAlumnoComponent;
  let fixture: ComponentFixture<ReportesAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAlumnoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesAlumnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

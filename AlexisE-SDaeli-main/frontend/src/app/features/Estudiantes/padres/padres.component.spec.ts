// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\padres\padres.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PadresEstudianteComponent } from './padres.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('PadresEstudianteComponent', () => {
  let component: PadresEstudianteComponent;
  let fixture: ComponentFixture<PadresEstudianteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PadresEstudianteComponent,
        HttpClientTestingModule,
        FormsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PadresEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
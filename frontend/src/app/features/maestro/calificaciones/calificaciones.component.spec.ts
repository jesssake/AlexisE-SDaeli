import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalificacionesComponent } from './calificaciones.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CalificacionesComponent', () => {
  let component: CalificacionesComponent;
  let fixture: ComponentFixture<CalificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalificacionesComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CalificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TareasComponent } from './tareas.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TareasComponent', () => {
  let fixture: ComponentFixture<TareasComponent>;
  let component: TareasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TareasComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el componente', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraduacionComponent } from './graduacion.component';

describe('GraduacionComponent', () => {
  let component: GraduacionComponent;
  let fixture: ComponentFixture<GraduacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduacionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GraduacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

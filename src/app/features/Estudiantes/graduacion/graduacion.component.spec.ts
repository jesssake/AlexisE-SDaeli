import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraduacionComponent } from './graduacion.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GraduacionComponent', () => {
  let component: GraduacionComponent;
  let fixture: ComponentFixture<GraduacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GraduacionComponent, HttpClientTestingModule],
    });

    fixture = TestBed.createComponent(GraduacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

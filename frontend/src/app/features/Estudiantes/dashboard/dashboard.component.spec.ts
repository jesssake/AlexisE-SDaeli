import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CommonModule } from '@angular/common';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial stats with correct values', () => {
    expect(component.stats.pendingTasks).toBe(2);
    expect(component.stats.attendance).toBe('Presente');
    expect(component.stats.upcomingTasks).toBe(2);
    expect(component.stats.averageGrade).toBe(9.1);
    expect(component.stats.attendancePercentage).toBe(99);
  });

  it('should have announcements', () => {
    expect(component.announcements.length).toBe(3);
    expect(component.announcements[0].content).toContain('Reunión de padres');
  });

  it('should display current date', () => {
    expect(component.currentDate).toBeTruthy();
  });

  it('should return correct attendance status', () => {
    expect(component.getAttendanceStatus()).toBe('present');
  });

  it('should return correct grade colors', () => {
    expect(component.getGradeColor(9.5)).toBe('excellent');
    expect(component.getGradeColor(8.0)).toBe('good');
    expect(component.getGradeColor(6.5)).toBe('needs-improvement');
  });

  it('should return correct announcement icons', () => {
    expect(component.getAnnouncementIcon('info')).toContain('info-circle');
    expect(component.getAnnouncementIcon('warning')).toContain('exclamation-triangle');
    expect(component.getAnnouncementIcon('urgent')).toContain('exclamation-circle');
  });

  it('should return correct announcement type texts', () => {
    expect(component.getAnnouncementTypeText('info')).toBe('Informativo');
    expect(component.getAnnouncementTypeText('warning')).toBe('Importante');
    expect(component.getAnnouncementTypeText('urgent')).toBe('Urgente');
  });
});
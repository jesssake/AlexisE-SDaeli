import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Announcement {
  date: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
}

interface DashboardStats {
  pendingTasks: number;
  attendance: string;
  upcomingTasks: number;
  averageGrade: number;
  attendancePercentage: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentDate: string;
  stats: DashboardStats;
  announcements: Announcement[];

  constructor() {
    this.currentDate = this.getCurrentDate();
    this.stats = {
      pendingTasks: 2,
      attendance: 'Presente',
      upcomingTasks: 2,
      averageGrade: 9.1,
      attendancePercentage: 99
    };
    this.announcements = [
      {
        date: '15 Oct 2025',
        content: 'Reunión de padres el 20 de octubre de 2025 en el auditorio principal.',
        type: 'info'
      },
      {
        date: '14 Oct 2025',
        content: 'Examen de Matemáticas el viernes 19 de octubre. Temas: Álgebra y Geometría.',
        type: 'warning'
      },
      {
        date: '13 Oct 2025',
        content: 'Recordatorio: Entregar proyecto de Ciencias antes del 25 de octubre.',
        type: 'urgent'
      }
    ];
  }

  ngOnInit(): void {}

  private getCurrentDate(): string {
    const date = new Date(2025, 9, 15);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getAttendanceStatus(): string {
    return this.stats.attendance === 'Presente' ? 'present' : 'absent';
  }

  getGradeColor(grade: number): string {
    if (grade >= 9) return 'excellent';
    if (grade >= 7) return 'good';
    return 'needs-improvement';
  }

  getAnnouncementIcon(type: string): string {
    switch (type) {
      case 'info': return 'fas fa-info-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'urgent': return 'fas fa-exclamation-circle';
      default: return 'fas fa-bullhorn';
    }
  }

  getAnnouncementTypeText(type: string): string {
    switch (type) {
      case 'info': return 'Informativo';
      case 'warning': return 'Importante';
      case 'urgent': return 'Urgente';
      default: return 'General';
    }
  }
}
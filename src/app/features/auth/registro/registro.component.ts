import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  step: Step = 1;
  loading = false;
  errors: Record<string, string> = {};
  isTransitioning = false;
  transitionMessage = '';

  showPass1 = false;
  showPass2 = false;
  confirmPassword = '';

  // 🔹 límites para el calendario (niños de 3 a 12 años)
  minBirthDate = ''; // niño más grande (12 años)
  maxBirthDate = ''; // niño más pequeño (3 años)

  // 5 preguntas; la primera contiene "mascota"
  recoveryQuestions: string[] = [
    '¿Nombre de tu primera mascota?',
    '¿Color favorito?',
    '¿Ciudad favorita?',
    '¿Deporte favorito?',
    '¿Comida favorita?',
  ];

  form: any = {
    tutorName: '',
    tutorEmail: '',
    tutorPhone: '',
    tutorPassword: '',
    childName: '',
    childCondition: '',
    childBirth: '',                 // YYYY-MM-DD desde el <input type="date">
    security: ['', '', '', '', ''], // 5 respuestas
  };

  constructor() {
    // Calcula rango de fechas permitido para el calendario
    const today = new Date();

    // Edad mínima 3 años (niño más pequeño)
    const max = new Date(
      today.getFullYear() - 3,
      today.getMonth(),
      today.getDate()
    );

    // Edad máxima 12 años (niño más grande)
    const min = new Date(
      today.getFullYear() - 12,
      today.getMonth(),
      today.getDate()
    );

    this.minBirthDate = this.formatDate(min);
    this.maxBirthDate = this.formatDate(max);
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ───── Paso 1 ─────
  nextFromStep1(): void {
    this.errors = {};

    if (!this.form.tutorPassword || this.form.tutorPassword.length < 6) {
      this.errors['tutorPassword'] =
        'La contraseña debe tener al menos 6 caracteres';
    }
    if (this.confirmPassword !== this.form.tutorPassword) {
      this.errors['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    if (Object.keys(this.errors).length) {
      this.showAlert('Corrige los errores de contraseña', 'error');
      return;
    }

    this.step = 2;
  }

  // ───── Paso 2 (calendario) ─────
  nextFromStep2(): void {
    this.errors = {};

    if (!this.form.childBirth) {
      this.errors['childBirth'] = 'Selecciona la fecha de nacimiento';
      this.showAlert('Selecciona la fecha de nacimiento', 'error');
      return;
    }

    const d = new Date(this.form.childBirth);
    if (isNaN(d.getTime())) {
      this.errors['childBirth'] = 'Fecha de nacimiento inválida';
      this.showAlert('Fecha de nacimiento inválida', 'error');
      return;
    }

    // Validar rango 3–12 años
    if (
      this.form.childBirth < this.minBirthDate ||
      this.form.childBirth > this.maxBirthDate
    ) {
      this.errors['childBirth'] = 'La edad debe estar entre 3 y 12 años';
      this.showAlert('La edad debe estar entre 3 y 12 años', 'error');
      return;
    }

    // Ya viene en formato YYYY-MM-DD desde el input date
    this.step = 3;
  }

  // ───── Paso 3 → 4 (resumen) ─────
  toSummary(): void {
    this.errors = {};

    this.form.security.forEach((v: string, i: number) => {
      if (!v || v.trim() === '') {
        this.errors['security' + i] = 'Ingresa tu respuesta';
      }
    });

    if (Object.keys(this.errors).length) return;
    this.step = 4;
  }

  async submit(): Promise<void> {
    await this.register();
  }

  back(): void {
    if ((this.step as number) > 1) {
      this.step = (((this.step as number) - 1) as Step);
    }
  }

  goToLogin(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionMessage = 'Volviendo al login...';

    setTimeout(
      () =>
        document
          .querySelector('.registro-container')
          ?.classList.add('fade-out'),
      100
    );

    setTimeout(() => {
      (window as any).location.href = '/auth/login';
    }, 600);
  }

  // ───── Llamada al backend ─────
  private async register(): Promise<void> {
    try {
      this.loading = true;

      const body = {
        tutor_nombre: this.form.tutorName,
        tutor_email: this.form.tutorEmail,
        tutor_telefono: this.form.tutorPhone,
        tutor_password: this.form.tutorPassword,      // opcional
        nino_nombre: this.form.childName,
        nino_condiciones: this.form.childCondition || null,
        fecha_nacimiento: this.form.childBirth,       // YYYY-MM-DD
      };

      // RUTA CORRECTA SEGÚN TU PHP
      const res = await fetch('/api/Registro/register_tutor_nino.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      const ct = res.headers.get('content-type') || '';
      const json = ct.includes('application/json')
        ? JSON.parse(raw)
        : { ok: false, error: raw };

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Error ${res.status} al registrar`);
      }

      // ✅ Registro OK → mensaje + redirección al login
      this.showAlert(
        'Registro completado exitosamente. Redirigiendo al inicio de sesión...',
        'success'
      );

      setTimeout(() => this.goToLogin(), 800);
    } catch (e: any) {
      this.showAlert(
        e?.message || 'Error al registrar. Intenta de nuevo.',
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

  private showAlert(
    msg: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}

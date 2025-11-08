import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'], // ← correcto (plural)
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

  birth = { day: '', month: '', year: '' };
  days   = Array.from({ length: 31 }, (_, i) => i + 1);
  months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Años: desde (actual - 12) a (actual - 3) → el spec lo valida así
  years: number[] = (() => {
    const y = new Date().getFullYear();
    const start = y - 12, end = y - 3;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  // 5 preguntas; la primera contiene "mascota" (coincide con el spec)
  recoveryQuestions: string[] = [
    '¿Nombre de tu primera mascota?',
    '¿Color favorito?',
    '¿Ciudad favorita?',
    '¿Deporte favorito?',
    '¿Comida favorita?'
  ];

  form: any = {
    tutorName: '',
    tutorEmail: '',
    tutorPhone: '',
    tutorPassword: '',
    childName: '',
    childCondition: '',
    childBirth: '',
    security: ['', '', '', '', ''] // 5 respuestas
  };

  nextFromStep1(): void {
    this.errors = {};
    if (!this.form.tutorPassword || this.form.tutorPassword.length < 6) {
      this.errors['tutorPassword'] = 'La contraseña debe tener al menos 6 caracteres';
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

  nextFromStep2(): void {
    if (!this.birth.day || !this.birth.month || !this.birth.year) {
      this.showAlert('Completa la fecha de nacimiento', 'error');
      return;
    }
    const dd = String(this.birth.day).padStart(2, '0');
    const mm = String(this.birth.month).padStart(2, '0');
    const yyyy = String(this.birth.year);
    this.form.childBirth = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
    this.step = 3;
  }

  toSummary(): void {
    this.errors = {};
    this.form.security.forEach((v: string, i: number) => {
      if (!v || v.trim() === '') this.errors['security'+i] = 'Ingresa tu respuesta';
    });
    if (Object.keys(this.errors).length) return;
    this.step = 4;
  }

  async submit(): Promise<void> {
    await this.register();
  }

  back(): void {
    if ((this.step as number) > 1) this.step = (((this.step as number) - 1) as Step);
  }

  goToLogin(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionMessage = 'Volviendo al login...';
    setTimeout(() => document.querySelector('.registro-container')?.classList.add('fade-out'), 100);
    setTimeout(() => { (window as any).location.href = '/auth/login'; }, 600);
  }

  // Llama al backend real con CLAVES PLANAS
  private async register(): Promise<void> {
    try {
      this.loading = true;

      const body = {
        tutor_nombre:   this.form.tutorName,
        tutor_email:    this.form.tutorEmail,
        tutor_telefono: this.form.tutorPhone,
        tutor_password: this.form.tutorPassword,   // opcional
        nino_nombre:    this.form.childName,
        fecha_nacimiento: this.form.childBirth,    // YYYY-MM-DD
        // Si luego quieres guardar seguridad, crea endpoint y mapea aquí.
      };

      const res = await fetch('/api/register_tutor_nino.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const raw = await res.text();
      const ct  = res.headers.get('content-type') || '';
      const json = ct.includes('application/json') ? JSON.parse(raw) : { ok: false, error: raw };

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Error ${res.status} al registrar`);
      }

      this.showAlert('Registro completado exitosamente', 'success');
      // this.goToLogin();
    } catch (e: any) {
      this.showAlert(e?.message || 'Error al registrar. Intenta de nuevo.', 'error');
    } finally {
      this.loading = false;
      this.isTransitioning = false;
    }
  }

  private showAlert(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}

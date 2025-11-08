import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent {
  private fb = inject(FormBuilder);

  // --------- Estado simulado ----------
  alumno = signal({
    nombre: 'Alexis Cantú',
    matricula: 'A0123456',
    grupo: '5°B',
    email: 'alexis@example.com',
    avatarUrl: ''
  });

  // --------- Formularios (no-nullable) ----------
  perfilForm = this.fb.nonNullable.group({
    nombre: [this.alumno().nombre, [Validators.required, Validators.maxLength(120)]],
    matricula: [this.alumno().matricula, [Validators.required, Validators.maxLength(20)]],
    grupo: [this.alumno().grupo, [Validators.required, Validators.maxLength(10)]],
  });

  cuentaForm = this.fb.nonNullable.group({
    email: [this.alumno().email, [Validators.required, Validators.email]],
    actual: ['', [Validators.minLength(6)]],
    nueva: ['', [Validators.minLength(6)]],
    repetir: ['', [Validators.minLength(6)]],
  });

  // --------- Avatar (preview local) ----------
  avatarPreview = signal<string | null>(this.alumno().avatarUrl || null);
  avatarFile = signal<File | null>(null);

  onSelectAvatar(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;
    this.avatarFile.set(file);
    const url = URL.createObjectURL(file);
    if (this.avatarPreview()) URL.revokeObjectURL(this.avatarPreview()!);
    this.avatarPreview.set(url);
    input.value = '';
  }

  quitarAvatar() {
    if (this.avatarPreview()) URL.revokeObjectURL(this.avatarPreview()!);
    this.avatarPreview.set(null);
    this.avatarFile.set(null);
  }

  // --------- Guardar (simulado) ----------
  guardado = signal(false);
  guardadoMsg = signal('');

  private flash(msg: string) {
    this.guardadoMsg.set(msg);
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 1800);
  }

  guardarPerfil() {
    if (this.perfilForm.invalid) { this.perfilForm.markAllAsTouched(); return; }
    const v = this.perfilForm.getRawValue();
    this.alumno.update(a => ({ ...a, ...v, avatarUrl: this.avatarPreview() ?? '' }));
    this.flash('Perfil actualizado');
  }

  guardarCuenta() {
    if (this.cuentaForm.invalid) { this.cuentaForm.markAllAsTouched(); return; }
    const { email, actual, nueva, repetir } = this.cuentaForm.getRawValue();

    if (nueva || repetir || actual) {
      if (!actual || !nueva || !repetir) { this.flash('Completa todos los campos de contraseña'); return; }
      if (nueva !== repetir) { this.flash('Las contraseñas no coinciden'); return; }
      // TODO: changePassword(actual, nueva)
    }
    // TODO: updateEmail(email)
    this.alumno.update(a => ({ ...a, email }));
    this.cuentaForm.patchValue({ actual: '', nueva: '', repetir: '' });
    this.flash('Datos de cuenta guardados');
  }

  // Informativo
  nombreCorto = computed(() => this.perfilForm.getRawValue().nombre.split(' ')[0] || 'Alumno');
}
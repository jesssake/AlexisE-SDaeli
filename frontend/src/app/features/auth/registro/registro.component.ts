// registro.component.ts - VERSIÓN CORREGIDA
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RegistroService } from '../../../core/registro.service';

// ==================== INTERFACES Y TIPOS ====================

type Step = 1 | 2 | 3 | 4;

interface RegistroForm {
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorPassword: string;
  childName: string;
  childCondition: string;
  childBirth: string;
  security: string[];
}

interface ValidationErrors {
  [key: string]: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent implements OnInit, OnDestroy {
  // ✅ INYECCIÓN DE DEPENDENCIAS
  private registroService = inject(RegistroService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ✅ ESTADO DEL COMPONENTE
  step: Step = 1;
  loading = false;
  errors: ValidationErrors = {};
  emailDisponible: boolean | null = null;
  validandoEmail = false;
  isTransitioning = false;
  transitionMessage = 'Cargando...';

  // ✅ ESTADO DE UI
  showPass1 = false;
  showPass2 = false;
  confirmPassword = '';

  // ✅ CONFIGURACIÓN
  minBirthDate = '';
  maxBirthDate = '';
  readonly recoveryQuestions: string[] = [
    '¿Nombre de tu primera mascota?',
    '¿Color favorito?',
    '¿Ciudad favorita?',
    '¿Deporte favorito?',
    '¿Comida favorita?',
  ];

  // ✅ FORMULARIO CON TIPADO FUERTE
  form: RegistroForm = {
    tutorName: '',
    tutorEmail: '',
    tutorPhone: '',
    tutorPassword: '',
    childName: '',
    childCondition: '',
    childBirth: '',
    security: ['', '', '', '', ''],
  };

  // ✅ CONSTRUCTOR E INICIALIZACIÓN
  constructor() {
    this.calcularFechasPermitidas();
  }

  ngOnInit(): void {
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== MÉTODOS DE INICIALIZACIÓN ====================

  private inicializarComponente(): void {
    console.log('🔄 Componente de registro inicializado');
  }

  private calcularFechasPermitidas(): void {
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

  // ==================== MÉTODOS DE NEGOCIO ====================

  calcularEdad(): number {
    if (!this.form.childBirth) return 0;
    
    const fechaNacimiento = new Date(this.form.childBirth);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    
    // Ajustar si aún no ha pasado el cumpleaños este año
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    const mesNac = fechaNacimiento.getMonth();
    const diaNac = fechaNacimiento.getDate();
    
    if (mes < mesNac || (mes === mesNac && dia < diaNac)) {
      edad--;
    }
    
    return Math.max(0, edad); // Asegurar que no sea negativo
  }

  async validarEmail(): Promise<void> {
    if (!this.form.tutorEmail || !this.validarFormatoEmail(this.form.tutorEmail)) {
      this.emailDisponible = null;
      return;
    }

    this.validandoEmail = true;
    try {
      const result = await firstValueFrom(
        this.registroService.validarEmailUnico(this.form.tutorEmail)
          .pipe(takeUntil(this.destroy$))
      );
      this.emailDisponible = result?.disponible ?? false;
    } catch (error) {
      this.emailDisponible = null;
      console.error('❌ Error validando email:', error);
      this.mostrarAlerta('Error al validar el email', 'error');
    } finally {
      this.validandoEmail = false;
    }
  }

  // ==================== NAVEGACIÓN ENTRE PASOS ====================

  nextFromStep1(): void {
    this.errors = {};

    const validaciones = [
      { campo: 'tutorName', cond: !this.form.tutorName?.trim(), mensaje: 'El nombre es obligatorio' },
      { campo: 'tutorEmail', cond: !this.form.tutorEmail?.trim() || !this.validarFormatoEmail(this.form.tutorEmail), mensaje: 'Email válido es obligatorio' },
      { campo: 'tutorPhone', cond: !this.form.tutorPhone?.trim(), mensaje: 'Teléfono es obligatorio' },
      { campo: 'tutorPassword', cond: !this.form.tutorPassword || this.form.tutorPassword.length < 6, mensaje: 'La contraseña debe tener al menos 6 caracteres' },
      { campo: 'confirmPassword', cond: this.confirmPassword !== this.form.tutorPassword, mensaje: 'Las contraseñas no coinciden' },
      { campo: 'tutorEmail', cond: this.emailDisponible === false, mensaje: 'Este email ya está registrado' }
    ];

    validaciones.forEach(({ campo, cond, mensaje }) => {
      if (cond) this.errors[campo] = mensaje;
    });

    if (Object.keys(this.errors).length > 0) {
      this.mostrarAlerta('Corrige los errores del formulario', 'error');
      return;
    }

    this.avanzarPaso(2);
  }

  nextFromStep2(): void {
    this.errors = {};

    const validaciones = [
      { campo: 'childName', cond: !this.form.childName?.trim(), mensaje: 'El nombre del niño es obligatorio' },
      { campo: 'childBirth', cond: !this.form.childBirth, mensaje: 'La fecha de nacimiento es obligatoria' }
    ];

    if (this.form.childBirth) {
      const edad = this.calcularEdad();
      if (edad < 3 || edad > 12) {
        this.errors['childBirth'] = 'La edad debe estar entre 3 y 12 años';
      }
    }

    validaciones.forEach(({ campo, cond, mensaje }) => {
      if (cond) this.errors[campo] = mensaje;
    });

    if (Object.keys(this.errors).length > 0) {
      this.mostrarAlerta('Completa los datos del niño correctamente', 'error');
      return;
    }

    this.avanzarPaso(3);
  }

  toSummary(): void {
    this.errors = {};

    this.form.security.forEach((respuesta: string, index: number) => {
      if (!respuesta?.trim()) {
        this.errors[`security${index}`] = 'Esta respuesta es obligatoria';
      }
    });

    if (Object.keys(this.errors).length > 0) {
      this.mostrarAlerta('Responde todas las preguntas de seguridad', 'error');
      return;
    }

    this.avanzarPaso(4);
  }

  back(): void {
    if (this.step > 1) {
      this.step = (this.step - 1) as Step;
    }
  }

  private avanzarPaso(nuevoPaso: Step): void {
    this.step = nuevoPaso;
    // Scroll suave al top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== ENVÍO DE FORMULARIO ====================

  async submit(): Promise<void> {
    if (this.loading) return;

    try {
      this.loading = true;

      const registroData = {
        tutor_nombre: this.form.tutorName.trim(),
        tutor_email: this.form.tutorEmail.trim(),
        tutor_telefono: this.form.tutorPhone.trim(),
        tutor_password: this.form.tutorPassword,
        nino_nombre: this.form.childName.trim(),
        nino_condiciones: this.form.childCondition?.trim() || '',
        fecha_nacimiento: this.form.childBirth,
        security_questions: this.form.security.map((s: string) => s.trim())
      };

      const resultado = await firstValueFrom(
        this.registroService.registrarTutorNino(registroData)
          .pipe(takeUntil(this.destroy$))
      );

      if (resultado?.success) {
        this.mostrarAlerta('✅ ¡Registro exitoso! Redirigiendo al login...', 'success');
        this.limpiarFormulario();
        setTimeout(() => this.irALogin(), 2000);
      } else {
        throw new Error(resultado?.message || 'Error desconocido en el registro');
      }

    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      this.mostrarAlerta(
        error.message || 'Error al completar el registro. Intenta nuevamente.',
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

  // ==================== NAVEGACIÓN Y UTILIDADES ====================

  irALogin(): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionMessage = 'Volviendo al login...';

    // Animación de salida
    setTimeout(() => {
      const container = document.querySelector('.registro-container');
      if (container) {
        container.classList.add('fade-out');
      }
    }, 100);

    // Navegación después de la animación
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 600);
  }

  goToLogin(): void {
    this.irALogin();
  }

  limpiarFormulario(): void {
    this.form = {
      tutorName: '',
      tutorEmail: '',
      tutorPhone: '',
      tutorPassword: '',
      childName: '',
      childCondition: '',
      childBirth: '',
      security: ['', '', '', '', ''],
    };
    this.confirmPassword = '';
    this.emailDisponible = null;
    this.step = 1;
    this.errors = {};
  }

  // ==================== VALIDACIONES ====================

  private validarFormatoEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validarTelefono(telefono: string): boolean {
    const regexTelefono = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return regexTelefono.test(telefono);
  }

  // ==================== MÉTODOS DE UI ====================

  trackByIndex(index: number): number {
    return index;
  }

  private mostrarAlerta(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} global-alert`;
    alerta.textContent = mensaje;
    alerta.setAttribute('role', 'alert');
    
    // Posicionar y estilizar
    Object.assign(alerta.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%) translateY(-20px)',
      padding: '12px 24px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      zIndex: '10000',
      maxWidth: '400px',
      textAlign: 'center',
      background: this.obtenerColorAlerta(tipo),
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease-in-out',
      opacity: '0'
    });
    
    document.body.appendChild(alerta);
    
    // Animación de entrada
    setTimeout(() => {
      alerta.style.opacity = '1';
      alerta.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
      if (document.body.contains(alerta)) {
        alerta.style.opacity = '0';
        alerta.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
          if (document.body.contains(alerta)) {
            document.body.removeChild(alerta);
          }
        }, 300);
      }
    }, 4000);
  }

  private obtenerColorAlerta(tipo: string): string {
    const colores = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    return colores[tipo as keyof typeof colores] || colores.info;
  }

  // ==================== MÉTODOS PARA SELECTORES (OPCIONALES) ====================

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: 10 },
      (_, i) => currentYear - 12 + i
    );
  }

  getMonths(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  getDays(): number[] {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, Usuario } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  model = { email: '', password: '' };
  loading = false;
  showPass = false;
  showMonkey = true;
  showSpeech = false;
  monkeyMessage = '';
  monkeyEyes: string = '🙉';
  isTransitioning = false;
  transitionMessage = 'Cargando...';
  errors: Record<string, string> = {};

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    try { document?.body?.classList?.add('login-page'); } catch {}

    // 🔹 Solo cargamos por si quieres mostrar algo, pero NO redirigimos
    this.auth.loadFromStorage();

    // ❌ QUITAMOS esto:
    // if (this.auth.isLoggedIn()) { ... navigate ... return; }

    setTimeout(() => this.showMonkeyMessage('¡Hola! Soy tu amigo mono 🐵'), 1000);
    setTimeout(() => document.querySelector<HTMLInputElement>('#email')?.focus(), 500);
  }

  async goToRegister(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionMessage = 'Preparando registro... 🎉';
    this.showMonkeyMessage('¡Nos vemos en el registro! 🐵➡️');
    this.monkeyEyes = '🙈';
    await this.delay(800);
    document.querySelector('.login-container')?.classList.add('fade-out');
    await this.delay(500);
    this.router.navigate(['/auth/registro']);
  }

  async submit(): Promise<void> {
    this.errors = {};

    if (!this.model.email) this.errors['email'] = 'Ingresa tu correo';
    else if (!this.emailOk(this.model.email)) this.errors['email'] = 'Correo no válido';

    if (!this.model.password) this.errors['password'] = 'Ingresa tu contraseña';
    else if (!this.passOk(this.model.password))
      this.errors['password'] = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número';

    if (Object.keys(this.errors).length) {
      this.showMonkeyMessage('¡Ups! Revisa los campos 😅');
      return;
    }

    this.loading = true;
    this.isTransitioning = true;
    this.transitionMessage = 'Verificando tus datos... 🔐';
    this.showMonkeyMessage('¡Verificando tus datos! ⏳');

    try {
      const resp = await firstValueFrom(
        this.auth.login(this.model.email.trim(), this.model.password)
      );

      if (!resp?.success || !resp.user) {
        this.errors['general'] = resp?.message || 'Credenciales incorrectas';
        this.showMonkeyMessage('¡Ups! Credenciales incorrectas 😢');
        this.isTransitioning = false;
        return;
      }

      const user: Usuario = resp.user;

      // Guardar ID y correo del usuario
      if (user.id) localStorage.setItem('id', String(user.id));
      if (user.email) localStorage.setItem('correo', user.email);

      // Guardar sesión en AuthService
      if (resp.token || user.token) {
        this.auth.setUser(user);
        this.auth.setToken(resp.token || (user.token as string));
      } else {
        this.auth.setUser(user);
        this.auth.setToken('dev-session');
      }

      this.showMonkeyMessage('¡Éxito! Redirigiendo... 🎉');
      this.transitionMessage = '¡Redirigiendo! 🚀';

      await this.delay(700);
      document.querySelector('.login-container')?.classList.add('fade-out');
      await this.delay(250);

      const rol = (user.rol || '').toUpperCase();
      const destino = ['ADMIN', 'COORDINADOR', 'MAESTRO', 'PROFESOR'].includes(rol)
        ? '/maestro/dashboard'
        : '/estudiante/dashboard';

      await this.router.navigateByUrl(destino, { replaceUrl: true }).catch(() => {});
    } catch (err) {
      console.error('login error:', err);
      this.errors['general'] = 'Error al iniciar sesión';
      this.showMonkeyMessage('¡Ups! Algo salió mal 😢');
      this.isTransitioning = false;
    } finally {
      this.loading = false;
    }
  }

  private delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
  private emailOk(v: string): boolean { return /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v); }
  private passOk(v: string): boolean { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v); }

  onEmailFocus(): void { this.monkeyEyes = '🙉'; this.showMonkeyMessage('¿Tu correo? ¡Qué emocionante! 📧'); }
  onEmailBlur(): void { this.hideMonkeyMessage(); }
  onPasswordFocus(): void { this.monkeyEyes = '🙈'; this.showMonkeyMessage('¡Shhh! No miro, prometo 🤫'); }
  onPasswordBlur(): void { this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙉'; this.hideMonkeyMessage(); }
  onPasswordInput(): void { this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈'; }

  showMonkeyMessage(message: string): void {
    this.monkeyMessage = message;
    this.showSpeech = true;
    setTimeout(() => this.hideMonkeyMessage(), 3000);
  }
  hideMonkeyMessage(): void { this.showSpeech = false; }

  togglePasswordVisibility(): void {
    this.showPass = !this.showPass;
    if (this.showPass) {
      this.showMonkeyMessage('¡Cuidado! Alguien podría estar mirando 👀');
      this.monkeyEyes = '🙉';
      setTimeout(() => { this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈'; }, 2000);
    } else {
      this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈';
    }
  }

  openRecovery(event: Event): void {
    event.preventDefault();
    this.showMonkeyMessage('¡Función de recuperación próximamente! 🔧');
  }

  ngOnDestroy(): void {
    try { document?.body?.classList?.remove('login-page','dark','dark-mode'); } catch {}
  }
}

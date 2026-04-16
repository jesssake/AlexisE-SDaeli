import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// 🔒 BLOQUEAR TODOS LOS console.* EN PRODUCCIÓN Y DESARROLLO
console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};
console.debug = () => {};

bootstrapApplication(AppComponent, appConfig)
  .catch(() => {});
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  // 🔒 FORZAR LOGS APAGADOS SIEMPRE
  private isLoggingEnabled = false;

  constructor() {}

  private noop(): void {}

  log(message?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.log(message, ...optionalParams);
    }
  }

  info(message?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.info(message, ...optionalParams);
    }
  }

  warn(message?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.warn(message, ...optionalParams);
    }
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.error(message, ...optionalParams);
    }
  }

  group(message?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.group(message, ...optionalParams);
    }
  }

  groupEnd(): void {
    if (this.isLoggingEnabled) {
      console.groupEnd();
    }
  }

  table(data?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.table(data, ...optionalParams);
    }
  }

  time(label?: string): void {
    if (this.isLoggingEnabled) {
      console.time(label);
    }
  }

  timeEnd(label?: string): void {
    if (this.isLoggingEnabled) {
      console.timeEnd(label);
    }
  }

  dir(item?: any, ...optionalParams: any[]): void {
    if (this.isLoggingEnabled) {
      console.dir(item, ...optionalParams);
    }
  }

  // 🔧 Solo tú puedes activarlo manualmente si quieres
  enableLogging(): void {
    this.isLoggingEnabled = true;
  }

  disableLogging(): void {
    this.isLoggingEnabled = false;
  }

  getLoggingStatus(): boolean {
    return this.isLoggingEnabled;
  }
}
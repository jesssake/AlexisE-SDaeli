import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (token) return true;
  return inject(Router).createUrlTree(['/auth/login']);
};

// En dev no bloqueamos /auth aunque haya token
export const canMatchAuth: CanMatchFn = () => true;

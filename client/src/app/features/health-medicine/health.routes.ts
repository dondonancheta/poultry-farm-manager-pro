import { Routes } from '@angular/router';
export const HEALTH_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./health.component').then(m => m.HealthComponent) },
];

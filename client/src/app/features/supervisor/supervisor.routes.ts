import { Routes } from '@angular/router';

export const SUPERVISOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./supervisor-home.component').then(m => m.SupervisorHomeComponent),
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./verify-entries.component').then(m => m.VerifyEntriesComponent),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./monitor-inventory.component').then(m => m.MonitorInventoryComponent),
  },
  {
    path: 'health',
    loadComponent: () =>
      import('../health-medicine/health.component').then(m => m.HealthComponent),
  },
];

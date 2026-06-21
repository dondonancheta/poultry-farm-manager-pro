import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./manager-dashboard.component').then(m => m.ManagerDashboardComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics.component').then(m => m.ManagerAnalyticsComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports.component').then(m => m.ManagerReportsComponent),
  },
  {
    path: 'profitability',
    loadComponent: () =>
      import('./profitability.component').then(m => m.ProfitabilityComponent),
  },
];

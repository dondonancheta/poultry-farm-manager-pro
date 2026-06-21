import { Routes } from '@angular/router';
export const SALES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./sales.component').then(m => m.SalesComponent) },
];

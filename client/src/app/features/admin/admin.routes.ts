import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./manage-users.component').then(m => m.ManageUsersComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./system-settings.component').then(m => m.SystemSettingsComponent),
  },
  {
    path: 'master-data',
    loadComponent: () =>
      import('./master-data.component').then(m => m.MasterDataComponent),
  },
];

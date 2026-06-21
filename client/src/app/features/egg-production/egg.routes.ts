import { Routes } from '@angular/router';

export const EGG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./egg-production.component').then(m => m.EggProductionComponent),
  },
  {
    path: 'collect',
    loadComponent: () =>
      import('../worker/egg-collection.component').then(m => m.EggCollectionComponent),
  },
  {
    path: 'damage',
    loadComponent: () =>
      import('../worker/damaged-eggs.component').then(m => m.DamagedEggsComponent),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./egg-inventory.component').then(m => m.EggInventoryComponent),
  },
];

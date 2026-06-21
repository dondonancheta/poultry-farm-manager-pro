import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  template: `
    <div class="p-lg flex flex-col items-center justify-center min-h-64 text-center gap-md">
      <span class="material-symbols-outlined text-5xl text-primary opacity-30"
            style="font-variation-settings:'FILL' 1">assessment</span>
      <h2 class="text-headline-lg font-bold text-primary" style="font-size:24px;line-height:32px">Reports</h2>
      <p class="text-on-surface-variant text-body-md">PDF & Excel report generation — Phase 4.</p>
    </div>
  `,
})
export class ReportsComponent {}

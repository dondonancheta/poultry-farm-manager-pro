import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- Sidebar -->
      <app-sidebar [isOpen]="sidebarOpen()" />

      <!-- Main -->
      <main
        class="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        [class.ml-64]="sidebarOpen()"
      >
        <app-topbar (menuToggle)="toggleSidebar()" />

        <div class="flex-1 overflow-y-auto">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
})
export class ShellComponent {
  private _sidebarOpen = signal(true);
  sidebarOpen          = this._sidebarOpen.asReadonly();

  toggleSidebar() {
    this._sidebarOpen.update(v => !v);
  }
}

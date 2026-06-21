import { Component, inject, signal, Input, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];  // which roles can see this item
}

const ALL_NAV: NavItem[] = [
  // Worker
  { label: 'My Tasks',          icon: 'task_alt',            route: '/worker-home',              roles: ['worker'] },
  { label: 'Collect Eggs',      icon: 'egg',                 route: '/eggs/collect',             roles: ['worker'] },
  { label: 'Report Damage',     icon: 'broken_image',        route: '/eggs/damage',              roles: ['worker'] },
  { label: 'Log Feed',          icon: 'grass',               route: '/feed/log',                 roles: ['worker'] },
  { label: 'Record Mortality',  icon: 'emergency',           route: '/mortality/log',            roles: ['worker'] },

  // Supervisor
  { label: 'Overview',          icon: 'manage_accounts',     route: '/supervisor-home',          roles: ['supervisor'] },
  { label: 'Verify Entries',    icon: 'task_alt',            route: '/supervisor-home/verify',   roles: ['supervisor'] },
  { label: 'Egg Production',    icon: 'egg',                 route: '/eggs',                     roles: ['supervisor'] },
  { label: 'Egg Inventory',     icon: 'inventory_2',         route: '/eggs/inventory',           roles: ['supervisor'] },
  { label: 'Feed & Stock',      icon: 'grass',               route: '/supervisor-home/inventory',roles: ['supervisor'] },
  { label: 'Health Records',    icon: 'vaccines',            route: '/supervisor-home/health',   roles: ['supervisor'] },

  // Manager
  { label: 'Dashboard',         icon: 'dashboard',           route: '/manager/dashboard',        roles: ['manager'] },
  { label: 'Egg Production',    icon: 'egg',                 route: '/eggs',                     roles: ['manager'] },
  { label: 'Egg Inventory',     icon: 'inventory_2',         route: '/eggs/inventory',           roles: ['manager'] },
  { label: 'Feed Management',   icon: 'grass',               route: '/feed',                     roles: ['manager'] },
  { label: 'Health & Medicine', icon: 'vaccines',            route: '/health',                   roles: ['manager'] },
  { label: 'Sales',             icon: 'point_of_sale',       route: '/sales',                    roles: ['manager'] },
  { label: 'Flock Management',  icon: 'groups',              route: '/flocks',                   roles: ['manager'] },
  { label: 'Analytics',         icon: 'leaderboard',         route: '/manager/analytics',        roles: ['manager'] },
  { label: 'Reports',           icon: 'assessment',          route: '/manager/reports',          roles: ['manager'] },
  { label: 'Profitability',     icon: 'trending_up',         route: '/manager/profitability',    roles: ['manager'] },
  { label: 'Notifications',     icon: 'notifications',       route: '/notifications',            roles: ['manager'] },

  // Admin — full access
  { label: 'Admin Panel',       icon: 'admin_panel_settings',route: '/admin-home',              roles: ['admin'] },
  { label: 'Farm Management',   icon: 'agriculture',         route: '/farm',                     roles: ['admin'] },
  { label: 'Dashboard',         icon: 'dashboard',           route: '/manager/dashboard',        roles: ['admin'] },
  { label: 'Egg Production',    icon: 'egg',                 route: '/eggs',                     roles: ['admin'] },
  { label: 'Egg Inventory',     icon: 'inventory_2',         route: '/eggs/inventory',           roles: ['admin'] },
  { label: 'Feed Management',   icon: 'grass',               route: '/feed',                     roles: ['admin'] },
  { label: 'Health & Medicine', icon: 'vaccines',            route: '/health',                   roles: ['admin'] },
  { label: 'Sales',             icon: 'point_of_sale',       route: '/sales',                    roles: ['admin'] },
  { label: 'Flock Management',  icon: 'groups',              route: '/flocks',                   roles: ['admin'] },
  { label: 'Analytics',         icon: 'leaderboard',         route: '/manager/analytics',        roles: ['admin'] },
  { label: 'Reports',           icon: 'assessment',          route: '/manager/reports',          roles: ['admin'] },
  { label: 'User Management',   icon: 'people',              route: '/admin/users',              roles: ['admin'] },
  { label: 'System Settings',   icon: 'settings',            route: '/admin/settings',           roles: ['admin'] },
  { label: 'Master Data',       icon: 'database',            route: '/admin/master-data',        roles: ['admin'] },
  { label: 'Notifications',     icon: 'notifications',       route: '/notifications',            roles: ['admin'] },
];

// Role display config
const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: string }> = {
  worker:     { label: 'Farm Worker',    color: 'bg-primary-fixed text-on-primary-fixed-variant',          icon: 'agriculture' },
  supervisor: { label: 'Supervisor',     color: 'bg-secondary-fixed text-on-secondary-fixed-variant',      icon: 'manage_accounts' },
  manager:    { label: 'Farm Manager',   color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',        icon: 'leaderboard' },
  admin:      { label: 'Administrator',  color: 'bg-primary-container text-on-primary-container',          icon: 'admin_panel_settings' },
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fixed left-0 top-0 h-screen w-64 bg-surface-container border-r border-outline-variant
             flex flex-col p-md gap-sm z-50 transition-transform duration-300"
      [class.-translate-x-full]="!open()"
    >
      <!-- Branding -->
      <div class="flex flex-col gap-xs mb-sm px-sm pt-xs">
        <span class="text-title-md font-black text-primary leading-tight">PoultryFarm Pro</span>
        <span class="text-label-md text-on-surface-variant uppercase tracking-widest">Enterprise ERP</span>
      </div>

      <!-- Role badge -->
      @if (roleConfig) {
        <div class="flex items-center gap-sm px-sm py-xs rounded-lg mb-sm" [class]="roleConfig.color">
          <span class="material-symbols-outlined text-[18px]"
                style="font-variation-settings: 'FILL' 1">{{ roleConfig.icon }}</span>
          <span class="text-label-md font-bold">{{ roleConfig.label }}</span>
        </div>
      }

      <!-- Nav items (role-filtered) -->
      <nav class="flex-1 flex flex-col gap-xs overflow-y-auto">
        @for (item of visibleNav(); track item.route + item.label) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary font-bold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-md px-md py-sm text-label-md
                   hover:bg-surface-container-high rounded-lg transition-all"
            #rla="routerLinkActive"
            [class.text-on-primary]="rla.isActive"
            [class.text-on-surface-variant]="!rla.isActive"
          >
            <span
              class="material-symbols-outlined"
              [class.text-on-primary]="rla.isActive"
              [style]="rla.isActive ? 'font-variation-settings: FILL 1' : 'font-variation-settings: FILL 0'"
            >{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Bottom links -->
      <div class="mt-auto flex flex-col gap-xs pt-md border-t border-outline-variant">
        <a routerLink="/help"
           class="flex items-center gap-md px-md py-sm text-label-md text-on-surface-variant
                  hover:bg-surface-container-high rounded-lg transition-all">
          <span class="material-symbols-outlined">help</span>
          Help & Support
        </a>
        <button
          (click)="logout()"
          class="flex items-center gap-md px-md py-sm text-label-md text-on-surface-variant
                 hover:bg-surface-container-high rounded-lg transition-all w-full"
        >
          <span class="material-symbols-outlined text-error">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() set isOpen(v: boolean) { this._open.set(v); }

  private auth  = inject(AuthService);
  private _open = signal(true);
  open          = this._open.asReadonly();

  visibleNav = computed(() => {
    const role = this.auth.role();
    if (!role) return [];
    return ALL_NAV.filter(item => item.roles.includes(role));
  });

  get roleConfig() {
    const role = this.auth.role();
    return role ? ROLE_CONFIG[role] : null;
  }

  logout(): void { this.auth.logout(); }
}

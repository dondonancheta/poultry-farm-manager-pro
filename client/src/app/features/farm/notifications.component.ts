import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService, AppNotification, AlertCategory } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="p-lg max-w-4xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Notification Center</h1>
      <p class="text-body-md text-on-surface-variant">
        {{ today }} · Logged in as <strong>{{ currentUser?.name }}</strong>
        <span class="ml-sm px-sm py-xs rounded-full text-[10px] font-bold uppercase"
              [class]="roleBadge(currentUser?.role)">{{ currentUser?.role }}</span>
      </p>
    </div>
    <div class="flex gap-sm">
      <button (click)="notifSvc.markAllRead()"
              class="flex items-center gap-xs border border-outline text-on-surface px-md py-sm
                     rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">done_all</span>
        Mark all read
      </button>
    </div>
  </div>

  <!-- Summary KPI strip -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
    @for (k of kpis(); track k.label) {
      <button (click)="activeLevel = k.key"
              class="border-2 rounded-2xl p-md text-center transition-all hover:shadow-md"
              [class]="activeLevel === k.key
                ? 'border-primary bg-primary-fixed'
                : 'bg-white border-outline-variant hover:border-outline'">
        <div class="font-bold" [class]="k.color" style="font-size:22px">{{ k.count }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ k.label }}</div>
      </button>
    }
  </div>

  <!-- Category filter bar -->
  <div class="bg-white border border-outline-variant rounded-xl p-sm flex flex-wrap gap-xs mb-lg shadow-sm overflow-x-auto">
    @for (cat of categoryTabs; track cat.key) {
      <button (click)="activeCategory = cat.key"
              class="flex items-center gap-xs px-md py-xs rounded-lg text-label-md font-bold transition-all flex-shrink-0"
              [class]="activeCategory === cat.key
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'">
        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">{{ cat.icon }}</span>
        {{ cat.label }}
        @if (cat.count > 0) {
          <span class="ml-xs px-xs rounded-full text-[10px]"
                [class]="activeCategory === cat.key ? 'bg-white/30 text-white' : 'bg-surface-container text-on-surface-variant'">
            {{ cat.count }}
          </span>
        }
      </button>
    }
  </div>

  <!-- Critical alerts banner (if any) -->
  @if (criticalAlerts().length > 0 && (activeLevel === 'all' || activeLevel === 'critical')) {
    <div class="bg-error-container border border-error rounded-2xl p-lg mb-lg">
      <div class="flex items-center gap-sm mb-md">
        <span class="material-symbols-outlined text-on-error-container text-[24px]"
              style="font-variation-settings:'FILL' 1">emergency</span>
        <h3 class="font-bold text-on-error-container" style="font-size:15px">
          {{ criticalAlerts().length }} Critical Alert(s) — Immediate Action Required
        </h3>
      </div>
      <div class="space-y-sm">
        @for (alert of criticalAlerts().slice(0,3); track alert.id) {
          <div class="bg-white/70 rounded-xl p-sm flex items-center gap-md">
            <span class="material-symbols-outlined text-error text-[18px]" style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-on-surface text-sm">{{ alert.title }}</p>
              <p class="text-xs text-on-surface-variant truncate">{{ alert.message }}</p>
            </div>
            @if (alert.route) {
              <a [routerLink]="alert.route" (click)="notifSvc.markRead(alert.id)"
                 class="flex-shrink-0 px-md py-xs bg-error text-on-error rounded-lg text-[11px] font-bold hover:opacity-80">
                Act Now →
              </a>
            }
          </div>
        }
      </div>
    </div>
  }

  <!-- Main notifications list -->
  <div class="space-y-sm">
    @for (alert of filtered(); track alert.id) {
      <div class="bg-white rounded-2xl shadow-sm transition-all hover:shadow-md border"
           [class]="alertBorderClass(alert)">
        <div class="p-md">
          <div class="flex items-start gap-md">
            <!-- Icon -->
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 [class]="iconBg(alert.level)">
              <span class="material-symbols-outlined text-[20px]" [class]="iconColor(alert.level)"
                    style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-sm">
                <p class="font-bold text-on-surface leading-snug" [class.opacity-60]="alert.read">
                  {{ alert.title }}
                </p>
                @if (!alert.read) {
                  <span class="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-xs"></span>
                }
              </div>
              <p class="text-sm text-on-surface-variant mt-xs leading-relaxed">{{ alert.message }}</p>

              <!-- Meta row -->
              <div class="flex items-center gap-sm mt-sm flex-wrap">
                <span class="text-xs text-on-surface-variant">{{ alert.time }}</span>
                @if (alert.batch) {
                  <span class="text-[10px] font-mono bg-primary-fixed text-on-primary-fixed-variant px-sm py-xs rounded font-bold">
                    {{ alert.batch }}
                  </span>
                }
                @if (alert.building) {
                  <span class="text-[10px] bg-surface-container text-on-surface-variant px-sm py-xs rounded">
                    {{ alert.building }}
                  </span>
                }
                <span class="text-[10px] font-bold uppercase px-sm py-xs rounded"
                      [class]="levelChip(alert.level)">{{ alert.level }}</span>
                <span class="text-[10px] bg-surface-container text-on-surface-variant px-sm py-xs rounded capitalize">
                  {{ alert.category }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-xs flex-shrink-0">
              @if (alert.route) {
                <a [routerLink]="alert.route" (click)="notifSvc.markRead(alert.id)"
                   class="px-md py-xs text-center rounded-lg text-[11px] font-bold transition-all"
                   [class]="alert.level === 'critical'
                     ? 'bg-error text-on-error hover:opacity-80'
                     : 'bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary'">
                  View →
                </a>
              }
              <button (click)="notifSvc.markRead(alert.id)"
                      class="px-md py-xs border border-outline text-on-surface-variant rounded-lg text-[11px] hover:bg-surface-container transition-all"
                      [class.opacity-40]="alert.read">
                {{ alert.read ? '✓ Read' : 'Mark read' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (filtered().length === 0) {
      <div class="bg-white border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl block mb-md opacity-30">notifications_none</span>
        <p class="font-bold text-on-surface text-sm">No notifications</p>
        <p class="text-xs mt-xs">Nothing matches the selected filters</p>
      </div>
    }
  </div>

  <!-- Role info footer -->
  <div class="mt-xl bg-surface-container rounded-2xl p-lg">
    <h3 class="font-bold text-on-surface mb-sm" style="font-size:14px">
      What triggers notifications for your role
    </h3>
    <div class="space-y-xs text-sm text-on-surface-variant">
      @for (row of roleNotifInfo(); track row) {
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-[14px] text-primary" style="font-variation-settings:'FILL' 1">check_circle</span>
          {{ row }}
        </div>
      }
    </div>
  </div>

</div>
  `,
})
export class NotificationsComponent {
  protected notifSvc = inject(NotificationService);
  private   auth     = inject(AuthService);

  today       = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  activeLevel    = 'all';
  activeCategory = 'all';

  get currentUser() { return this.auth.user(); }

  // Category tabs with live counts
  get categoryTabs() {
    const a = this.notifSvc.myAlerts();
    const count = (cat: string) => a.filter(x => x.category === cat && !x.read).length;
    return [
      { key:'all',        label:'All',         icon:'notifications',   count: a.filter(x=>!x.read).length },
      { key:'mortality',  label:'Mortality',   icon:'emergency',       count: count('mortality')  },
      { key:'feed',       label:'Feed',        icon:'grass',           count: count('feed')       },
      { key:'medicine',   label:'Medicine',    icon:'medication',      count: count('medicine')   },
      { key:'vaccination',label:'Vaccination', icon:'vaccines',        count: count('vaccination')},
      { key:'eggs',       label:'Eggs',        icon:'egg',             count: count('eggs')       },
      { key:'production', label:'Production',  icon:'task_alt',        count: count('production') },
      { key:'sales',      label:'Sales',       icon:'point_of_sale',   count: count('sales')      },
      { key:'system',     label:'System',      icon:'settings',        count: count('system')     },
    ];
  }

  kpis = computed(() => {
    const a = this.notifSvc.myAlerts();
    return [
      { key:'all',      label:'All',      count: a.length,                               color:'text-on-surface' },
      { key:'critical', label:'Critical', count: a.filter(x=>x.level==='critical').length, color:'text-error'   },
      { key:'warning',  label:'Warnings', count: a.filter(x=>x.level==='warning').length,  color:'text-secondary'},
      { key:'unread',   label:'Unread',   count: a.filter(x=>!x.read).length,              color:'text-primary'  },
      { key:'success',  label:'Success',  count: a.filter(x=>x.level==='success').length,  color:'text-primary'  },
    ];
  });

  criticalAlerts = computed(() =>
    this.notifSvc.myAlerts().filter(a => a.level === 'critical' && !a.read)
  );

  filtered = computed(() => {
    const alerts = this.notifSvc.myAlerts();
    return alerts.filter(a => {
      if (this.activeLevel !== 'all' && this.activeLevel !== 'unread' && a.level !== this.activeLevel) return false;
      if (this.activeLevel === 'unread' && a.read) return false;
      if (this.activeCategory !== 'all' && a.category !== this.activeCategory) return false;
      return true;
    });
  });

  roleNotifInfo(): string[] {
    const role = this.currentUser?.role ?? 'worker';
    const map: Record<string, string[]> = {
      worker: [
        'Withdrawal period alerts for your assigned batch',
        'Entry verification result (verified / flagged by supervisor)',
        'Daily collection target met notifications',
        'Damaged egg report confirmations',
      ],
      supervisor: [
        'All worker alerts above',
        'Pending entries awaiting verification',
        'Mortality spikes and FCR alerts',
        'Feed stock low / critical for all buildings',
        'Vaccination overdue alerts',
        'Medicine stock low alerts',
      ],
      manager: [
        'All supervisor alerts above',
        'FCR and profitability threshold alerts',
        'Monthly revenue milestones',
        'Analytics and production reports ready',
        'System-level alerts from admin',
      ],
      admin: [
        'All alerts across all roles',
        'System configuration changes',
        'User account events',
        'Database backup and storage alerts',
        'All farm operational alerts',
      ],
    };
    return map[role] ?? map['worker'];
  }

  alertBorderClass(alert: AppNotification): string {
    if (alert.read) return 'border-outline-variant opacity-75';
    return { critical:'border-error', warning:'border-secondary', info:'border-primary', success:'border-primary-fixed-dim' }[alert.level] ?? 'border-outline-variant';
  }

  iconBg(level: string): string {
    return { critical:'bg-error-container', warning:'bg-secondary-fixed', info:'bg-primary-fixed', success:'bg-primary-fixed' }[level] ?? 'bg-surface-container';
  }

  iconColor(level: string): string {
    return { critical:'text-on-error-container', warning:'text-on-secondary-fixed-variant', info:'text-on-primary-fixed-variant', success:'text-on-primary-fixed-variant' }[level] ?? 'text-on-surface-variant';
  }

  levelChip(level: string): string {
    return { critical:'bg-error text-on-error', warning:'bg-secondary-fixed text-on-secondary-fixed-variant', info:'bg-primary-fixed text-on-primary-fixed-variant', success:'bg-primary-fixed text-on-primary-fixed-variant' }[level] ?? 'bg-surface-container text-on-surface';
  }

  roleBadge(role?: string): string {
    return { admin:'bg-primary-container text-on-primary-container', manager:'bg-tertiary-fixed text-on-tertiary-fixed-variant', supervisor:'bg-secondary-fixed text-on-secondary-fixed-variant', worker:'bg-primary-fixed text-on-primary-fixed-variant' }[role ?? ''] ?? 'bg-surface-container text-on-surface';
  }
}

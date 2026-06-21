import { Component, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="sticky top-0 w-full bg-surface border-b border-outline-variant shadow-sm z-40
                   flex justify-between items-center px-lg py-sm">

      <!-- Left: hamburger -->
      <div class="flex items-center">
        <button (click)="menuToggle.emit()"
                class="p-sm hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant md:hidden">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <!-- Right: notifications + user -->
      <div class="flex items-center gap-md">


        <!-- Notification bell -->
        <div class="relative">
          <button (click)="toggleDropdown()"
                  class="relative p-sm hover:bg-surface-container-low rounded-full transition-all text-on-surface-variant"
                  aria-label="Notifications">
            <span class="material-symbols-outlined text-primary">notifications</span>
            @if (notifSvc.unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error text-on-error rounded-full
                           flex items-center justify-center text-[10px] font-bold leading-none px-xs">
                {{ notifSvc.unreadCount() > 9 ? '9+' : notifSvc.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notification dropdown -->
          @if (dropdownOpen()) {
            <!-- Backdrop -->
            <div class="fixed inset-0 z-40" (click)="dropdownOpen.set(false)"></div>

            <!-- Panel -->
            <div class="absolute right-0 top-full mt-sm w-96 bg-white border border-outline-variant
                        rounded-2xl shadow-2xl z-50 overflow-hidden max-h-screen-80"
                 style="max-height:80vh">

              <!-- Panel header -->
              <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
                <div>
                  <h3 class="font-bold text-on-surface" style="font-size:15px">Notifications</h3>
                  <p class="text-xs text-on-surface-variant mt-xs">
                    {{ notifSvc.unreadCount() }} unread · {{ notifSvc.myAlerts().length }} total
                  </p>
                </div>
                <div class="flex items-center gap-sm">
                  <button (click)="notifSvc.markAllRead(); $event.stopPropagation()"
                          class="text-[11px] text-primary font-bold hover:underline flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[14px]">done_all</span>All read
                  </button>
                  <a routerLink="/notifications" (click)="dropdownOpen.set(false)"
                     class="text-[11px] text-primary font-bold hover:underline flex items-center gap-xs">
                    View all
                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>

              <!-- Level filter tabs -->
              <div class="flex gap-xs px-md py-sm border-b border-outline-variant bg-surface-container-lowest overflow-x-auto">
                @for (tab of filterTabs; track tab.key) {
                  <button (click)="dropdownFilter.set(tab.key); $event.stopPropagation()"
                          class="px-sm py-xs rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0"
                          [class]="dropdownFilter() === tab.key
                            ? 'bg-primary text-on-primary'
                            : 'text-on-surface-variant hover:bg-surface-container'">
                    {{ tab.label }}
                    @if (tab.count > 0) {
                      <span class="ml-xs px-xs rounded-full text-[9px]"
                            [class]="dropdownFilter() === tab.key ? 'bg-white/30' : 'bg-surface-container-high'">
                        {{ tab.count }}
                      </span>
                    }
                  </button>
                }
              </div>

              <!-- Alert list -->
              <div class="overflow-y-auto" style="max-height:calc(80vh - 130px)">
                @for (alert of filteredDropdown(); track alert.id) {
                  <div class="flex items-start gap-sm px-md py-sm hover:bg-surface-container-lowest
                              transition-colors border-b border-outline-variant last:border-0 cursor-pointer"
                       [class]="!alert.read ? 'bg-white' : 'bg-surface-container-lowest/50'"
                       (click)="handleAlertClick(alert)">

                    <!-- Level icon -->
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-xs"
                         [class]="alertIconBg(alert.level)">
                      <span class="material-symbols-outlined text-[15px]" [class]="alertIconColor(alert.level)"
                            style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-xs">
                        <p class="text-sm font-bold text-on-surface leading-snug truncate">{{ alert.title }}</p>
                        @if (!alert.read) {
                          <span class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-xs"></span>
                        }
                      </div>
                      <p class="text-xs text-on-surface-variant mt-xs leading-relaxed line-clamp-2">{{ alert.message }}</p>
                      <div class="flex items-center gap-sm mt-xs">
                        <span class="text-[10px] text-on-surface-variant">{{ alert.time }}</span>
                        @if (alert.batch) {
                          <span class="text-[10px] font-mono text-primary bg-primary-fixed px-xs py-xs rounded">
                            {{ alert.batch }}
                          </span>
                        }
                        <span class="text-[10px] px-xs py-xs rounded font-bold uppercase"
                              [class]="levelChip(alert.level)">
                          {{ alert.level }}
                        </span>
                      </div>
                    </div>
                  </div>
                }

                @if (filteredDropdown().length === 0) {
                  <div class="p-xl text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-3xl block mb-sm opacity-30">notifications_none</span>
                    <p class="text-sm">No {{ dropdownFilter() !== 'all' ? dropdownFilter() : '' }} notifications</p>
                  </div>
                }
              </div>

              <!-- Footer -->
              <div class="px-lg py-md border-t border-outline-variant bg-surface-container-low">
                <a routerLink="/notifications" (click)="dropdownOpen.set(false)"
                   class="w-full py-xs bg-primary text-on-primary rounded-lg text-label-md font-bold
                          hover:opacity-90 transition-all text-center block">
                  Open Full Notification Center
                </a>
              </div>
            </div>
          }
        </div>

        <!-- User info + avatar -->
        <div class="flex items-center gap-sm pl-md border-l border-outline-variant">
          <div class="text-right hidden lg:block">
            <p class="text-sm font-semibold text-on-surface leading-none">{{ userName }}</p>
            <p class="text-xs text-on-surface-variant capitalize">{{ userRole }}</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-primary-container border border-outline-variant
                      flex items-center justify-center text-on-primary-container font-bold text-sm cursor-pointer
                      hover:ring-2 hover:ring-primary transition-all">
            {{ initials }}
          </div>
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  @Output() menuToggle        = new EventEmitter<void>();

  protected auth      = inject(AuthService);
  protected notifSvc  = inject(NotificationService);

  dropdownOpen   = signal(false);
  dropdownFilter = signal('all');

  get userName(): string { return this.auth.user()?.name ?? ''; }
  get userRole(): string { return this.auth.user()?.role ?? ''; }
  get initials(): string {
    return this.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleDropdown(): void { this.dropdownOpen.update(v => !v); }

  get filterTabs() {
    const alerts = this.notifSvc.myAlerts();
    return [
      { key:'all',      label:'All',      count: alerts.filter(a => !a.read).length },
      { key:'critical', label:'Critical', count: alerts.filter(a => a.level==='critical' && !a.read).length },
      { key:'warning',  label:'Warnings', count: alerts.filter(a => a.level==='warning'  && !a.read).length },
      { key:'info',     label:'Info',     count: 0 },
      { key:'success',  label:'Success',  count: 0 },
    ];
  }

  filteredDropdown = () => {
    const alerts = this.notifSvc.myAlerts();
    const f      = this.dropdownFilter();
    if (f === 'all') return alerts.slice(0, 20);
    return alerts.filter(a => a.level === f).slice(0, 20);
  };

  handleAlertClick(alert: any): void {
    this.notifSvc.markRead(alert.id);
    this.dropdownOpen.set(false);
  }

  alertIconBg(level: string): string {
    return { critical:'bg-error-container', warning:'bg-secondary-fixed', info:'bg-primary-fixed', success:'bg-primary-fixed' }[level] ?? 'bg-surface-container';
  }

  alertIconColor(level: string): string {
    return { critical:'text-on-error-container', warning:'text-on-secondary-fixed-variant', info:'text-on-primary-fixed-variant', success:'text-on-primary-fixed-variant' }[level] ?? 'text-on-surface-variant';
  }

  levelChip(level: string): string {
    return { critical:'bg-error text-on-error', warning:'bg-secondary-fixed text-on-secondary-fixed-variant', info:'bg-primary-fixed text-on-primary-fixed-variant', success:'bg-primary-fixed text-on-primary-fixed-variant' }[level] ?? 'bg-surface-container text-on-surface';
  }
}

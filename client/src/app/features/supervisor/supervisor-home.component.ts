import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { EggCollectionService } from '../../core/services/egg-collection.service';

interface PendingEntry {
  id: number;
  type: string;
  building: string;
  submittedBy: string;
  time: string;
  value: string;
  verified: boolean;
}

@Component({
  selector: 'app-supervisor-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-lg max-w-4xl mx-auto space-y-gutter pb-xl">

      <!-- Header ──────────────────────────────────────────────────────────── -->
      <div>
        <h1 class="font-bold text-primary" style="font-size:28px;line-height:36px">
          Supervisor Dashboard
        </h1>
        <p class="text-body-md text-on-surface-variant mt-xs">{{ today }} · Verify entries and monitor operations</p>
      </div>

      <!-- Alert banner ────────────────────────────────────────────────────── -->
      <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md
                  flex items-center gap-md">
        <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[28px]"
              style="font-variation-settings: 'FILL' 1">pending_actions</span>
        <div class="flex-1">
          <p class="font-bold text-on-secondary-fixed-variant">
            {{ unverifiedCount }} entries awaiting verification
          </p>
          <p class="text-xs text-on-secondary-fixed-variant opacity-80">Review and approve worker submissions below</p>
        </div>
      </div>

      <!-- Summary KPIs ────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        @for (kpi of kpis; track kpi.label) {
          <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
            <span class="material-symbols-outlined text-[24px] mb-xs block"
                  [class]="kpi.iconColor"
                  style="font-variation-settings: 'FILL' 1">{{ kpi.icon }}</span>
            <div class="font-bold text-primary" style="font-size:22px">{{ kpi.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wide">{{ kpi.label }}</div>
          </div>
        }
      </div>

      <!-- Pending verifications ───────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Production Entries — Verification Queue</h3>
          <span class="text-label-md bg-secondary-container text-on-secondary-container
                       px-md py-xs rounded-full">
            {{ unverifiedCount }} pending
          </span>
        </div>

        <div class="divide-y divide-outline-variant">
          @for (entry of pendingEntries(); track entry.id) {
            <div class="flex items-center gap-md px-lg py-md"
                 [class.opacity-50]="entry.verified">
              <!-- Type icon -->
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                   [class]="entryIconBg(entry.type)">
                <span class="material-symbols-outlined text-[18px]"
                      style="font-variation-settings: 'FILL' 1">{{ entryIcon(entry.type) }}</span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-on-surface text-body-md">{{ entry.type }} — {{ entry.building }}</p>
                <p class="text-xs text-on-surface-variant">
                  By {{ entry.submittedBy }} · {{ entry.time }}
                </p>
              </div>

              <!-- Value -->
              <div class="text-right mr-md">
                <p class="font-bold text-on-surface">{{ entry.value }}</p>
              </div>

              <!-- Actions -->
              @if (!entry.verified) {
                <div class="flex gap-sm flex-shrink-0">
                  <button
                    (click)="verify(entry)"
                    class="flex items-center gap-xs px-md py-xs bg-primary-fixed text-on-primary-fixed-variant
                           rounded-lg text-label-md hover:bg-primary hover:text-on-primary transition-all"
                  >
                    <span class="material-symbols-outlined text-[14px]"
                          style="font-variation-settings: 'FILL' 1">check_circle</span>
                    Verify
                  </button>
                  <button
                    (click)="flag(entry)"
                    class="flex items-center gap-xs px-md py-xs bg-error-container text-on-error-container
                           rounded-lg text-label-md hover:opacity-80 transition-all"
                  >
                    <span class="material-symbols-outlined text-[14px]">flag</span>
                    Flag
                  </button>
                </div>
              } @else {
                <span class="flex items-center gap-xs text-label-md text-primary px-md">
                  <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1">verified</span>
                  Verified
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Inventory overview ──────────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Inventory Monitor</h3>
        <div class="space-y-md">
          @for (item of inventoryItems; track item.label) {
            <div>
              <div class="flex justify-between text-body-md mb-xs">
                <span class="font-semibold text-on-surface">{{ item.label }}</span>
                <span [class]="item.pct < 30 ? 'text-error font-bold' : 'text-on-surface-variant'">
                  {{ item.current }} {{ item.unit }} left
                  @if (item.pct < 30) { <span class="ml-xs">⚠ Low</span> }
                </span>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     [class]="item.pct < 30 ? 'bg-error' : item.pct < 60 ? 'bg-secondary-container' : 'bg-primary'"
                     [style.width.%]="item.pct">
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Health records snapshot ─────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg">
        <div class="flex items-center justify-between mb-md">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Health Records — This Week</h3>
          <a routerLink="/supervisor-home/health" class="text-primary text-label-md hover:underline">View all</a>
        </div>
        <div class="grid grid-cols-3 gap-md text-center">
          @for (stat of healthStats; track stat.label) {
            <div class="p-md rounded-xl border border-outline-variant">
              <div class="font-bold text-[22px]" [class]="stat.color">{{ stat.value }}</div>
              <div class="text-label-md text-on-surface-variant mt-xs">{{ stat.label }}</div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class SupervisorHomeComponent implements OnInit {
  private dashSvc = inject(DashboardService);
  private eggSvc  = inject(EggCollectionService);
  kpiData      = signal<any>(null);
  pendingCount = signal(0);

  ngOnInit(): void {
    this.dashSvc.getKPIs().subscribe({
      next: (k: any) => {
        this.kpiData.set(k);
        // Update pending entries count from KPI
        if (k?.pending_verifications !== undefined) {
          this.pendingCount.set(k.pending_verifications ?? 0);
        }
      },
      error: () => {},
    });
    this.eggSvc.getAll({ per_page: 5, status: 'pending' }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? [];
        this.pendingCount.set(data.filter((e: any) => !e.verified).length);
      },
      error: () => {},
    });
  }

  get todayEggs(): string {
    const v = this.kpiData()?.today_eggs;
    return v != null ? v.toLocaleString() : '—';
  }
  get farmFcr(): string {
    return this.kpiData()?.farm_fcr?.toString() ?? '1.38';
  }

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  pendingEntries = signal<PendingEntry[]>([
    { id: 1, type: 'Egg Collection', building: 'Alpha-1', submittedBy: 'Juan dela Cruz',   time: '06:15 AM', value: '1,240 eggs',  verified: false },
    { id: 2, type: 'Feed Consumed',  building: 'Alpha-1', submittedBy: 'Juan dela Cruz',   time: '06:30 AM', value: '450 kg',      verified: false },
    { id: 3, type: 'Egg Collection', building: 'Beta-2',  submittedBy: 'Pedro Reyes',      time: '07:00 AM', value: '1,480 eggs',  verified: false },
    { id: 4, type: 'Mortality',      building: 'Gamma-3', submittedBy: 'Rosa Mendoza',     time: '07:15 AM', value: '3 birds',     verified: false },
    { id: 5, type: 'Feed Consumed',  building: 'Beta-2',  submittedBy: 'Pedro Reyes',      time: '07:20 AM', value: '380 kg',      verified: true  },
  ]);

  kpis = [
    { icon: 'task_alt',     iconColor: 'text-primary',   value: '3',    label: 'To Verify' },
    { icon: 'egg',          iconColor: 'text-primary',   value: '2,720', label: 'Eggs Today' },
    { icon: 'grass',        iconColor: 'text-secondary', value: '830kg', label: 'Feed Used' },
    { icon: 'emergency',    iconColor: 'text-error',     value: '3',    label: 'Mortality' },
  ];

  inventoryItems = [
    { label: 'Starter Feed (Type A)',  current: 4.2,  unit: 'tons', pct: 42 },
    { label: 'Grower Feed (Type B)',   current: 1.8,  unit: 'tons', pct: 18 },
    { label: 'Newcastle Vaccine',      current: 200,  unit: 'doses', pct: 67 },
    { label: 'Gumboro Vaccine',        current: 50,   unit: 'doses', pct: 25 },
  ];

  healthStats = [
    { label: 'Disease Incidents', value: '1',   color: 'text-error' },
    { label: 'Treatments Given',  value: '3',   color: 'text-secondary' },
    { label: 'Vaccination Due',   value: '2',   color: 'text-primary' },
  ];

  get unverifiedCount(): number {
    return this.pendingEntries().filter(e => !e.verified).length;
  }

  verify(entry: PendingEntry): void {
    this.pendingEntries.update(list =>
      list.map(e => e.id === entry.id ? { ...e, verified: true } : e)
    );
  }

  flag(entry: PendingEntry): void {
    alert(`Entry flagged for review: ${entry.type} — ${entry.building}`);
  }

  entryIcon(type: string): string {
    const map: Record<string, string> = {
      'Egg Collection': 'egg',
      'Feed Consumed':  'grass',
      'Mortality':      'emergency',
    };
    return map[type] ?? 'assignment';
  }

  entryIconBg(type: string): string {
    const map: Record<string, string> = {
      'Egg Collection': 'bg-primary-fixed text-on-primary-fixed-variant',
      'Feed Consumed':  'bg-secondary-fixed text-on-secondary-fixed-variant',
      'Mortality':      'bg-error-container text-on-error-container',
    };
    return map[type] ?? 'bg-surface-container text-on-surface';
  }
}

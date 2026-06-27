import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EggCollectionService } from '../../core/services/egg-collection.service';
import { AuthService } from '../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  color: string;
  textColor: string;
  count?: string;
  countLabel?: string;
  urgent?: boolean;
}

interface TodayLog {
  icon: string;
  label: string;
  value: string;
  unit: string;
  time: string;
  iconColor: string;
}

@Component({
  selector: 'app-worker-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-lg max-w-3xl mx-auto space-y-gutter pb-xl">

      <!-- Greeting ─────────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-bold text-primary" style="font-size:28px;line-height:36px">
            Good morning, Juan 👋
          </h1>
          <p class="text-body-md text-on-surface-variant mt-xs">
            {{ today }} · House Alpha-1 & Beta-2
          </p>
        </div>
        <div class="text-right">
          <div class="text-label-md text-on-surface-variant uppercase">Shift</div>
          <div class="font-bold text-primary text-body-lg">Morning</div>
        </div>
      </div>

      <!-- Pending tasks banner ────────────────────────────────────────────── -->
      @if (pendingCount > 0) {
        <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md
                    flex items-center gap-md">
          <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[28px]"
                style="font-variation-settings: 'FILL' 1">pending_actions</span>
          <div class="flex-1">
            <p class="font-bold text-on-secondary-fixed-variant text-body-md">
              {{ pendingCount }} tasks pending for today
            </p>
            <p class="text-xs text-on-secondary-fixed-variant opacity-80">
              Complete all entries before end of shift
            </p>
          </div>
        </div>
      }

      <!-- Quick action cards ──────────────────────────────────────────────── -->
      <div>
        <p class="text-label-md text-on-surface-variant uppercase tracking-widest mb-md">
          Today's tasks
        </p>
        <div class="grid grid-cols-2 gap-md">
          @for (action of quickActions; track action.label) {
            <a
              [routerLink]="action.route"
              class="relative flex flex-col gap-sm p-lg rounded-2xl border-2 transition-all
                     hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] cursor-pointer"
              [class]="action.color + ' border-transparent'"
            >
              @if (action.urgent) {
                <span class="absolute top-sm right-sm w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
              }
              <span class="material-symbols-outlined text-[32px]"
                    [class]="action.textColor"
                    style="font-variation-settings: 'FILL' 1">{{ action.icon }}</span>
              <div>
                <p class="font-bold text-on-surface" style="font-size:15px">{{ action.label }}</p>
                @if (action.count) {
                  <p class="text-xs text-on-surface-variant mt-xs">
                    <strong class="text-on-surface">{{ action.count }}</strong> {{ action.countLabel }}
                  </p>
                }
              </div>
            </a>
          }
        </div>
      </div>

      <!-- Today's log summary ─────────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg">
        <div class="flex items-center justify-between mb-md">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Today's Entries</h3>
          <span class="text-label-md text-on-surface-variant">{{ today }}</span>
        </div>

        <div class="space-y-sm">
          @for (log of todayLogs; track log.label) {
            <div class="flex items-center gap-md py-sm border-b border-outline-variant last:border-0">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   [class]="log.iconColor">
                <span class="material-symbols-outlined text-[18px]"
                      style="font-variation-settings: 'FILL' 1">{{ log.icon }}</span>
              </div>
              <div class="flex-1">
                <p class="text-body-md font-semibold text-on-surface">{{ log.label }}</p>
                <p class="text-xs text-on-surface-variant">Logged at {{ log.time }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-on-surface text-body-md">{{ log.value }}</p>
                <p class="text-xs text-on-surface-variant">{{ log.unit }}</p>
              </div>
            </div>
          } @empty {
            <div class="text-center py-lg text-on-surface-variant text-body-md">
              <span class="material-symbols-outlined text-3xl block mb-sm opacity-30">assignment</span>
              No entries yet today. Start recording!
            </div>
          }
        </div>
      </div>

      <!-- Quick egg collection form ─────────────────────────────────────── -->
      <div class="bg-primary-container rounded-2xl p-lg">
        <div class="flex items-center gap-sm mb-md">
          <span class="material-symbols-outlined text-white text-[22px]"
                style="font-variation-settings: 'FILL' 1">egg</span>
          <h3 class="font-bold text-on-primary-container" style="font-size:16px">
            Quick Egg Collection Entry
          </h3>
        </div>

        <div class="grid grid-cols-2 gap-sm mb-md">
          <div>
            <label class="text-[11px] font-bold text-white block mb-xs uppercase">
              Building
            </label>
            <select [(ngModel)]="eggForm.building"
                    class="w-full bg-white/20 border border-white/30 rounded-lg px-sm py-xs
                           text-white text-body-md focus:outline-none focus:ring-2
                           focus:ring-white/40">
              <option value="Alpha-1">Alpha-1</option>
              <option value="Beta-2">Beta-2</option>
              <option value="Gamma-3">Gamma-3</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] font-bold text-white block mb-xs uppercase">
              Total Collected
            </label>
            <input type="number" [(ngModel)]="eggForm.total" placeholder="0"
                   class="w-full bg-white/20 border border-white/30 rounded-lg px-sm py-xs
                          text-white text-body-md focus:outline-none focus:ring-2
                          focus:ring-white/40 placeholder-white/40"/>
          </div>
          <div>
            <label class="text-[11px] font-bold text-white block mb-xs uppercase">
              Cracked / Damaged
            </label>
            <input type="number" [(ngModel)]="eggForm.cracked" placeholder="0"
                   class="w-full bg-white/20 border border-white/30 rounded-lg px-sm py-xs
                          text-white text-body-md focus:outline-none focus:ring-2
                          focus:ring-white/40 placeholder-white/40"/>
          </div>
          <div>
            <label class="text-[11px] font-bold text-white block mb-xs uppercase">
              Spoiled / Rejected
            </label>
            <input type="number" [(ngModel)]="eggForm.spoiled" placeholder="0"
                   class="w-full bg-white/20 border border-white/30 rounded-lg px-sm py-xs
                          text-white text-body-md focus:outline-none focus:ring-2
                          focus:ring-white/40 placeholder-white/40"/>
          </div>
        </div>

        <button
          (click)="submitEggEntry()"
          class="w-full bg-primary text-on-primary py-sm rounded-lg font-bold text-body-md
                 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
        >
          <span class="material-symbols-outlined text-[18px]">save</span>
          Save Collection Entry
        </button>

        @if (eggSaved()) {
          <p class="text-center text-xs text-on-primary-container mt-sm opacity-80 flex items-center justify-center gap-xs">
            <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1">check_circle</span>
            Saved successfully!
          </p>
        }
      </div>

    </div>
  `,
})
export class WorkerHomeComponent implements OnInit {
  private eggSvc = inject(EggCollectionService);
  private auth   = inject(AuthService);
  todaySubmitted  = signal(false);
  todayEggCount   = signal(0);
  loading         = signal(false);

  get workerName(): string { return this.auth.user()?.name ?? 'Worker'; }

  ngOnInit(): void {
    this.loading.set(true);
    const today = new Date().toISOString().split('T')[0];
    this.eggSvc.getAll({ date: today, page: 1 }).subscribe({
      next: (res: any) => {
        const records = res?.data ?? [];
        this.todaySubmitted.set(records.length > 0);
        this.todayEggCount.set(
          records.reduce((s: number, r: any) => {
            const sizes = r.sizes ?? {};
            return s + Object.values(sizes).reduce((a: number, v: any) => a + (Number(v) || 0), 0);
          }, 0)
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  pendingCount = 2;
  eggSaved = signal(false);

  eggForm = { building: 'Alpha-1', total: null as number | null, cracked: null as number | null, spoiled: null as number | null };

  quickActions: QuickAction[] = [
    { icon: 'egg',           label: 'Record Egg Collection',  route: '/eggs/collect',     color: 'bg-primary-fixed',   textColor: 'text-on-primary-fixed-variant', count: '2',  countLabel: 'buildings pending', urgent: true },
    { icon: 'broken_image',  label: 'Report Damaged Eggs',    route: '/eggs/damage',      color: 'bg-error-container', textColor: 'text-on-error-container',        count: '0',  countLabel: 'reported today' },
    { icon: 'grass',         label: 'Log Feed Consumption',   route: '/feed/log',         color: 'bg-secondary-fixed', textColor: 'text-on-secondary-fixed-variant',count: '1',  countLabel: 'building pending', urgent: true },
    { icon: 'emergency',     label: 'Record Mortality',       route: '/mortality/log',    color: 'bg-surface-container-highest', textColor: 'text-on-surface',       count: '0',  countLabel: 'logged today' },
  ];

  todayLogs: TodayLog[] = [
    { icon: 'egg',   label: 'Egg Collection — Alpha-1',  value: '1,240', unit: 'eggs',  time: '06:15 AM', iconColor: 'bg-primary-fixed text-on-primary-fixed-variant' },
    { icon: 'grass', label: 'Feed Issued — Alpha-1',     value: '450',   unit: 'kg',    time: '06:30 AM', iconColor: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  ];

  submitEggEntry(): void {
    if (!this.eggForm.total) return;
    this.eggSaved.set(true);
    this.todayLogs.push({
      icon: 'egg',
      label: `Egg Collection — ${this.eggForm.building}`,
      value: this.eggForm.total.toLocaleString(),
      unit: 'eggs',
      time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      iconColor: 'bg-primary-fixed text-on-primary-fixed-variant',
    });
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    this.eggForm = { building: 'Alpha-1', total: null, cracked: null, spoiled: null };
    setTimeout(() => this.eggSaved.set(false), 3000);
  }
}

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
}

interface ProductionDay {
  day: string;
  eggs: number;
  target: number;
}

interface HousePerf {
  name: string;
  batch: string;
  fcr: number;
  mortalityPct: number;
  eggCount: number;
  status: 'good' | 'warning' | 'critical';
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-lg max-w-6xl mx-auto space-y-gutter pb-xl">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-bold text-primary" style="font-size:28px;line-height:36px">
            Farm Dashboard
          </h1>
          <p class="text-body-md text-on-surface-variant mt-xs">{{ today }} · Real-time operational overview</p>
        </div>
        <div class="flex gap-sm">
          <a routerLink="/manager/reports"
             class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm
                    rounded-lg text-label-md hover:bg-surface-container transition-all">
            <span class="material-symbols-outlined text-[18px]">download</span>
            Export
          </a>
          <a routerLink="/manager/analytics"
             class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm
                    rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
            <span class="material-symbols-outlined text-[18px]">leaderboard</span>
            Analytics
          </a>
        </div>
      </div>

      <!-- Top KPI strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        @for (kpi of kpiCards; track kpi.label) {
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm
                      hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-md">
              <span class="material-symbols-outlined p-sm rounded-xl text-[22px]"
                    [class]="kpi.iconBg + ' ' + kpi.iconColor"
                    style="font-variation-settings:'FILL' 1">{{ kpi.icon }}</span>
              <span class="text-xs font-bold flex items-center gap-xs"
                    [class]="kpi.trendUp ? 'text-primary' : 'text-error'">
                <span class="material-symbols-outlined text-[14px]">
                  {{ kpi.trendUp ? 'trending_up' : 'trending_down' }}
                </span>
                {{ kpi.trend }}
              </span>
            </div>
            <div class="font-bold text-primary" style="font-size:26px;line-height:32px">{{ kpi.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wider mt-xs">{{ kpi.label }}</div>
            <div class="text-xs text-on-surface-variant mt-xs">{{ kpi.sub }}</div>
          </div>
        }
      </div>

      <!-- Mid row: Production chart + House performance -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-gutter">

        <!-- Production trend (3/5) -->
        <div class="lg:col-span-3 bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <div class="flex items-center justify-between mb-lg">
            <div>
              <h3 class="font-bold text-on-surface" style="font-size:16px">Weekly Egg Production</h3>
              <p class="text-xs text-on-surface-variant mt-xs">vs. 8,500 daily target</p>
            </div>
            <div class="flex gap-xs">
              @for (r of ranges; track r) {
                <button (click)="activeRange = r"
                        class="px-sm py-xs rounded-lg text-label-md transition-all"
                        [class]="activeRange === r
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
                  {{ r }}
                </button>
              }
            </div>
          </div>

          <!-- SVG bar chart -->
          <div class="relative h-48">
            <svg class="w-full h-full" viewBox="0 0 560 160" preserveAspectRatio="none">
              <!-- Grid lines -->
              @for (y of [0,40,80,120,160]; track y) {
                <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="560"
                      stroke="currentColor" stroke-width="0.5" class="text-outline-variant" opacity="0.4"/>
              }
              <!-- Target line -->
              <line x1="0" y1="64" x2="560" y2="64"
                    stroke="#fe932c" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>
              <!-- Bars -->
              @for (d of productionData; track d.day; let i = $index) {
                <g>
                  <!-- Target bar (background) -->
                  <rect [attr.x]="i * 80 + 8" y="32" width="64" [attr.height]="128"
                        fill="currentColor" class="text-surface-container-low" rx="4"/>
                  <!-- Actual bar -->
                  <rect [attr.x]="i * 80 + 8" [attr.y]="160 - barH(d.eggs)"
                        width="64" [attr.height]="barH(d.eggs)"
                        [attr.fill]="d.eggs >= d.target ? '#3f6653' : '#fe932c'"
                        rx="4" opacity="0.85"/>
                </g>
              }
            </svg>
            <!-- Day labels -->
            <div class="absolute bottom-0 left-0 right-0 flex justify-around">
              @for (d of productionData; track d.day) {
                <div class="text-center">
                  <div class="text-[10px] text-on-surface-variant font-bold">{{ d.day }}</div>
                  <div class="text-[10px] font-bold mt-xs"
                       [class]="d.eggs >= d.target ? 'text-primary' : 'text-secondary'">
                    {{ (d.eggs / 1000).toFixed(1) }}k
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="flex items-center gap-lg mt-md pt-md border-t border-outline-variant">
            <div class="flex items-center gap-xs">
              <span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>
              <span class="text-xs text-on-surface-variant">Met target</span>
            </div>
            <div class="flex items-center gap-xs">
              <span class="w-3 h-3 rounded-sm bg-secondary-container inline-block"></span>
              <span class="text-xs text-on-surface-variant">Below target</span>
            </div>
            <div class="flex items-center gap-xs ml-auto">
              <span class="w-6 h-px bg-secondary inline-block" style="border-top:1px dashed"></span>
              <span class="text-xs text-on-surface-variant">8,500 target/day</span>
            </div>
          </div>
        </div>

        <!-- House performance (2/5) -->
        <div class="lg:col-span-2 bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">House Performance</h3>
          <div class="space-y-sm">
            @for (h of housePerf; track h.name) {
              <div class="p-md rounded-xl border transition-all"
                   [class]="h.status === 'critical' ? 'border-error bg-error-container/20'
                           : h.status === 'warning'  ? 'border-secondary bg-secondary-fixed/20'
                           : 'border-outline-variant bg-surface-container-lowest'">
                <div class="flex items-center justify-between mb-sm">
                  <div>
                    <p class="font-bold text-on-surface text-sm">{{ h.name }}</p>
                    <p class="text-[10px] text-on-surface-variant">{{ h.batch }}</p>
                  </div>
                  <span class="w-2 h-2 rounded-full flex-shrink-0"
                        [class]="h.status === 'critical' ? 'bg-error' : h.status === 'warning' ? 'bg-secondary-container' : 'bg-primary'">
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-xs text-center">
                  <div>
                    <div class="text-sm font-bold" [class]="h.fcr > 1.6 ? 'text-error' : h.fcr > 1.4 ? 'text-secondary' : 'text-primary'">{{ h.fcr }}</div>
                    <div class="text-[9px] text-on-surface-variant uppercase">FCR</div>
                  </div>
                  <div>
                    <div class="text-sm font-bold" [class]="h.mortalityPct > 2 ? 'text-error' : 'text-on-surface'">{{ h.mortalityPct }}%</div>
                    <div class="text-[9px] text-on-surface-variant uppercase">Mortality</div>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-primary">{{ (h.eggCount / 1000).toFixed(1) }}k</div>
                    <div class="text-[9px] text-on-surface-variant uppercase">Eggs</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom row: alerts + activity + profitability -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

        <!-- Alerts -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Active Alerts</h3>
          <div class="space-y-sm">
            @for (alert of alerts; track alert.id) {
              <div class="flex items-start gap-sm p-sm rounded-xl border"
                   [class]="alert.level === 'high' ? 'border-error bg-error-container/30'
                           : alert.level === 'med'  ? 'border-secondary bg-secondary-fixed/30'
                           : 'border-outline-variant bg-surface-container'">
                <span class="material-symbols-outlined text-[18px] flex-shrink-0 mt-xs"
                      [class]="alert.level === 'high' ? 'text-error' : alert.level === 'med' ? 'text-secondary' : 'text-on-surface-variant'"
                      style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
                <div>
                  <p class="font-bold text-on-surface text-sm">{{ alert.title }}</p>
                  <p class="text-xs text-on-surface-variant">{{ alert.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent activity -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <div class="flex items-center justify-between mb-md">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Today's Activity</h3>
            <span class="text-label-md text-on-surface-variant">{{ activityItems.length }} events</span>
          </div>
          <div class="space-y-sm">
            @for (act of activityItems; track act.id) {
              <div class="flex items-start gap-sm py-sm border-b border-outline-variant last:border-0">
                <span class="material-symbols-outlined text-[16px] text-on-surface-variant flex-shrink-0 mt-xs"
                      style="font-variation-settings:'FILL' 1">{{ act.icon }}</span>
                <div class="flex-1">
                  <p class="text-sm text-on-surface font-semibold">{{ act.text }}</p>
                  <p class="text-xs text-on-surface-variant">{{ act.time }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Profitability mini -->
        <div class="bg-primary rounded-2xl p-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div class="relative z-10">
            <h3 class="font-bold text-on-primary mb-xs" style="font-size:16px">Profitability MTD</h3>
            <p class="text-xs text-on-primary opacity-70 mb-lg">Month-to-date performance</p>
            <div class="space-y-md">
              @for (row of profitRows; track row.label) {
                <div class="flex justify-between items-center">
                  <span class="text-sm text-on-primary opacity-80">{{ row.label }}</span>
                  <span class="font-bold text-on-primary">{{ row.value }}</span>
                </div>
              }
              <div class="border-t border-on-primary/20 pt-md flex justify-between items-center">
                <span class="font-bold text-on-primary">Net Profit</span>
                <span class="font-bold text-on-primary text-[20px]">₱93,375</span>
              </div>
            </div>
          </div>
          <a routerLink="/manager/profitability"
             class="mt-lg bg-white/15 hover:bg-white/25 text-on-primary py-sm rounded-xl
                    text-label-md font-bold text-center transition-all relative z-10 block">
            View Full Report →
          </a>
          <div class="absolute -bottom-8 -right-8 w-40 h-40 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

    </div>
  `,
})
export class ManagerDashboardComponent implements OnInit {
  private dashSvc    = inject(DashboardService);
  liveKpis    = signal<any>(null);
  liveActivity = signal<any[]>([]);
  loading      = signal(true);

  ngOnInit(): void {
    this.dashSvc.getKPIs().subscribe({
      next: (k: any) => {
        this.liveKpis.set(k);
        if (k?.today_eggs)    this.kpiCards[0].value = k.today_eggs.toLocaleString();
        if (k?.farm_fcr)      this.kpiCards[1].value = k.farm_fcr.toString();
        if (k?.active_flocks) this.kpiCards[2].value = k.active_flocks.toString();
        if (k?.month_revenue) this.kpiCards[3].value = '₱' + (k.month_revenue/1000).toFixed(0) + 'k';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.dashSvc.getActivity().subscribe({
      next: (acts: any) => { if (acts?.length) this.liveActivity.set(acts); },
      error: () => {},
    });
  }

  today      = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  activeRange = '7D';
  ranges      = ['7D', '30D', '90D'];

  kpiCards: KpiCard[] = [
    { label: 'Eggs Today',      value: '12,720', sub: 'Across 5 active houses', icon: 'egg',         iconBg: 'bg-primary-fixed',   iconColor: 'text-on-primary-fixed-variant', trend: '+4.2%',  trendUp: true  },
    { label: 'Avg FCR',         value: '1.38',   sub: 'Target: ≤ 1.45',        icon: 'grain',        iconBg: 'bg-secondary-fixed', iconColor: 'text-on-secondary-fixed-variant', trend: '−0.04', trendUp: true  },
    { label: 'Mortality Rate',  value: '0.8%',   sub: 'Normal: < 1%',          icon: 'monitoring',   iconBg: 'bg-primary-fixed',   iconColor: 'text-on-primary-fixed-variant', trend: '−0.2%',  trendUp: true  },
    { label: 'Feed Remaining',  value: '13.8t',  sub: '~4 days of supply',     icon: 'inventory_2',  iconBg: 'bg-tertiary-fixed',  iconColor: 'text-on-tertiary-fixed-variant', trend: 'Reorder', trendUp: false },
  ];

  productionData: ProductionDay[] = [
    { day: 'Mon', eggs: 8800, target: 8500 },
    { day: 'Tue', eggs: 8350, target: 8500 },
    { day: 'Wed', eggs: 9100, target: 8500 },
    { day: 'Thu', eggs: 8720, target: 8500 },
    { day: 'Fri', eggs: 8200, target: 8500 },
    { day: 'Sat', eggs: 8950, target: 8500 },
    { day: 'Sun', eggs: 12720, target: 8500 },
  ];

  housePerf: HousePerf[] = [
    { name: 'Alpha-1', batch: 'B-2024-001', fcr: 1.42, mortalityPct: 1.2, eggCount: 1240, status: 'warning'  },
    { name: 'Beta-2',  batch: 'B-2024-002', fcr: 1.35, mortalityPct: 0.5, eggCount: 1480, status: 'good'     },
    { name: 'Delta-1', batch: 'B-2024-004', fcr: 1.10, mortalityPct: 0.1, eggCount:  980, status: 'good'     },
    { name: 'Alpha-2', batch: 'B-2024-005', fcr: 1.68, mortalityPct: 3.0, eggCount:  720, status: 'critical' },
    { name: 'Gamma-3', batch: 'B-2024-003', fcr: 1.55, mortalityPct: 2.1, eggCount:  890, status: 'warning'  },
  ];

  alerts = [
    { id: 1, level: 'high', icon: 'crisis_alert',  title: 'High FCR — Alpha-2',         desc: 'FCR 1.68 exceeds 1.6 threshold' },
    { id: 2, level: 'high', icon: 'warning',        title: 'Mortality Spike — Alpha-2',   desc: '3.0% — above normal range' },
    { id: 3, level: 'med',  icon: 'inventory_2',    title: 'Finisher Feed Low',           desc: '950 kg — reorder recommended' },
    { id: 4, level: 'low',  icon: 'vaccines',       title: 'Vaccination Due — Delta-1',   desc: 'Marek\'s Stage 2 overdue' },
  ];

  activityItems = [
    { id: 1, icon: 'egg',         text: '12,720 eggs collected across all houses', time: '7:30 AM' },
    { id: 2, icon: 'task_alt',    text: '8 production entries verified',           time: '8:05 AM' },
    { id: 3, icon: 'vaccines',    text: 'Newcastle vaccine — Beta-2 completed',    time: '9:30 AM' },
    { id: 4, icon: 'point_of_sale', text: '₱24,500 sales — 3 customers',          time: '10:15 AM' },
    { id: 5, icon: 'emergency',   text: 'Mortality logged — 7 birds (Gamma-3)',   time: '11:00 AM' },
  ];

  profitRows = [
    { label: 'Gross Revenue',  value: '₱124,500' },
    { label: 'Feed Costs',     value: '₱22,800'  },
    { label: 'Medicine',       value: '₱3,200'   },
    { label: 'Labor',          value: '₱5,125'   },
  ];

  barH(eggs: number): number {
    return Math.round((eggs / 10000) * 128);
  }
}

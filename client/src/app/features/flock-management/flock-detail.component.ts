import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlockBatchService } from '../../core/services/flock-batch.service';

interface FlockDetail {
  id:number; batchCode:string; houseName:string; breed:string;
  ageDays:number; population:number; initialCount:number; fcr:number;
  mortalityPct:number; status:string; arrivalDate:string; sourceFarm:string;
}

const MOCK_DETAIL: Record<number, FlockDetail> = {
  1:{ id:1, batchCode:'B-2024-001', houseName:'Alpha-1', breed:'Cobb 500', ageDays:32, population:12450, initialCount:12500, fcr:1.42, mortalityPct:1.2, status:'Active',    arrivalDate:'Jan 10, 2024', sourceFarm:'GreenValley Hatchery' },
  2:{ id:2, batchCode:'B-2024-002', houseName:'Beta-2',  breed:'Ross 308', ageDays:18, population:15000, initialCount:15000, fcr:1.35, mortalityPct:0.5, status:'Active',    arrivalDate:'Jan 24, 2024', sourceFarm:'SunFarm' },
  4:{ id:4, batchCode:'B-2024-004', houseName:'Delta-1', breed:'Hubbard',  ageDays:5,  population:10200, initialCount:10200, fcr:1.10, mortalityPct:0.1, status:'Active',    arrivalDate:'Feb 06, 2024', sourceFarm:'PrimeBirds' },
  5:{ id:5, batchCode:'B-2024-005', houseName:'Alpha-2', breed:'Ross 308', ageDays:12, population:14850, initialCount:14850, fcr:1.28, mortalityPct:0.3, status:'Active',    arrivalDate:'Jan 30, 2024', sourceFarm:'SunFarm' },
};

@Component({
  selector: 'app-flock-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-lg max-w-4xl mx-auto pb-xl">
      <!-- Back -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/flocks"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div>
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">
            Batch Detail
            @if (batch()) { — {{ batch()!.batchCode }} }
          </h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center p-xl text-on-surface-variant gap-sm">
          <span class="material-symbols-outlined animate-spin">refresh</span> Loading batch data...
        </div>
      } @else if (batch(); as b) {
        <!-- Hero card -->
        <div class="bg-primary rounded-2xl p-lg mb-lg relative overflow-hidden">
          <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-md text-center">
            @for (stat of batchStats(b); track stat.label) {
              <div class="bg-white/15 rounded-xl p-md">
                <div class="font-bold text-on-primary" style="font-size:22px">{{ stat.value }}</div>
                <div class="text-xs text-on-primary opacity-70 mt-xs">{{ stat.label }}</div>
              </div>
            }
          </div>
          <div class="absolute -top-8 -right-8 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-lg">
          <!-- Batch info -->
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">Batch Information</h3>
            <div class="space-y-sm">
              @for (row of batchInfo(b); track row.label) {
                <div class="flex justify-between py-sm border-b border-outline-variant last:border-0">
                  <span class="text-sm text-on-surface-variant">{{ row.label }}</span>
                  <span class="font-semibold text-on-surface text-sm">{{ row.value }}</span>
                </div>
              }
            </div>
            <div class="flex gap-sm mt-md">
              <a routerLink="/flocks"
                 class="flex-1 py-sm text-center border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container transition-all">
                ← Back to List
              </a>
              <a routerLink="/mortality/log"
                 class="flex-1 py-sm text-center bg-surface-container-high text-on-surface rounded-lg text-label-md hover:bg-surface-container-highest transition-all">
                Log Mortality
              </a>
            </div>
          </div>

          <!-- Growth chart -->
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">
              Growth Trend (Weight g)
            </h3>
            <div style="height:160px">
              <svg class="w-full h-full" viewBox="0 0 300 140" preserveAspectRatio="none">
                <!-- Grid -->
                @for (y of [0,35,70,105,140]; track y) {
                  <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="300" stroke="#c1c8c2" stroke-width="0.5" opacity="0.4"/>
                }
                <!-- Growth line -->
                <path d="M0,130 Q50,110 100,90 T200,50 T300,15"
                      fill="none" stroke="#012d1d" stroke-width="2.5" stroke-linejoin="round"/>
                <path d="M0,130 Q50,110 100,90 T200,50 T300,15 L300,140 L0,140 Z"
                      fill="#012d1d" opacity="0.07"/>
                <!-- dots -->
                @for (pt of growthDots; track pt.x) {
                  <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#012d1d" stroke="white" stroke-width="2"/>
                }
              </svg>
            </div>
            <div class="flex justify-between mt-xs text-[10px] text-on-surface-variant">
              <span>Day 0 (42g)</span>
              <span>Day {{ b.ageDays }}</span>
            </div>
          </div>
        </div>

        <!-- Status chips -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">Batch Status Overview</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
            @for (chip of statusChips(b); track chip.label) {
              <div class="text-center p-md rounded-xl border"
                   [class]="chip.alertColor ? 'border-' + chip.alertColor + ' bg-' + chip.alertColor + '/10' : 'border-outline-variant bg-surface-container'">
                <div class="font-bold text-on-surface" [class]="chip.textColor" style="font-size:18px">{{ chip.value }}</div>
                <div class="text-label-md text-on-surface-variant mt-xs">{{ chip.label }}</div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center p-xl text-on-surface-variant">
          <span class="material-symbols-outlined text-5xl block mb-md opacity-30">search_off</span>
          <p>Batch #{{ id }} not found.</p>
          <a routerLink="/flocks" class="text-primary hover:underline mt-sm block">Back to Flock List</a>
        </div>
      }
    </div>
  `,
})
export class FlockDetailComponent implements OnInit {
  @Input() id!: string;
  private batchSvc = inject(FlockBatchService);

  today   = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  loading = signal(true);
  batch   = signal<FlockDetail | null>(null);

  growthDots = [
    {x:0,y:130},{x:60,y:115},{x:120,y:92},{x:180,y:62},{x:240,y:35},{x:300,y:15},
  ];

  ngOnInit(): void {
    const numId = parseInt(this.id);
    // Try API first
    this.batchSvc.getById(numId).subscribe({
      next: (b: any) => {
        this.batch.set({ id:b.id, batchCode:b.batchCode, houseName:b.houseName, breed:b.breed,
          ageDays:b.ageDays??0, population:b.population??b.current_count??0,
          initialCount:b.initialCount??b.initial_count??0, fcr:b.fcr??0, mortalityPct:b.mortalityPct??0,
          status:b.status, arrivalDate:b.arrivalDate??b.arrival_date, sourceFarm:b.sourceFarm??b.source_farm });
        this.loading.set(false);
        // Load performance data for chart
        this.batchSvc.getPerformance(numId).subscribe({
          next: (perf) => {
            if (perf?.age_curve?.length) {
              const maxW  = Math.max(...perf.age_curve.map((p: any) => p.weight_g));
              const maxDay= perf.age_curve[perf.age_curve.length - 1].day || 42;
              this.growthDots = perf.age_curve.map((p: any) => ({
                x: Math.round((p.day / maxDay) * 300),
                y: Math.round(130 - (p.weight_g / maxW) * 120),
              }));
            }
          },
          error: () => {},
        });
      },
      error: () => {
        this.batch.set(MOCK_DETAIL[numId] ?? null);
        this.loading.set(false);
      },
    });
  }

  batchStats(b: FlockDetail) {
    return [
      { label:'Current Birds', value: b.population.toLocaleString() },
      { label:'Age',           value: `Day ${b.ageDays}` },
      { label:'FCR',           value: b.fcr.toString() },
      { label:'Mortality',     value: `${b.mortalityPct}%` },
    ];
  }

  batchInfo(b: FlockDetail) {
    return [
      { label:'Batch Code',    value: b.batchCode    },
      { label:'Breed',         value: b.breed        },
      { label:'House',         value: b.houseName    },
      { label:'Arrival Date',  value: b.arrivalDate  },
      { label:'Source Farm',   value: b.sourceFarm   },
      { label:'Initial Count', value: b.initialCount.toLocaleString() },
      { label:'Status',        value: b.status       },
    ];
  }

  statusChips(b: FlockDetail) {
    const dead = b.initialCount - b.population;
    return [
      { label:'Status',      value: b.status,               textColor: b.status==='Active'?'text-primary':'text-error',      alertColor:'' },
      { label:'Total Dead',  value: dead.toLocaleString(),  textColor: dead>50?'text-error':'text-on-surface',              alertColor:dead>50?'error':'' },
      { label:'FCR Rating',  value: b.fcr<=1.45?'Efficient':b.fcr<=1.6?'Monitor':'Critical',
        textColor: b.fcr<=1.45?'text-primary':b.fcr<=1.6?'text-secondary':'text-error', alertColor:'' },
      { label:'Mort. Risk',  value: b.mortalityPct<1?'Low':b.mortalityPct<2?'Elevated':'High',
        textColor: b.mortalityPct<1?'text-primary':b.mortalityPct<2?'text-secondary':'text-error', alertColor:'' },
    ];
  }
}

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FarmService } from '../../core/services/farm.service';

const BUILDINGS: any[] = [
  { id:1, name:'Alpha-1', type:'Broiler', capacity:15000, status:'active',      currentBatch:'B-2024-001', population:12450, supervisor:'Juan dela Cruz'  },
  { id:2, name:'Alpha-2', type:'Broiler', capacity:15000, status:'active',      currentBatch:'B-2024-005', population:14850, supervisor:'Juan dela Cruz'  },
  { id:3, name:'Beta-1',  type:'Layer',   capacity:12000, status:'inactive',    currentBatch:undefined,    population:0,     supervisor:'Pedro Reyes'     },
  { id:4, name:'Beta-2',  type:'Layer',   capacity:12000, status:'active',      currentBatch:'B-2024-002', population:15000, supervisor:'Pedro Reyes'     },
  { id:5, name:'Gamma-3', type:'Broiler', capacity:18000, status:'active',      currentBatch:undefined,    population:0,     supervisor:'Rosa Mendoza'    },
  { id:6, name:'Delta-1', type:'Breeder', capacity:10000, status:'active',      currentBatch:'B-2024-004', population:10200, supervisor:'Carlos Bautista' },
];

@Component({ selector:'app-farm-management', standalone:true, imports:[CommonModule,FormsModule,RouterLink], template:`
<div class="p-lg max-w-5xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Farm Management</h1>
      <p class="text-body-md text-on-surface-variant">{{ today }}</p>
    </div>
    <a routerLink="/admin/settings"
       class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
      <span class="material-symbols-outlined text-[18px]">settings</span>Configure
    </a>
  </div>

  <!-- Farm info card -->
  <div class="bg-primary rounded-2xl p-lg mb-lg relative overflow-hidden">
    <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-lg">
      <div>
        <div class="text-xs text-on-primary opacity-70 uppercase font-bold tracking-widest mb-sm">Farm Profile</div>
        <h2 class="font-bold text-on-primary mb-xs" style="font-size:22px">GreenValley Poultry Farm</h2>
        <p class="text-sm text-on-primary opacity-80">Brgy. San Isidro, Batangas City, Philippines</p>
        <p class="text-sm text-on-primary opacity-70 mt-xs">Owner: Ricardo Santos · +63 912 345 6789</p>
      </div>
      <div class="grid grid-cols-3 gap-md">
        @for (stat of farmStats; track stat.label) {
          <div class="bg-white/15 rounded-xl p-md text-center">
            <div class="font-bold text-on-primary" style="font-size:20px">{{ stat.value }}</div>
            <div class="text-xs text-on-primary opacity-70 mt-xs">{{ stat.label }}</div>
          </div>
        }
      </div>
    </div>
    <div class="absolute -top-8 -right-8 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
  </div>

  <!-- Building grid -->
  <h2 class="font-bold text-on-surface mb-md" style="font-size:16px">Poultry Houses ({{ buildings.length }})</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
    @for (b of buildings; track b.id) {
      <div class="bg-white border rounded-2xl p-lg shadow-sm hover:shadow-md transition-all"
           [class]="b.status==='active' ? 'border-outline-variant' : b.status==='maintenance' ? 'border-secondary' : 'border-outline'">
        <div class="flex items-start gap-md mb-md">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               [class]="b.status==='active' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container text-on-surface-variant'">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">home_health</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-on-surface" style="font-size:16px">{{ b.name }}</h3>
              <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                    [class]="b.status==='active' ? 'bg-primary-fixed text-on-primary-fixed-variant' : b.status==='maintenance' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant'">
                {{ b.status }}
              </span>
            </div>
            <p class="text-xs text-on-surface-variant mt-xs">{{ b.type }} · Capacity: {{ b.capacity.toLocaleString() }} birds · {{ b.supervisor }}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-sm text-center mb-md">
          <div class="bg-surface-container rounded-lg p-sm">
            <div class="font-bold text-primary text-sm">{{ b.population.toLocaleString() }}</div>
            <div class="text-[10px] text-on-surface-variant uppercase">Population</div>
          </div>
          <div class="bg-surface-container rounded-lg p-sm">
            <div class="font-bold text-primary text-sm">{{ occupancyPct(b) }}%</div>
            <div class="text-[10px] text-on-surface-variant uppercase">Occupancy</div>
          </div>
          <div class="bg-surface-container rounded-lg p-sm">
            <div class="font-bold text-sm" [class]="b.currentBatch ? 'text-primary' : 'text-on-surface-variant'">
              {{ b.currentBatch || 'Empty' }}
            </div>
            <div class="text-[10px] text-on-surface-variant uppercase">Active Batch</div>
          </div>
        </div>

        <!-- Occupancy bar -->
        <div class="w-full bg-surface-container rounded-full h-2 mb-md">
          <div class="h-2 rounded-full transition-all duration-500"
               [class]="occupancyPct(b) > 80 ? 'bg-primary' : occupancyPct(b) > 0 ? 'bg-primary' : 'bg-surface-container-highest'"
               [style.width.%]="occupancyPct(b)"></div>
        </div>

        <div class="flex items-center gap-sm">
          <a [routerLink]="b.currentBatch ? '/flocks' : null"
             class="flex-1 py-xs text-center border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container transition-all text-sm">
            View Batch
          </a>
          <a routerLink="/admin/settings"
             class="flex-1 py-xs text-center bg-surface-container text-on-surface rounded-lg text-label-md hover:bg-surface-container-high transition-all text-sm">
            Edit House
          </a>
        </div>
      </div>
    }
  </div>

  <!-- Key metrics -->
  <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
    <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Farm-wide Metrics</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
      @for (m of metrics; track m.label) {
        <div class="text-center p-md bg-surface-container rounded-xl">
          <div class="font-bold" [class]="m.color" style="font-size:22px">{{ m.value }}</div>
          <div class="text-label-md text-on-surface-variant mt-xs">{{ m.label }}</div>
        </div>
      }
    </div>
  </div>
</div>
` })
export class FarmManagementComponent implements OnInit {
  private farmSvc = inject(FarmService);

  today     = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  loadingBuildings = signal(false);
  buildingsSig     = signal<any[]>([]);
  metaSig          = signal<any>(null);

  ngOnInit(): void {
    this.loadingBuildings.set(true);
    this.farmSvc.getBuildings().subscribe({
      next: (res) => {
        if (res?.data?.length) this.buildingsSig.set(res.data);
        if (res?.meta)         this.metaSig.set(res.meta);
        this.loadingBuildings.set(false);
      },
      error: () => this.loadingBuildings.set(false),
    });
  }

  get buildings(): any[] {
    return this.buildingsSig().length ? this.buildingsSig() : BUILDINGS as any;
  }
  get farmStats() {
    const m = this.metaSig();
    return [
      { label:'Houses',        value: m?.total_count?.toString() ?? this.buildings.length.toString() },
      { label:'Active Flocks', value: m?.active_count?.toString() ?? this.buildings.filter((b:any) => b.status === 'active' && b.batchCode).length.toString() },
      { label:'Total Birds',   value: m?.total_population?.toLocaleString() ?? this.buildings.reduce((s:number,b:any)=>s+(b.population??0),0).toLocaleString() },
    ];
  }

  get metrics() {
    const m = this.metaSig();
    const b = this.buildings;
    const cap = m?.total_capacity ?? b.reduce((s:any,x:any)=>s+(x.capacity??0),0);
    const pop = m?.total_population ?? b.reduce((s:any,x:any)=>s+(x.population??0),0);
    const occ = m?.occupancy_pct ?? (cap ? Math.round(pop/cap*100) : 0);
    const act = m?.active_count ?? b.filter((x:any)=>x.status==='active').length;
    return [
      { label:'Total Capacity',     value: cap.toLocaleString(),         color:'text-primary'    },
      { label:'Current Population', value: pop.toLocaleString(),         color:'text-primary'    },
      { label:'Avg Occupancy',      value: occ + '%',                    color:'text-secondary'  },
      { label:'Active Buildings',   value: act + ' / ' + b.length,      color:'text-on-surface' },
    ];
  }

  occupancyPct(b: any): number { return b.capacity ? Math.round((b.population / b.capacity) * 100) : 0; }
}

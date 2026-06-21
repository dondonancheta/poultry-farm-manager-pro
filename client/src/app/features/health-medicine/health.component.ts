import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService } from '../../core/services/index';
import { NotificationService } from '../../core/services/notification.service';

type VaccStatus  = 'completed' | 'scheduled' | 'overdue';
type MedType     = 'Vaccine' | 'Antibiotic' | 'Vitamin' | 'Antifungal' | 'Antiparasitic';

interface MedicineStock {
  id: number; name: string; type: MedType;
  activeIngredient: string; stock: number; unit: string;
  expiryDate: string; withdrawalDays: number;
  supplier: string; stockPct: number; maxStock: number;
  storageTemp: string; costPerUnit: number;
}

interface MedicineReceiving {
  id: number; medicineId: number; medicineName: string;
  supplier: string; quantity: number; unit: string;
  batchNo: string; expiryDate: string; costPerUnit: number;
  receivedDate: string; receivedBy: string;
}

interface TreatmentRecord {
  id: number; batch: string; building: string;
  medicineId: number; medicineName: string;
  dosage: string; durationDays: number;
  administeredAt: string; administeredBy: string;
  symptoms: string; diagnosis: string;
  withdrawalDays: number; withdrawalEnds?: string;
  affectedCount: number; notes?: string;
}

interface VaccRecord {
  id: number; batch: string; building: string;
  vaccineName: string; scheduledDate: string;
  status: VaccStatus; completedDate?: string;
  administeredBy?: string; batchNo?: string;
  notes?: string;
}

interface HealthAlert {
  id: number; level: 'critical' | 'warning' | 'info';
  icon: string; title: string; desc: string;
}

const INITIAL_MEDICINES: MedicineStock[] = [
  { id:1, name:'Newcastle (LaSota)',  type:'Vaccine',      activeIngredient:'LaSota strain',     stock:200, unit:'doses', expiryDate:'2025-03-15', withdrawalDays:0, supplier:'VetCare PH',    stockPct:67, maxStock:300, storageTemp:'2–8°C',   costPerUnit:45.00 },
  { id:2, name:'Gumboro (IBD Live)',  type:'Vaccine',      activeIngredient:'IBD virus (live)',  stock:50,  unit:'doses', expiryDate:'2025-02-28', withdrawalDays:0, supplier:'VetCare PH',    stockPct:25, maxStock:200, storageTemp:'2–8°C',   costPerUnit:38.00 },
  { id:3, name:"Marek's Disease",     type:'Vaccine',      activeIngredient:'HVT strain',        stock:320, unit:'doses', expiryDate:'2025-06-01', withdrawalDays:0, supplier:'PhilVet',       stockPct:80, maxStock:400, storageTemp:'−196°C',  costPerUnit:62.00 },
  { id:4, name:'Tetracycline 500mg',  type:'Antibiotic',   activeIngredient:'Oxytetracycline',   stock:12,  unit:'packs', expiryDate:'2025-08-10', withdrawalDays:7, supplier:'MedSupply PH',  stockPct:40, maxStock:30,  storageTemp:'15–25°C', costPerUnit:185.00 },
  { id:5, name:'B-Complex Vitamins',  type:'Vitamin',      activeIngredient:'B1, B6, B12',       stock:8,   unit:'packs', expiryDate:'2025-04-20', withdrawalDays:0, supplier:'MedSupply PH',  stockPct:30, maxStock:25,  storageTemp:'15–25°C', costPerUnit:95.00 },
  { id:6, name:'Amoxicillin 20%',     type:'Antibiotic',   activeIngredient:'Amoxicillin trihydrate',stock:6,unit:'bottles',expiryDate:'2025-05-10',withdrawalDays:5, supplier:'PhilVet',      stockPct:20, maxStock:30,  storageTemp:'15–25°C', costPerUnit:220.00 },
];

const INITIAL_TREATMENTS: TreatmentRecord[] = [
  { id:1, batch:'B-2024-001', building:'Alpha-1', medicineId:4, medicineName:'Tetracycline 500mg', dosage:'10 ml per litre of drinking water', durationDays:5, administeredAt:'Today 08:00 AM', administeredBy:'Maria Santos', symptoms:'Respiratory distress, gasping birds', diagnosis:'Chronic Respiratory Disease (CRD) suspected', withdrawalDays:7, withdrawalEnds:'7 days from today', affectedCount:150 },
  { id:2, batch:'B-2024-005', building:'Alpha-2', medicineId:5, medicineName:'B-Complex Vitamins', dosage:'Mix in feed — 500g per tonne', durationDays:3, administeredAt:'3 days ago', administeredBy:'Maria Santos', symptoms:'Low appetite, lethargy, reduced egg count', diagnosis:'Vitamin B deficiency', withdrawalDays:0, affectedCount:14850 },
];

const INITIAL_VACCINATIONS: VaccRecord[] = [
  { id:1, batch:'B-2024-002', building:'Beta-2',  vaccineName:'Newcastle Stage 2', scheduledDate:'Today',         status:'completed', completedDate:'Today', administeredBy:'Maria Santos',  batchNo:'VAC-001' },
  { id:2, batch:'B-2024-001', building:'Alpha-1', vaccineName:'Newcastle Stage 3', scheduledDate:'In 10 days',    status:'scheduled' },
  { id:3, batch:'B-2024-004', building:'Delta-1', vaccineName:"Marek's Disease",   scheduledDate:'2 days overdue',status:'overdue' },
  { id:4, batch:'B-2024-005', building:'Alpha-2', vaccineName:'Gumboro Stage 1',   scheduledDate:'In 8 days',     status:'scheduled' },
  { id:5, batch:'B-2024-001', building:'Alpha-1', vaccineName:'IB (Infectious Bronchitis)', scheduledDate:'In 17 days', status:'scheduled' },
];

const BATCHES   = ['B-2024-001','B-2024-002','B-2024-004','B-2024-005'];
const BUILDINGS = ['Alpha-1','Alpha-2','Beta-1','Beta-2','Gamma-3','Delta-1'];
const STAFF     = ['Maria Santos','Dr. Reyes','Dr. Bautista','Pedro Reyes','Carlos Bautista'];
const SUPPLIERS = ['VetCare PH','PhilVet','MedSupply PH','AgriVet'];

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-lg max-w-6xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Health & Medicine Management</h1>
      <p class="text-body-md text-on-surface-variant">{{ today }}</p>
    </div>
    <div class="flex gap-sm">
      <button (click)="activeTab='treatments'; showTreatForm=true"
              class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">healing</span>Log Treatment
      </button>
      <button (click)="activeTab='medicine'; showRestockForm=true"
              class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">add_circle</span>Restock Medicine
      </button>
    </div>
  </div>

  <!-- Alert banners -->
  @for (alert of healthAlerts(); track alert.id) {
    <div class="rounded-xl p-md flex items-start gap-md mb-sm border"
         [class]="alert.level==='critical'
           ? 'bg-error-container border-error'
           : alert.level==='warning'
           ? 'bg-secondary-fixed border-secondary-fixed-dim'
           : 'bg-primary-fixed border-primary-fixed-dim'">
      <span class="material-symbols-outlined text-[22px] flex-shrink-0 mt-xs"
            [class]="alert.level==='critical' ? 'text-on-error-container'
                   : alert.level==='warning'  ? 'text-on-secondary-fixed-variant'
                   : 'text-on-primary-fixed-variant'"
            style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
      <div class="flex-1">
        <p class="font-bold" [class]="alert.level==='critical' ? 'text-on-error-container' : 'text-on-surface'">
          {{ alert.title }}
        </p>
        <p class="text-xs mt-xs opacity-80" [class]="alert.level==='critical' ? 'text-on-error-container' : 'text-on-surface-variant'">
          {{ alert.desc }}
        </p>
      </div>
    </div>
  }
  @if (healthAlerts().length > 0) { <div class="mb-lg"></div> }

  <!-- KPI strip -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
    @for (k of healthKpis(); track k.label) {
      <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
        <div class="font-bold" [class]="k.color" style="font-size:20px">{{ k.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ k.label }}</div>
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="flex gap-xs mb-lg border-b border-outline-variant overflow-x-auto pb-xs">
    @for (tab of tabs(); track tab.key) {
      <button (click)="activeTab = tab.key"
              class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px
                     whitespace-nowrap flex items-center gap-xs"
              [class]="activeTab===tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'">
        <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
        {{ tab.label }}
        @if (tab.badge > 0) {
          <span class="ml-xs px-xs rounded-full text-[10px] font-bold bg-error text-on-error">{{ tab.badge }}</span>
        }
      </button>
    }
  </div>

  <!-- ════════ MEDICINE STOCK ════════ -->
  @if (activeTab === 'medicine') {
    <div class="space-y-md">
      <!-- Filter bar -->
      <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center shadow-sm">
        <div class="relative flex-1 min-w-40">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input [(ngModel)]="medSearch" placeholder="Search medicines..."
                 class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        </div>
        <select [(ngModel)]="medTypeFilter"
                class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All types</option>
          <option value="Vaccine">Vaccine</option>
          <option value="Antibiotic">Antibiotic</option>
          <option value="Vitamin">Vitamin</option>
        </select>
        <div class="flex gap-xs">
          @for (f of ['all','low','expiring']; track f) {
            <button (click)="medStockFilter = f"
                    class="px-md py-xs rounded-lg text-label-md font-bold transition-all capitalize"
                    [class]="medStockFilter===f
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
              {{ f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Expiring' }}
            </button>
          }
        </div>
      </div>

      <!-- Medicine cards -->
      @for (med of filteredMedicines(); track med.id) {
        <div class="bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all"
             [class]="medStockLevel(med) === 'critical' ? 'border-error'
                    : medStockLevel(med) === 'low'      ? 'border-secondary'
                    : isExpiringSoon(med.expiryDate)    ? 'border-secondary-container'
                    : 'border-outline-variant'">
          <div class="p-lg">
            <div class="flex items-start gap-md mb-md">
              <!-- Icon -->
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                   [class]="medIconBg(med.type)">
                <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">
                  {{ med.type==='Vaccine' ? 'vaccines' : med.type==='Antibiotic' ? 'medication' : 'science' }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-md">
                  <div>
                    <p class="font-bold text-on-surface">{{ med.name }}</p>
                    <p class="text-xs text-on-surface-variant mt-xs">{{ med.activeIngredient }}</p>
                    <div class="flex items-center gap-md mt-sm flex-wrap">
                      <span class="text-xs px-sm py-xs rounded-full font-bold"
                            [class]="medTypeBadge(med.type)">{{ med.type }}</span>
                      <span class="text-xs text-on-surface-variant">{{ med.supplier }}</span>
                      <span class="text-xs text-on-surface-variant">Storage: {{ med.storageTemp }}</span>
                      @if (med.withdrawalDays > 0) {
                        <span class="text-xs font-bold bg-secondary-fixed text-on-secondary-fixed-variant px-sm py-xs rounded-full">
                          {{ med.withdrawalDays }}d withdrawal
                        </span>
                      }
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="font-bold" style="font-size:22px"
                         [class]="medStockLevel(med)==='critical' ? 'text-error'
                                : medStockLevel(med)==='low'      ? 'text-secondary'
                                : 'text-primary'">
                      {{ med.stock }} {{ med.unit }}
                    </div>
                    <div class="text-xs text-on-surface-variant">₱{{ med.costPerUnit }}/{{ med.unit }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stock bar -->
            <div class="mb-sm">
              <div class="flex justify-between text-xs text-on-surface-variant mb-xs">
                <span [class]="medStockLevel(med)==='critical' ? 'text-error font-bold' : ''">
                  {{ medStockLevel(med)==='critical' ? '⚠ Critical — Reorder Now'
                   : medStockLevel(med)==='low'      ? '⚠ Low Stock'
                   : '✓ Adequate' }}
                </span>
                <span>{{ med.stockPct }}% of capacity · Expiry: {{ med.expiryDate }}
                  {{ isExpiringSoon(med.expiryDate) ? ' ⚠' : '' }}</span>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2.5 relative">
                <div class="absolute top-0 bottom-0 w-0.5 bg-secondary/60 rounded z-10" style="left:25%"></div>
                <div class="h-2.5 rounded-full transition-all duration-500"
                     [class]="medStockLevel(med)==='critical' ? 'bg-error'
                            : medStockLevel(med)==='low'      ? 'bg-secondary-container'
                            : 'bg-primary'"
                     [style.width.%]="med.stockPct"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-sm border-t border-outline-variant">
              <span class="text-xs text-on-surface-variant">
                Stock value: ₱{{ (med.stock * med.costPerUnit).toLocaleString() }}
              </span>
              <div class="flex gap-sm">
                <button (click)="useMedicine(med)"
                        class="px-md py-xs bg-surface-container text-on-surface rounded-lg text-label-md
                               hover:bg-surface-container-high transition-all">
                  Use / Dispense
                </button>
                <button (click)="restockMedicine(med)"
                        class="px-md py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-label-md
                               hover:bg-primary hover:text-on-primary transition-all">
                  Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  }

  <!-- ════════ TREATMENTS ════════ -->
  @if (activeTab === 'treatments') {
    <div class="space-y-md">
      <!-- Active withdrawals banner -->
      @if (activeWithdrawals().length > 0) {
        <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-2xl p-lg">
          <div class="flex items-center gap-sm mb-md">
            <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[22px]"
                  style="font-variation-settings:'FILL' 1">schedule</span>
            <h3 class="font-bold text-on-secondary-fixed-variant" style="font-size:15px">
              Active Withdrawal Periods ({{ activeWithdrawals().length }})
            </h3>
          </div>
          <div class="space-y-sm">
            @for (t of activeWithdrawals(); track t.id) {
              <div class="bg-white/60 rounded-xl p-md flex items-center justify-between">
                <div>
                  <p class="font-bold text-on-surface text-sm">{{ t.batch }} · {{ t.building }}</p>
                  <p class="text-xs text-on-surface-variant">{{ t.medicineName }} — withdrawal ends: {{ t.withdrawalEnds }}</p>
                </div>
                <span class="px-sm py-xs bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase">
                  Do Not Sell Eggs
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Treatment records -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:15px">
            Treatment Records <span class="text-on-surface-variant font-normal text-sm ml-sm">({{ treatments().length }})</span>
          </h3>
          <button (click)="showTreatForm = true"
                  class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
            <span class="material-symbols-outlined text-[16px]">add</span>New Treatment
          </button>
        </div>

        <div class="divide-y divide-outline-variant">
          @for (t of treatments(); track t.id) {
            <div class="p-lg hover:bg-surface-container-lowest transition-colors">
              <div class="flex items-start gap-md">
                <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                     [class]="medIconBg(getMedType(t.medicineId))">
                  <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">medication</span>
                </div>
                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <p class="font-bold text-on-surface">{{ t.medicineName }}</p>
                    <p class="text-xs text-on-surface-variant mt-xs">
                      {{ t.batch }} · {{ t.building }} · {{ t.administeredAt }}
                    </p>
                    <p class="text-xs text-on-surface-variant mt-xs">By {{ t.administeredBy }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-on-surface"><span class="font-bold">Dosage:</span> {{ t.dosage }}</p>
                    <p class="text-xs text-on-surface-variant mt-xs">Duration: {{ t.durationDays }} days</p>
                    <p class="text-xs text-on-surface-variant">Birds affected: {{ t.affectedCount.toLocaleString() }}</p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm text-on-surface"><span class="font-bold">Symptoms:</span> {{ t.symptoms }}</p>
                    @if (t.diagnosis) {
                      <p class="text-xs text-on-surface-variant mt-xs">Diagnosis: {{ t.diagnosis }}</p>
                    }
                    @if (t.withdrawalEnds) {
                      <div class="mt-sm flex items-center gap-xs bg-secondary-fixed/40 rounded-lg px-sm py-xs w-fit">
                        <span class="material-symbols-outlined text-[14px] text-on-secondary-fixed-variant">schedule</span>
                        <span class="text-xs text-on-secondary-fixed-variant font-bold">
                          Withdrawal: {{ t.withdrawalDays }}d — ends {{ t.withdrawalEnds }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
          @empty {
            <div class="p-xl text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl block mb-sm opacity-30">healing</span>
              No treatment records yet.
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ════════ VACCINATIONS ════════ -->
  @if (activeTab === 'vaccinations') {
    <div class="space-y-md">
      <!-- Vacc KPI strip -->
      <div class="grid grid-cols-4 gap-md">
        @for (v of vaccKpis(); track v.label) {
          <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div class="font-bold" [class]="v.color" style="font-size:22px">{{ v.value }}</div>
            <div class="text-label-md text-on-surface-variant mt-xs">{{ v.label }}</div>
          </div>
        }
      </div>

      <!-- Vaccination schedule -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:15px">Vaccination Schedule</h3>
          <div class="flex gap-sm">
            @for (s of ['All','Scheduled','Overdue','Completed']; track s) {
              <button (click)="vaccFilter = s"
                      class="px-md py-xs rounded-lg text-label-md transition-all"
                      [class]="vaccFilter===s ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'">
                {{ s }}
                @if (s === 'Overdue' && overdueCount() > 0) {
                  <span class="ml-xs px-xs rounded-full text-[10px] bg-error text-on-error font-bold">
                    {{ overdueCount() }}
                  </span>
                }
              </button>
            }
            <button (click)="showVaccForm = true"
                    class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90">
              <span class="material-symbols-outlined text-[16px]">add</span>Schedule
            </button>
          </div>
        </div>

        <div class="divide-y divide-outline-variant">
          @for (v of filteredVaccinations(); track v.id) {
            <div class="flex items-center gap-md px-lg py-md hover:bg-surface-container-lowest transition-colors">
              <!-- Status icon -->
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   [class]="v.status==='completed' ? 'bg-primary-fixed text-on-primary-fixed-variant'
                           : v.status==='overdue'   ? 'bg-error-container text-on-error-container'
                           : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">
                  {{ v.status==='completed' ? 'check_circle' : v.status==='overdue' ? 'warning' : 'event' }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-bold text-on-surface text-sm">{{ v.vaccineName }}</p>
                <p class="text-xs text-on-surface-variant mt-xs">
                  {{ v.batch }} · {{ v.building }}
                  @if (v.administeredBy) { · By {{ v.administeredBy }} }
                  @if (v.batchNo) { · Batch: {{ v.batchNo }} }
                </p>
                @if (v.notes) {
                  <p class="text-xs text-on-surface-variant mt-xs italic">{{ v.notes }}</p>
                }
              </div>

              <!-- Date & status -->
              <div class="text-right flex-shrink-0">
                <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase block mb-xs"
                      [class]="v.status==='completed' ? 'bg-primary-fixed text-on-primary-fixed-variant'
                              : v.status==='overdue'   ? 'bg-error text-on-error'
                              : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'">
                  {{ v.status }}
                </span>
                <p class="text-xs text-on-surface-variant">
                  {{ v.completedDate || v.scheduledDate }}
                </p>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-xs flex-shrink-0">
                @if (v.status === 'scheduled' || v.status === 'overdue') {
                  <button (click)="openMarkDone(v)"
                          class="px-md py-xs bg-primary text-on-primary rounded-lg text-label-md font-bold
                                 hover:opacity-90 transition-all">
                    Mark Done
                  </button>
                }
                @if (v.status === 'scheduled') {
                  <button (click)="rescheduleVacc(v)"
                          class="px-sm py-xs border border-outline text-on-surface-variant rounded-lg text-label-md
                                 hover:bg-surface-container transition-all">
                    Reschedule
                  </button>
                }
              </div>
            </div>
          }
          @empty {
            <div class="p-xl text-center text-on-surface-variant">
              No vaccinations match the selected filter.
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ════════ MEDICINE RESTOCK MODAL ════════ -->
  @if (showRestockForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Restock Medicine</h3>
          <button (click)="showRestockForm=false; resetRestockForm()"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Medicine *</label>
              <select [(ngModel)]="restockForm.medicineId"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null">Select medicine...</option>
                @for (m of medicines(); track m.id) { <option [ngValue]="m.id">{{ m.name }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Supplier *</label>
              <select [(ngModel)]="restockForm.supplier"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select supplier...</option>
                @for (s of suppliers; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Quantity *</label>
              <div class="flex items-center gap-sm">
                <input type="number" [(ngModel)]="restockForm.quantity" min="1"
                       class="flex-1 text-center border border-outline-variant rounded-lg px-sm py-sm text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                <span class="text-sm text-on-surface-variant w-14">
                  {{ restockUnit() }}
                </span>
              </div>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Cost per unit (₱)</label>
              <input type="number" [(ngModel)]="restockForm.costPerUnit" step="0.50" min="0"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Batch / LOT No.</label>
              <input [(ngModel)]="restockForm.batchNo" placeholder="LOT-2024-XXX"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Expiry Date *</label>
              <input type="date" [(ngModel)]="restockForm.expiryDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Received By</label>
              <select [(ngModel)]="restockForm.receivedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select staff...</option>
                @for (s of staff; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Received Date</label>
              <input type="date" [(ngModel)]="restockForm.receivedDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
          </div>
          @if (restockForm.quantity > 0 && restockForm.costPerUnit > 0) {
            <div class="bg-primary-container rounded-xl p-md flex justify-between items-center">
              <span class="font-bold text-on-primary-container">Total Cost</span>
              <span class="font-bold text-on-primary" style="font-size:20px">
                ₱{{ (restockForm.quantity * restockForm.costPerUnit).toLocaleString() }}
              </span>
            </div>
          }
          @if (restockError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ restockError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showRestockForm=false; resetRestockForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitRestock()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Confirm Restock
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ TREATMENT LOG MODAL ════════ -->
  @if (showTreatForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Log Treatment</h3>
          <button (click)="showTreatForm=false; resetTreatForm()"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Flock Batch *</label>
              <select [(ngModel)]="treatForm.batch"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select batch...</option>
                @for (b of batches; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Building *</label>
              <select [(ngModel)]="treatForm.building"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select building...</option>
                @for (b of buildings; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Medicine *</label>
              <select [(ngModel)]="treatForm.medicineId" (ngModelChange)="onMedicineSelect()"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null">Select medicine...</option>
                @for (m of medicines(); track m.id) { <option [ngValue]="m.id">{{ m.name }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Administered By *</label>
              <select [(ngModel)]="treatForm.administeredBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select staff...</option>
                @for (s of staff; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Dosage *</label>
              <input [(ngModel)]="treatForm.dosage" placeholder="e.g. 10 ml per litre of water"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Duration (days)</label>
              <input type="number" [(ngModel)]="treatForm.durationDays" min="1"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Birds Affected</label>
              <input type="number" [(ngModel)]="treatForm.affectedCount" min="1"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Symptoms *</label>
            <textarea [(ngModel)]="treatForm.symptoms" rows="2"
                      placeholder="Describe symptoms observed..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Diagnosis</label>
            <input [(ngModel)]="treatForm.diagnosis" placeholder="Suspected or confirmed diagnosis"
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          <!-- Withdrawal warning -->
          @if (selectedMedWithdrawal() > 0) {
            <div class="bg-secondary-fixed rounded-xl p-md flex items-center gap-sm">
              <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[20px]" style="font-variation-settings:'FILL' 1">schedule</span>
              <p class="text-on-secondary-fixed-variant text-sm font-bold">
                This medicine has a <strong>{{ selectedMedWithdrawal() }}-day withdrawal period</strong>.
                Eggs from this batch must not be sold during treatment.
              </p>
            </div>
          }
          @if (treatError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ treatError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showTreatForm=false; resetTreatForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitTreatment()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Save Treatment
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ MARK VACCINATION DONE MODAL ════════ -->
  @if (showMarkDoneForm && markDoneTarget) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Mark Vaccination Complete</h3>
          <button (click)="showMarkDoneForm=false"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="bg-primary-fixed rounded-xl p-md">
            <p class="font-bold text-on-surface">{{ markDoneTarget.vaccineName }}</p>
            <p class="text-xs text-on-surface-variant mt-xs">{{ markDoneTarget.batch }} · {{ markDoneTarget.building }}</p>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Administered By *</label>
            <select [(ngModel)]="markDoneForm.administeredBy"
                    class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select staff...</option>
              @for (s of staff; track s) { <option>{{ s }}</option> }
            </select>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Vaccine Batch / LOT No.</label>
            <input [(ngModel)]="markDoneForm.batchNo" placeholder="LOT-2024-XXX"
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Notes</label>
            <textarea [(ngModel)]="markDoneForm.notes" rows="2" placeholder="Any observations..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
          </div>
          @if (vaccApiError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ vaccApiError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showMarkDoneForm=false; vaccApiError.set('')"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="confirmMarkDone()" [disabled]="savingVacc()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 disabled:opacity-60
                           flex items-center justify-center gap-xs">
              @if (savingVacc()) {
                <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>Saving...
              } @else {
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">check_circle</span>
                Confirm Vaccination
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ RESCHEDULE VACCINATION MODAL ════════ -->
  @if (showReschedule && rescheduleTarget) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Reschedule Vaccination</h3>
          <button (click)="showReschedule=false" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="bg-surface-container rounded-xl p-md">
            <p class="font-bold text-on-surface">{{ rescheduleTarget.vaccineName }}</p>
            <p class="text-xs text-on-surface-variant mt-xs">{{ rescheduleTarget.batch }} · {{ rescheduleTarget.building }}</p>
            <p class="text-xs text-on-surface-variant mt-xs">
              Currently: <span class="font-bold">{{ rescheduleTarget.scheduledDate }}</span>
            </p>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">New Scheduled Date *</label>
            <input type="date" [(ngModel)]="rescheduleDate" [min]="todayIso"
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                          focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showReschedule=false"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="confirmReschedule()" [disabled]="savingVacc() || !rescheduleDate"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90
                           disabled:opacity-60 flex items-center justify-center gap-xs">
              @if (savingVacc()) {
                <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>Saving...
              } @else {
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">event</span>
                Reschedule
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  }

    <!-- ════════ SCHEDULE VACCINATION MODAL ════════ -->
  @if (showVaccForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Schedule Vaccination</h3>
          <button (click)="showVaccForm=false; resetVaccForm()"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Flock Batch *</label>
              <select [(ngModel)]="vaccForm.batch"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select batch...</option>
                @for (b of batches; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Building *</label>
              <select [(ngModel)]="vaccForm.building"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select building...</option>
                @for (b of buildings; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Vaccine Name *</label>
              <input [(ngModel)]="vaccForm.vaccineName" placeholder="e.g. Newcastle Stage 3"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Scheduled Date *</label>
              <input type="date" [(ngModel)]="vaccForm.scheduledDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
          </div>
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showVaccForm=false; resetVaccForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitVacc()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Schedule Vaccination
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- Toast -->
  @if (toast()) {
    <div class="fixed bottom-lg right-lg bg-on-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-lg flex items-center gap-sm z-50">
      <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">check_circle</span>
      {{ toast() }}
    </div>
  }
</div>
  `,
})
export class HealthComponent implements OnInit {
  private healthSvc = inject(HealthService);
  private notifSvc  = inject(NotificationService);

  today     = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  todayIso  = new Date().toISOString().split('T')[0];
  activeTab = 'medicine';
  batches   = BATCHES;
  buildings = BUILDINGS;
  staff     = STAFF;
  suppliers = SUPPLIERS;

  medicines    = signal<MedicineStock[]>(INITIAL_MEDICINES);
  treatments   = signal<TreatmentRecord[]>(INITIAL_TREATMENTS);
  vaccinations = signal<VaccRecord[]>(INITIAL_VACCINATIONS);
  toast        = signal('');

  // Filters
  medSearch      = '';
  medTypeFilter  = '';
  medStockFilter = 'all';
  vaccFilter     = 'All';

  // Modal visibility
  showRestockForm  = false;
  showTreatForm    = false;
  showMarkDoneForm = false;
  showVaccForm     = false;
  markDoneTarget: VaccRecord | null = null;

  // Errors
  restockError  = signal('');
  treatError    = signal('');

  // Vaccination saving states
  savingVacc     = signal(false);
  vaccApiError   = signal('');
  showReschedule = false;
  rescheduleTarget: VaccRecord | null = null;
  rescheduleDate = '';

  // Form data
  restockForm = { medicineId:null as number|null, supplier:'', quantity:0, costPerUnit:0, batchNo:'', expiryDate:'', receivedBy:'', receivedDate:new Date().toISOString().split('T')[0] };
  treatForm   = { batch:'', building:'', medicineId:null as number|null, administeredBy:'', dosage:'', durationDays:5, affectedCount:0, symptoms:'', diagnosis:'' };
  markDoneForm = { administeredBy:'', batchNo:'', notes:'' };
  vaccForm     = { batch:'', building:'', vaccineName:'', scheduledDate:'' };

  private nextTreatId = 3;
  private nextVaccId  = 6;

  // ── Computed ────────────────────────────────────────────────────────────────
  tabs = computed(() => [
    { key:'medicine',    label:'Medicine Stock', icon:'medication',  badge: this.lowMedCount() },
    { key:'treatments',  label:'Treatments',     icon:'healing',     badge: this.activeWithdrawals().length },
    { key:'vaccinations',label:'Vaccinations',   icon:'vaccines',    badge: this.overdueCount() },
  ]);

  healthAlerts = computed((): HealthAlert[] => {
    const alerts: HealthAlert[] = [];
    if (this.overdueCount() > 0)
      alerts.push({ id:1, level:'critical', icon:'vaccines', title:`${this.overdueCount()} vaccination(s) overdue`, desc:'Immediate action required — schedule with vet immediately.' });
    if (this.activeWithdrawals().length > 0)
      alerts.push({ id:2, level:'warning', icon:'schedule', title:'Active withdrawal period(s)', desc:`${this.activeWithdrawals().length} batch(es) under withdrawal — eggs must not be sold or consumed.` });
    const lowMeds = this.medicines().filter(m => m.stockPct < 25);
    if (lowMeds.length > 0)
      alerts.push({ id:3, level:'warning', icon:'medication', title:`${lowMeds.length} medicine(s) low`, desc:'Restock before next treatment cycle: ' + lowMeds.map(m=>m.name).join(', ') });
    const expiring = this.medicines().filter(m => this.isExpiringSoon(m.expiryDate));
    if (expiring.length > 0)
      alerts.push({ id:4, level:'info', icon:'schedule', title:`${expiring.length} medicine(s) expiring within 30 days`, desc:expiring.map(m=>m.name).join(', ') });
    return alerts;
  });

  healthKpis = computed(() => [
    { label:'Total Medicines', value: this.medicines().length.toString(),              color:'text-primary'   },
    { label:'Low Stock',       value: this.lowMedCount().toString(),                   color:'text-error'     },
    { label:'Overdue Vaccs',   value: this.overdueCount().toString(),                  color:'text-error'     },
    { label:'Under Withdrawal',value: this.activeWithdrawals().length.toString(),      color:'text-secondary' },
    { label:'Stock Value',     value:'₱'+this.totalMedValue().toLocaleString(),        color:'text-primary'   },
  ]);

  vaccKpis = computed(() => {
    const v = this.vaccinations();
    return [
      { label:'Total',    value: v.length,                                    color:'text-primary'   },
      { label:'Completed',value: v.filter(x=>x.status==='completed').length,  color:'text-primary'   },
      { label:'Scheduled',value: v.filter(x=>x.status==='scheduled').length,  color:'text-secondary' },
      { label:'Overdue',  value: v.filter(x=>x.status==='overdue').length,    color:'text-error'     },
    ];
  });

  activeWithdrawals  = computed(() => this.treatments().filter(t => t.withdrawalEnds));
  overdueCount       = computed(() => this.vaccinations().filter(v => v.status === 'overdue').length);
  lowMedCount        = computed(() => this.medicines().filter(m => m.stockPct < 25).length);
  totalMedValue      = computed(() => this.medicines().reduce((s,m) => s + m.stock * m.costPerUnit, 0));

  selectedMedWithdrawal = computed(() => {
    const med = this.medicines().find(m => m.id === this.treatForm.medicineId);
    return med?.withdrawalDays ?? 0;
  });

  filteredMedicines = computed(() =>
    this.medicines().filter(m => {
      const q = this.medSearch.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !m.supplier.toLowerCase().includes(q)) return false;
      if (this.medTypeFilter && m.type !== this.medTypeFilter) return false;
      if (this.medStockFilter === 'low'     && m.stockPct >= 25)           return false;
      if (this.medStockFilter === 'expiring'&& !this.isExpiringSoon(m.expiryDate)) return false;
      return true;
    })
  );

  filteredVaccinations = computed(() => {
    const v = this.vaccinations();
    if (this.vaccFilter === 'All') return v;
    return v.filter(x => x.status === this.vaccFilter.toLowerCase());
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.healthSvc.getMedicines().subscribe({ next:(data:any) => { if (data?.length) this.medicines.set(data.map((m:any) => ({ ...m, stockPct: Math.round((m.stock / (m.maxStock||200)) * 100) }))); }, error:()=>{} });
    this.healthSvc.getVaccinations().subscribe({ next:(data:any) => { if (data?.length) this.vaccinations.set(data); }, error:()=>{} });
    this.healthSvc.getTreatments().subscribe({ next:(data:any) => { if (data?.length) this.treatments.set(data); }, error:()=>{} });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  medStockLevel(m: MedicineStock): string {
    return m.stockPct < 15 ? 'critical' : m.stockPct < 25 ? 'low' : 'ok';
  }

  isExpiringSoon(date: string): boolean {
    return (new Date(date).getTime() - Date.now()) < 30 * 86400000;
  }

  getMedType(id: number): MedType {
    return this.medicines().find(m=>m.id===id)?.type ?? 'Vitamin';
  }

  medIconBg(type: MedType): string {
    const map: Record<MedType, string> = {
      Vaccine:'bg-primary-fixed text-on-primary-fixed-variant',
      Antibiotic:'bg-error-container text-on-error-container',
      Vitamin:'bg-secondary-fixed text-on-secondary-fixed-variant',
      Antifungal:'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      Antiparasitic:'bg-primary-container text-on-primary-container',
    };
    return map[type];
  }

  medTypeBadge(type: MedType): string { return this.medIconBg(type); }

  // ── Quick actions ────────────────────────────────────────────────────────────
  useMedicine(med: MedicineStock): void {
    this.treatForm.medicineId = med.id;
    this.activeTab  = 'treatments';
    this.showTreatForm = true;
  }

  restockUnit(): string {
    return this.medicines().find(m => m.id === this.restockForm.medicineId)?.unit ?? 'unit';
  }

  restockMedicine(med: MedicineStock): void {
    this.restockForm.medicineId  = med.id;
    this.restockForm.supplier    = med.supplier;
    this.restockForm.costPerUnit = med.costPerUnit;
    this.showRestockForm = true;
  }

  // ── Restock ──────────────────────────────────────────────────────────────────
  submitRestock(): void {
    if (!this.restockForm.medicineId) { this.restockError.set('Select a medicine.');   return; }
    if (!this.restockForm.supplier)   { this.restockError.set('Select a supplier.');   return; }
    if (this.restockForm.quantity <= 0) { this.restockError.set('Enter quantity > 0.'); return; }
    if (!this.restockForm.expiryDate) { this.restockError.set('Enter expiry date.');   return; }

    const med = this.medicines().find(m => m.id === this.restockForm.medicineId)!;
    const newStock = med.stock + this.restockForm.quantity;

    this.medicines.update(list => list.map(m => m.id === this.restockForm.medicineId
      ? { ...m, stock: newStock, stockPct: Math.min(100, Math.round((newStock / m.maxStock) * 100)),
          expiryDate: this.restockForm.expiryDate || m.expiryDate,
          costPerUnit: this.restockForm.costPerUnit || m.costPerUnit,
          supplier: this.restockForm.supplier }
      : m
    ));

    this.showRestockForm = false;
    this.resetRestockForm();
    this.showToast(`${this.restockForm.quantity || ''} ${med.unit} of ${med.name} added to stock.`);
  }

  resetRestockForm(): void {
    this.restockForm = { medicineId:null, supplier:'', quantity:0, costPerUnit:0, batchNo:'', expiryDate:'', receivedBy:'', receivedDate:new Date().toISOString().split('T')[0] };
    this.restockError.set('');
  }

  // ── Treatment ────────────────────────────────────────────────────────────────
  onMedicineSelect(): void {
    const med = this.medicines().find(m => m.id === this.treatForm.medicineId);
    if (med && med.stock > 0) {
      // Auto-deduct one unit of medicine stock
    }
  }

  submitTreatment(): void {
    if (!this.treatForm.batch)          { this.treatError.set('Select a batch.');      return; }
    if (!this.treatForm.medicineId)     { this.treatError.set('Select a medicine.');   return; }
    if (!this.treatForm.administeredBy) { this.treatError.set('Select who administered.'); return; }
    if (!this.treatForm.dosage)         { this.treatError.set('Enter dosage.');         return; }
    if (!this.treatForm.symptoms)       { this.treatError.set('Describe symptoms.');   return; }

    const med = this.medicines().find(m => m.id === this.treatForm.medicineId)!;
    const wdEnd = med.withdrawalDays > 0
      ? new Date(Date.now() + med.withdrawalDays * 86400000).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})
      : undefined;

    this.treatments.update(list => [{
      id: this.nextTreatId++,
      batch:           this.treatForm.batch,
      building:        this.treatForm.building || 'Unknown',
      medicineId:      this.treatForm.medicineId!,
      medicineName:    med.name,
      dosage:          this.treatForm.dosage,
      durationDays:    this.treatForm.durationDays,
      administeredAt:  'Just now',
      administeredBy:  this.treatForm.administeredBy,
      symptoms:        this.treatForm.symptoms,
      diagnosis:       this.treatForm.diagnosis,
      withdrawalDays:  med.withdrawalDays,
      withdrawalEnds:  wdEnd,
      affectedCount:   this.treatForm.affectedCount || 0,
    }, ...list]);

    // Deduct medicine stock
    this.medicines.update(list => list.map(m => m.id === this.treatForm.medicineId
      ? { ...m, stock: Math.max(0, m.stock - 1),
          stockPct: Math.max(0, Math.round(((m.stock - 1) / m.maxStock) * 100)) }
      : m
    ));

    this.healthSvc.logTreatment({ flock_batch_id: 1, medicine_id: this.treatForm.medicineId!, dosage_ml: 10, administered_at: new Date().toISOString(), symptoms: this.treatForm.symptoms, diagnosis: this.treatForm.diagnosis }).subscribe();
    if (med.withdrawalDays > 0) {
      this.notifSvc.push({
        level:    'warning',
        category: 'health',
        icon:     'schedule',
        title:    `Withdrawal Period Started — ${this.treatForm.batch}`,
        message:  `${med.name} administered. Eggs from ${this.treatForm.batch} must not be sold for ${med.withdrawalDays} days.`,
        route:    '/health',
        batch:    this.treatForm.batch,
        building: this.treatForm.building,
        forRoles: ['admin','manager','supervisor','worker'],
      });
    }

    this.showTreatForm = false;
    this.resetTreatForm();
    this.showToast(`Treatment with ${med.name} logged successfully.`);
  }

  resetTreatForm(): void {
    this.treatForm = { batch:'', building:'', medicineId:null, administeredBy:'', dosage:'', durationDays:5, affectedCount:0, symptoms:'', diagnosis:'' };
    this.treatError.set('');
  }

  // ── Vaccination ──────────────────────────────────────────────────────────────
  openMarkDone(v: VaccRecord): void { this.markDoneTarget = v; this.showMarkDoneForm = true; }

  confirmMarkDone(): void {
    if (!this.markDoneTarget || !this.markDoneForm.administeredBy) {
      this.vaccApiError.set('Please select who administered the vaccination.');
      return;
    }
    const id = this.markDoneTarget.id;
    this.savingVacc.set(true);
    this.vaccApiError.set('');

    this.healthSvc.markVaccinationDone(
      id,
      this.markDoneForm.administeredBy,
      this.markDoneForm.batchNo,
      this.markDoneForm.notes
    ).subscribe({
      next: (res: any) => {
        // Use server-returned data if available, otherwise use form values
        this.vaccinations.update(list => list.map(v => v.id === id
          ? {
              ...v,
              status:         'completed' as VaccStatus,
              completedDate:  res?.completed_date  ?? res?.completedDate  ?? 'Today',
              administeredBy: res?.administered_by ?? res?.administeredBy ?? this.markDoneForm.administeredBy,
              batchNo:        res?.batch_no        ?? res?.batchNo        ?? this.markDoneForm.batchNo,
              notes:          res?.notes ?? this.markDoneForm.notes,
            }
          : v
        ));
        this.finishMarkDone();
      },
      error: () => {
        // Optimistic update — mark done locally even if API fails
        this.vaccinations.update(list => list.map(v => v.id === id
          ? { ...v, status:'completed' as VaccStatus, completedDate:'Today',
              administeredBy: this.markDoneForm.administeredBy || 'Staff',
              batchNo: this.markDoneForm.batchNo, notes: this.markDoneForm.notes }
          : v
        ));
        this.finishMarkDone();
      },
    });
  }

  private finishMarkDone(): void {
    this.savingVacc.set(false);
    this.showMarkDoneForm = false;
    this.markDoneTarget   = null;
    this.markDoneForm     = { administeredBy:'', batchNo:'', notes:'' };
    this.showToast('Vaccination marked as completed.');
    // Push notification to supervisors and managers
    this.notifSvc?.push?.({
      level:    'success',
      category: 'vaccination',
      icon:     'vaccines',
      title:    'Vaccination Completed',
      message:  `Vaccination marked done by ${this.markDoneForm.administeredBy || 'Staff'}.`,
      route:    '/health',
      forRoles: ['admin','manager','supervisor'],
    });
  }

  rescheduleVacc(v: VaccRecord): void {
    this.rescheduleTarget = v;
    this.rescheduleDate   = new Date().toISOString().split('T')[0];
    this.showReschedule   = true;
  }

  confirmReschedule(): void {
    if (!this.rescheduleTarget || !this.rescheduleDate) return;
    const id      = this.rescheduleTarget.id;
    const newDate = this.rescheduleDate;
    this.savingVacc.set(true);

    // Update via API (use generic put via healthSvc base)
    this.healthSvc.updateVaccination(id, { scheduled_date: newDate, status: 'scheduled' }).subscribe({
      next:  () => this.applyReschedule(id, newDate),
      error: () => this.applyReschedule(id, newDate),
    });
  }

  private applyReschedule(id: number, newDate: string): void {
    const d = new Date(newDate);
    const label = d.toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric' });
    this.vaccinations.update(list => list.map(x => x.id === id
      ? { ...x, scheduledDate: label, status:'scheduled' as VaccStatus }
      : x
    ));
    this.savingVacc.set(false);
    this.showReschedule  = false;
    this.rescheduleTarget = null;
    this.showToast('Vaccination rescheduled to ' + label + '.');
  }

  submitVacc(): void {
    if (!this.vaccForm.batch)         { return; }
    if (!this.vaccForm.vaccineName)   { return; }
    if (!this.vaccForm.scheduledDate) { return; }
    this.savingVacc.set(true);

    // Map batch code to a batch ID (1-5 based on code suffix)
    const batchIdMap: Record<string, number> = {
      'B-2024-001': 1, 'B-2024-002': 2, 'B-2024-003': 3,
      'B-2024-004': 4, 'B-2024-005': 5,
    };
    const batchId = batchIdMap[this.vaccForm.batch] ?? 1;

    this.healthSvc.scheduleVaccination({
      flock_batch_id: batchId,
      vaccine_name:   this.vaccForm.vaccineName,
      scheduled_date: this.vaccForm.scheduledDate,
      building:       this.vaccForm.building || undefined,
    }).subscribe({
      next: (res: any) => {
        this.addVaccToList(res?.id);
      },
      error: () => {
        // Optimistic local add if API fails
        this.addVaccToList(undefined);
      },
    });
  }

  private addVaccToList(serverId?: number): void {
    const d     = new Date(this.vaccForm.scheduledDate);
    const now   = new Date();
    const label = d >= now
      ? d.toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric' })
      : 'Overdue';

    this.vaccinations.update(list => [{
      id:            serverId ?? this.nextVaccId++,
      batch:         this.vaccForm.batch,
      building:      this.vaccForm.building || 'Unknown',
      vaccineName:   this.vaccForm.vaccineName,
      scheduledDate: label,
      status:        (d < now ? 'overdue' : 'scheduled') as VaccStatus,
    }, ...list]);

    this.savingVacc.set(false);
    this.showVaccForm = false;
    this.resetVaccForm();
    this.showToast('Vaccination scheduled successfully.');
  }

  resetVaccForm(): void {
    this.vaccForm = { batch:'', building:'', vaccineName:'', scheduledDate:'' };
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 4000);
  }
}

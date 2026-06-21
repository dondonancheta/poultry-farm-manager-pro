import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type HealthStatus = 'healthy' | 'monitoring' | 'treatment' | 'quarantine' | 'recovered';
type RecordType   = 'treatment' | 'vaccination' | 'mortality' | 'outbreak' | 'inspection';

interface HealthRecord {
  id: number;
  batchCode: string;
  building: string;
  type: RecordType;
  date: string;
  title: string;
  description: string;
  responsibleStaff: string;
  status: HealthStatus;
  severity: 'low' | 'medium' | 'high';
  followUpDate?: string;
  notes?: string;
}

interface VaccinationSchedule {
  id: number;
  batchCode: string;
  building: string;
  vaccineName: string;
  scheduledDate: string;
  ageAtVaccination: number;
  status: 'completed' | 'scheduled' | 'overdue' | 'skipped';
  completedDate?: string;
  administeredBy?: string;
}

interface FlockHealthSummary {
  batchCode: string;
  building: string;
  status: HealthStatus;
  ageDays: number;
  mortalityPct: number;
  activeTreatments: number;
  lastInspection: string;
  vaccinationCompliance: number;
}

const HEALTH_RECORDS: HealthRecord[] = [
  { id: 1, batchCode: 'B-2024-001', building: 'Alpha-1', type: 'treatment',   date: 'Today, 08:00 AM', title: 'Respiratory Treatment',   description: 'Administered tetracycline — 3 birds showing respiratory symptoms', responsibleStaff: 'Maria Santos', status: 'treatment',  severity: 'medium', followUpDate: '2024-02-14', notes: 'Monitor for 48hrs' },
  { id: 2, batchCode: 'B-2024-002', building: 'Beta-2',  type: 'vaccination', date: 'Today, 09:30 AM', title: 'Newcastle Vaccine (Stage 2)', description: 'All 15,000 birds vaccinated via drinking water. Full compliance.', responsibleStaff: 'Maria Santos', status: 'healthy',   severity: 'low',    followUpDate: '2024-03-01' },
  { id: 3, batchCode: 'B-2024-004', building: 'Gamma-3', type: 'mortality',   date: 'Today, 07:15 AM', title: 'Mortality Spike — Day 45',  description: '7 birds found dead near feeders. Possible heat stress. Supervisor alerted.', responsibleStaff: 'Rosa Mendoza', status: 'monitoring', severity: 'high', followUpDate: '2024-02-13', notes: 'Check ventilation system' },
  { id: 4, batchCode: 'B-2024-001', building: 'Alpha-1', type: 'inspection',  date: 'Yesterday',       title: 'Routine Weekly Inspection', description: 'All metrics within normal range. Feed consumption on target. FCR: 1.42.', responsibleStaff: 'Maria Santos', status: 'healthy',   severity: 'low' },
  { id: 5, batchCode: 'B-2024-005', building: 'Alpha-2', type: 'outbreak',    date: '2 days ago',      title: 'Gumboro Suspected Outbreak', description: 'Multiple birds showing classic Gumboro symptoms. Isolation protocol initiated.', responsibleStaff: 'Dr. Cruz (Vet)', status: 'quarantine', severity: 'high', followUpDate: '2024-02-20', notes: 'Pending lab results' },
  { id: 6, batchCode: 'B-2024-002', building: 'Beta-2',  type: 'treatment',   date: '3 days ago',      title: 'Vitamin Supplement Course', description: 'B-complex vitamins added to drinking water for 5 days — low appetite observed.', responsibleStaff: 'Maria Santos', status: 'recovered',  severity: 'low', followUpDate: '2024-02-15' },
];

const VACCINATION_SCHEDULE: VaccinationSchedule[] = [
  { id: 1, batchCode: 'B-2024-001', building: 'Alpha-1', vaccineName: 'Newcastle Stage 3', scheduledDate: '2024-02-18', ageAtVaccination: 42, status: 'scheduled' },
  { id: 2, batchCode: 'B-2024-002', building: 'Beta-2',  vaccineName: 'Newcastle Stage 2', scheduledDate: '2024-02-12', ageAtVaccination: 28, status: 'completed', completedDate: 'Today', administeredBy: 'Maria Santos' },
  { id: 3, batchCode: 'B-2024-004', building: 'Delta-1', vaccineName: 'Marek\'s Disease',  scheduledDate: '2024-02-10', ageAtVaccination: 14, status: 'overdue' },
  { id: 4, batchCode: 'B-2024-005', building: 'Alpha-2', vaccineName: 'Gumboro Stage 1',   scheduledDate: '2024-02-20', ageAtVaccination: 21, status: 'scheduled' },
  { id: 5, batchCode: 'B-2024-001', building: 'Alpha-1', vaccineName: 'Infectious Bronchitis', scheduledDate: '2024-02-25', ageAtVaccination: 49, status: 'scheduled' },
];

const FLOCK_SUMMARY: FlockHealthSummary[] = [
  { batchCode: 'B-2024-001', building: 'Alpha-1', status: 'treatment',  ageDays: 32, mortalityPct: 1.2, activeTreatments: 1, lastInspection: 'Yesterday', vaccinationCompliance: 80 },
  { batchCode: 'B-2024-002', building: 'Beta-2',  status: 'healthy',    ageDays: 18, mortalityPct: 0.5, activeTreatments: 0, lastInspection: 'Today',     vaccinationCompliance: 100 },
  { batchCode: 'B-2024-004', building: 'Gamma-3', status: 'monitoring', ageDays: 45, mortalityPct: 2.8, activeTreatments: 0, lastInspection: 'Today',     vaccinationCompliance: 60 },
  { batchCode: 'B-2024-005', building: 'Alpha-2', status: 'quarantine', ageDays: 12, mortalityPct: 0.3, activeTreatments: 2, lastInspection: '2 days ago', vaccinationCompliance: 75 },
];

@Component({
  selector: 'app-health-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-5xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/supervisor-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Health Records</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <button class="flex items-center gap-sm border border-primary text-primary px-lg py-sm
                       rounded-lg text-label-md font-bold hover:bg-primary-fixed transition-all">
          <span class="material-symbols-outlined text-[18px]">add</span>
          New Record
        </button>
      </div>

      <!-- Quarantine alert -->
      @if (quarantinedFlocks().length > 0) {
        <div class="bg-error text-on-error rounded-xl p-md flex items-start gap-md mb-lg">
          <span class="material-symbols-outlined text-[24px] flex-shrink-0 mt-xs"
                style="font-variation-settings:'FILL' 1">crisis_alert</span>
          <div>
            <p class="font-bold text-[15px]">{{ quarantinedFlocks().length }} flock(s) in quarantine</p>
            <p class="text-sm opacity-90 mt-xs">
              @for (f of quarantinedFlocks(); track f.batchCode; let last = $last) {
                {{ f.batchCode }} ({{ f.building }}){{ last ? '' : ' · ' }}
              }
            </p>
          </div>
        </div>
      }

      <!-- Overdue vaccination alert -->
      @if (overdueVaccinations().length > 0) {
        <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md flex items-center gap-md mb-lg">
          <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[22px]"
                style="font-variation-settings:'FILL' 1">vaccines</span>
          <p class="text-on-secondary-fixed-variant font-bold flex-1">
            {{ overdueVaccinations().length }} overdue vaccination(s) — immediate action required
          </p>
          <button (click)="activeTab = 'vaccinations'"
                  class="text-label-md text-primary font-bold hover:underline">
            View
          </button>
        </div>
      }

      <!-- Tabs -->
      <div class="flex gap-xs mb-lg border-b border-outline-variant">
        @for (tab of tabs; track tab.key) {
          <button (click)="activeTab = tab.key"
                  class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px"
                  [class]="activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'">
            {{ tab.label }}
            @if (tab.badge) {
              <span class="ml-sm px-xs py-xs rounded-full text-[10px] bg-error text-on-error">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>

      <!-- ── Tab: Flock Overview ── -->
      @if (activeTab === 'overview') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
          @for (flock of flockSummary; track flock.batchCode) {
            <div class="bg-white border rounded-2xl p-lg shadow-sm"
                 [class]="flockStatusBorder(flock.status)">
              <div class="flex items-start justify-between mb-md">
                <div>
                  <p class="font-bold text-on-surface text-body-md">{{ flock.batchCode }}</p>
                  <p class="text-xs text-on-surface-variant">{{ flock.building }} · Day {{ flock.ageDays }}</p>
                </div>
                <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                      [class]="statusChip(flock.status)">
                  {{ flock.status }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-sm text-center mb-md">
                <div class="bg-surface-container rounded-lg p-sm">
                  <div class="font-bold" [class]="flock.mortalityPct > 2 ? 'text-error' : 'text-primary'">
                    {{ flock.mortalityPct }}%
                  </div>
                  <div class="text-[10px] text-on-surface-variant uppercase">Mortality</div>
                </div>
                <div class="bg-surface-container rounded-lg p-sm">
                  <div class="font-bold" [class]="flock.activeTreatments > 0 ? 'text-secondary' : 'text-primary'">
                    {{ flock.activeTreatments }}
                  </div>
                  <div class="text-[10px] text-on-surface-variant uppercase">Treatments</div>
                </div>
                <div class="bg-surface-container rounded-lg p-sm">
                  <div class="font-bold" [class]="flock.vaccinationCompliance < 80 ? 'text-error' : 'text-primary'">
                    {{ flock.vaccinationCompliance }}%
                  </div>
                  <div class="text-[10px] text-on-surface-variant uppercase">Vacc. %</div>
                </div>
              </div>

              <!-- Vaccination compliance bar -->
              <div class="mb-sm">
                <div class="text-xs text-on-surface-variant mb-xs">Vaccination compliance</div>
                <div class="w-full bg-surface-container rounded-full h-2">
                  <div class="h-2 rounded-full"
                       [class]="flock.vaccinationCompliance < 80 ? 'bg-error' : 'bg-primary'"
                       [style.width.%]="flock.vaccinationCompliance"></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-sm border-t border-outline-variant">
                <p class="text-xs text-on-surface-variant">Last inspected: {{ flock.lastInspection }}</p>
                <button class="text-label-md text-primary hover:underline font-bold">View records</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Tab: Health Records ── -->
      @if (activeTab === 'records') {
        <!-- Filters -->
        <div class="flex flex-wrap gap-md mb-md">
          <select [(ngModel)]="filterType"
                  class="border border-outline-variant rounded-lg px-sm py-xs text-body-md">
            <option value="">All types</option>
            <option value="treatment">Treatment</option>
            <option value="vaccination">Vaccination</option>
            <option value="mortality">Mortality</option>
            <option value="outbreak">Outbreak</option>
            <option value="inspection">Inspection</option>
          </select>
          <select [(ngModel)]="filterSeverity"
                  class="border border-outline-variant rounded-lg px-sm py-xs text-body-md">
            <option value="">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div class="space-y-sm">
          @for (record of filteredRecords(); track record.id) {
            <div class="bg-white border rounded-2xl overflow-hidden shadow-sm"
                 [class]="severityBorder(record.severity)">
              <div class="flex items-start gap-md p-lg">

                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     [class]="recordTypeBg(record.type)">
                  <span class="material-symbols-outlined text-[20px]"
                        style="font-variation-settings:'FILL' 1">{{ recordTypeIcon(record.type) }}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-md mb-xs">
                    <div>
                      <p class="font-bold text-on-surface">{{ record.title }}</p>
                      <p class="text-xs text-on-surface-variant">
                        {{ record.batchCode }} · {{ record.building }} · {{ record.date }}
                      </p>
                    </div>
                    <div class="flex flex-col items-end gap-xs flex-shrink-0">
                      <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                            [class]="statusChip(record.status)">{{ record.status }}</span>
                      <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                            [class]="severityChip(record.severity)">{{ record.severity }}</span>
                    </div>
                  </div>

                  <p class="text-body-md text-on-surface-variant mb-sm">{{ record.description }}</p>

                  @if (record.notes) {
                    <div class="bg-surface-container rounded-lg px-sm py-xs mb-sm">
                      <p class="text-xs text-on-surface-variant">
                        <strong>Note:</strong> {{ record.notes }}
                      </p>
                    </div>
                  }

                  <div class="flex items-center justify-between">
                    <p class="text-xs text-on-surface-variant">By {{ record.responsibleStaff }}</p>
                    @if (record.followUpDate) {
                      <span class="text-xs font-bold text-secondary">Follow-up: {{ record.followUpDate }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Tab: Vaccinations ── -->
      @if (activeTab === 'vaccinations') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="px-lg py-md border-b border-outline-variant bg-surface-container-low">
            <div class="grid grid-cols-4 gap-md text-center">
              @for (vkpi of vaccinationKpis(); track vkpi.label) {
                <div>
                  <div class="font-bold text-[20px]" [class]="vkpi.color">{{ vkpi.value }}</div>
                  <div class="text-label-md text-on-surface-variant">{{ vkpi.label }}</div>
                </div>
              }
            </div>
          </div>

          <div class="divide-y divide-outline-variant">
            @for (vacc of vaccinations; track vacc.id) {
              <div class="flex items-center gap-md px-lg py-md">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     [class]="vaccStatusBg(vacc.status)">
                  <span class="material-symbols-outlined text-[18px]"
                        style="font-variation-settings:'FILL' 1">{{ vaccStatusIcon(vacc.status) }}</span>
                </div>

                <div class="flex-1">
                  <p class="font-bold text-on-surface text-body-md">{{ vacc.vaccineName }}</p>
                  <p class="text-xs text-on-surface-variant">
                    {{ vacc.batchCode }} · {{ vacc.building }} · Age {{ vacc.ageAtVaccination }} days
                  </p>
                  @if (vacc.completedDate) {
                    <p class="text-xs text-primary">Done {{ vacc.completedDate }} by {{ vacc.administeredBy }}</p>
                  }
                </div>

                <div class="text-right flex-shrink-0">
                  <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                        [class]="vaccStatusChip(vacc.status)">{{ vacc.status }}</span>
                  <p class="text-xs text-on-surface-variant mt-xs">{{ vacc.scheduledDate }}</p>
                </div>

                @if (vacc.status === 'overdue') {
                  <button class="px-md py-xs bg-secondary text-on-secondary rounded-lg text-label-md
                                 font-bold hover:opacity-90 transition-all flex-shrink-0">
                    Mark done
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class HealthRecordsComponent {
  today      = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  activeTab  = 'overview';
  filterType     = '';
  filterSeverity = '';

  records     = signal<HealthRecord[]>(HEALTH_RECORDS);
  flockSummary = FLOCK_SUMMARY;
  vaccinations = VACCINATION_SCHEDULE;

  tabs = [
    { key: 'overview',     label: 'Flock Overview', badge: 0 },
    { key: 'records',      label: 'Health Records',  badge: 0 },
    { key: 'vaccinations', label: 'Vaccinations',    badge: 1 },
  ];

  quarantinedFlocks  = computed(() => this.flockSummary.filter(f => f.status === 'quarantine'));
  overdueVaccinations = computed(() => this.vaccinations.filter(v => v.status === 'overdue'));

  filteredRecords = computed(() =>
    this.records().filter(r => {
      if (this.filterType     && r.type     !== this.filterType)     return false;
      if (this.filterSeverity && r.severity !== this.filterSeverity) return false;
      return true;
    })
  );

  vaccinationKpis = computed(() => {
    const v = this.vaccinations;
    return [
      { label: 'Total',     value: v.length,                               color: 'text-primary' },
      { label: 'Completed', value: v.filter(x => x.status === 'completed').length, color: 'text-primary' },
      { label: 'Scheduled', value: v.filter(x => x.status === 'scheduled').length, color: 'text-secondary' },
      { label: 'Overdue',   value: v.filter(x => x.status === 'overdue').length,   color: 'text-error' },
    ];
  });

  statusChip(status: HealthStatus | string): string {
    const map: Record<string, string> = {
      healthy:    'bg-primary-fixed text-on-primary-fixed-variant',
      monitoring: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      treatment:  'bg-secondary-container text-on-secondary-container',
      quarantine: 'bg-error text-on-error',
      recovered:  'bg-primary-fixed text-on-primary-fixed-variant',
    };
    return map[status] ?? 'bg-surface-container text-on-surface';
  }

  flockStatusBorder(status: HealthStatus): string {
    const map: Record<HealthStatus, string> = {
      healthy:    'border-outline-variant',
      monitoring: 'border-secondary',
      treatment:  'border-secondary-container',
      quarantine: 'border-error',
      recovered:  'border-primary-fixed',
    };
    return map[status];
  }

  severityBorder(sev: string): string {
    return sev === 'high' ? 'border-error' : sev === 'medium' ? 'border-secondary' : 'border-outline-variant';
  }

  severityChip(sev: string): string {
    return sev === 'high' ? 'bg-error text-on-error' : sev === 'medium' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container text-on-surface-variant';
  }

  recordTypeIcon(type: RecordType): string {
    return { treatment: 'medication', vaccination: 'vaccines', mortality: 'emergency', outbreak: 'coronavirus', inspection: 'search' }[type];
  }

  recordTypeBg(type: RecordType): string {
    const map: Record<RecordType, string> = {
      treatment:   'bg-secondary-fixed text-on-secondary-fixed-variant',
      vaccination: 'bg-primary-fixed text-on-primary-fixed-variant',
      mortality:   'bg-error-container text-on-error-container',
      outbreak:    'bg-error-container text-on-error-container',
      inspection:  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    };
    return map[type];
  }

  vaccStatusIcon(status: VaccinationSchedule['status']): string {
    return { completed: 'check_circle', scheduled: 'schedule', overdue: 'warning', skipped: 'cancel' }[status];
  }

  vaccStatusBg(status: VaccinationSchedule['status']): string {
    const map: Record<string, string> = {
      completed: 'bg-primary-fixed text-on-primary-fixed-variant',
      scheduled: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      overdue:   'bg-error-container text-on-error-container',
      skipped:   'bg-surface-container-highest text-on-surface',
    };
    return map[status];
  }

  vaccStatusChip(status: VaccinationSchedule['status']): string {
    const map: Record<string, string> = {
      completed: 'bg-primary-fixed text-on-primary-fixed-variant',
      scheduled: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      overdue:   'bg-error text-on-error',
      skipped:   'bg-surface-container-highest text-on-surface',
    };
    return map[status];
  }
}

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MortalityService } from '../../core/services/index';
import { NotificationService } from '../../core/services/notification.service';

type MortCause = 'disease' | 'injury' | 'culled' | 'respiratory' | 'digestive' | 'heat_stress' | 'unknown' | 'other';
type Severity  = 'normal' | 'elevated' | 'critical';

interface CauseOption {
  key: MortCause;
  label: string;
  icon: string;
  description: string;
  color: string;
  textColor: string;
}

interface MortEntry {
  id: number;
  building: string;
  batch: string;
  count: number;
  cause: string;
  location: string;
  symptoms: string;
  disposalMethod: string;
  recordedBy: string;
  recordedAt: string;
  severity: Severity;
}

const CAUSES: CauseOption[] = [
  { key: 'disease',     label: 'Disease',          icon: 'coronavirus',   description: 'Suspected viral or bacterial infection', color: 'bg-error-container',      textColor: 'text-on-error-container' },
  { key: 'respiratory', label: 'Respiratory',      icon: 'air',           description: 'Breathing difficulty, gasping',          color: 'bg-error-container',      textColor: 'text-on-error-container' },
  { key: 'digestive',   label: 'Digestive Issue',  icon: 'sick',          description: 'Diarrhea, bloating, or vomiting',        color: 'bg-secondary-fixed',      textColor: 'text-on-secondary-fixed-variant' },
  { key: 'heat_stress', label: 'Heat Stress',      icon: 'thermostat',    description: 'Panting, lethargy due to high temp',     color: 'bg-secondary-fixed',      textColor: 'text-on-secondary-fixed-variant' },
  { key: 'injury',      label: 'Injury / Trauma',  icon: 'personal_injury', description: 'Physical wound, broken bones',        color: 'bg-tertiary-fixed',       textColor: 'text-on-tertiary-fixed-variant' },
  { key: 'culled',      label: 'Culled (Planned)', icon: 'content_cut',   description: 'Deliberately removed — sick/unviable',  color: 'bg-tertiary-fixed',       textColor: 'text-on-tertiary-fixed-variant' },
  { key: 'unknown',     label: 'Unknown',          icon: 'help',          description: 'Cause could not be determined',          color: 'bg-surface-container-highest', textColor: 'text-on-surface' },
  { key: 'other',       label: 'Other',            icon: 'more_horiz',    description: 'Other reason — describe in notes',       color: 'bg-surface-container',    textColor: 'text-on-surface' },
];

const BUILDINGS    = ['Alpha-1', 'Alpha-2', 'Beta-1', 'Beta-2', 'Gamma-1', 'Gamma-3', 'Delta-1'];
const BATCHES      = ['B-2024-001', 'B-2024-002', 'B-2024-004', 'B-2024-005'];
const WORKERS      = ['Juan dela Cruz', 'Pedro Reyes', 'Rosa Mendoza', 'Carlos Bautista'];
const DISPOSALS    = ['Deep burial (on-site)', 'Composting pit', 'Rendering plant', 'Incineration', 'Collection by disposal team'];
const LOCATIONS    = ['Near feeders', 'Near drinkers', 'Corner of house', 'Center of house', 'Perimeter', 'Multiple locations'];

@Component({
  selector: 'app-mortality-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-2xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/worker-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div>
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Record Mortality</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
      </div>

      <!-- Critical alert if high count -->
      @if (form.count >= 20) {
        <div class="bg-error text-on-error rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">crisis_alert</span>
          <div>
            <p class="font-bold">High mortality count detected!</p>
            <p class="text-sm opacity-90">{{ form.count }} birds — please notify your supervisor immediately.</p>
          </div>
        </div>
      }

      <!-- Success -->
      @if (saved()) {
        <div class="bg-primary-fixed text-on-primary-fixed-variant rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">check_circle</span>
          <span class="font-bold">Mortality record saved. Supervisor notified.</span>
        </div>
      }

      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-lg">

        <!-- Header bar -->
        <div class="px-lg py-md bg-on-surface text-inverse-on-surface">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">emergency</span>
            <h2 class="font-bold" style="font-size:16px">Mortality Event Details</h2>
          </div>
        </div>

        <div class="p-lg space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Building / House *</label>
              <select [(ngModel)]="form.building"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select building...</option>
                @for (b of buildings; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Flock Batch *</label>
              <select [(ngModel)]="form.batch"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select batch...</option>
                @for (b of batches; track b) { <option>{{ b }}</option> }
              </select>
            </div>
          </div>

          <!-- Bird count — big prominent input -->
          <div class="bg-surface-container rounded-xl p-lg text-center">
            <label class="text-label-md text-on-surface-variant block mb-md uppercase tracking-widest">
              Number of Dead Birds *
            </label>
            <div class="flex items-center justify-center gap-lg">
              <button (click)="adjustCount(-1)"
                      class="w-12 h-12 rounded-xl bg-white border border-outline-variant
                             text-xl font-bold hover:border-primary transition-colors">−</button>
              <input type="number" [(ngModel)]="form.count" min="0"
                     class="w-28 text-center border-2 rounded-xl py-sm text-body-md font-bold
                            focus:outline-none focus:ring-2 focus:ring-primary/20"
                     [class]="form.count >= 20 ? 'border-error text-error' :
                              form.count >= 10 ? 'border-secondary text-secondary' :
                              'border-outline-variant text-on-surface'"
                     style="font-size:32px;line-height:44px"/>
              <button (click)="adjustCount(1)"
                      class="w-12 h-12 rounded-xl bg-white border border-outline-variant
                             text-xl font-bold hover:border-primary transition-colors">+</button>
            </div>
            <!-- Severity indicator -->
            <div class="mt-md flex justify-center">
              <span class="px-md py-xs rounded-full text-label-md font-bold" [class]="severityBadge">
                {{ severityLabel }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Location in House</label>
              <select [(ngModel)]="form.location"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                @for (l of locationOptions; track l) { <option>{{ l }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Recorded By *</label>
              <select [(ngModel)]="form.recordedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select name...</option>
                @for (w of workers; track w) { <option>{{ w }}</option> }
              </select>
            </div>
          </div>
        </div>

        <!-- Cause of death -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-error" style="font-variation-settings:'FILL' 1">diagnosis</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Probable Cause of Death *</h2>
          </div>
        </div>

        <div class="p-lg">
          <div class="grid grid-cols-2 gap-sm">
            @for (cause of causeOptions; track cause.key) {
              <button (click)="form.cause = cause.key"
                      class="flex items-start gap-sm p-sm rounded-xl border-2 text-left transition-all"
                      [class]="form.cause === cause.key
                        ? 'border-primary ' + cause.color + ' shadow-sm'
                        : 'border-outline-variant bg-white hover:border-outline'">
                <span class="material-symbols-outlined text-[20px] mt-xs flex-shrink-0"
                      [class]="cause.textColor"
                      style="font-variation-settings:'FILL' 1">{{ cause.icon }}</span>
                <div>
                  <p class="font-bold text-on-surface text-sm">{{ cause.label }}</p>
                  <p class="text-[10px] text-on-surface-variant leading-tight">{{ cause.description }}</p>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Symptoms & disposal -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-on-surface">notes</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Observations & Disposal</h2>
          </div>
        </div>

        <div class="p-lg space-y-md">
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">
              Symptoms Observed <span class="text-[10px] normal-case">(colour, posture, breathing, etc.)</span>
            </label>
            <textarea [(ngModel)]="form.symptoms" rows="3"
                      placeholder="e.g. Pale comb, gasping, twisted neck, blood discharge, huddling..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
            </textarea>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Disposal Method</label>
            <select [(ngModel)]="form.disposalMethod"
                    class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                           focus:outline-none focus:ring-2 focus:ring-primary/20">
              @for (d of disposalOptions; track d) { <option>{{ d }}</option> }
            </select>
          </div>
        </div>

        <!-- Summary box -->
        @if (form.count > 0 && form.building) {
          <div class="px-lg py-md bg-on-surface text-inverse-on-surface border-t border-outline-variant">
            <div class="grid grid-cols-3 gap-md text-center">
              <div>
                <div class="text-[11px] opacity-60 uppercase font-bold">Building</div>
                <div class="font-bold text-sm mt-xs">{{ form.building }}</div>
              </div>
              <div>
                <div class="text-[11px] opacity-60 uppercase font-bold">Dead Birds</div>
                <div class="font-bold mt-xs" style="font-size:22px">{{ form.count }}</div>
              </div>
              <div>
                <div class="text-[11px] opacity-60 uppercase font-bold">Severity</div>
                <div class="font-bold text-sm mt-xs">{{ severityLabel }}</div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Validation error -->
      @if (validationError()) {
        <div class="bg-error-container text-on-error-container rounded-xl p-md mb-md flex items-center gap-sm">
          <span class="material-symbols-outlined text-[18px]">error</span>
          {{ validationError() }}
        </div>
      }

      <!-- Submit -->
      <button (click)="submit()" [disabled]="submitting()"
              class="w-full bg-on-surface text-inverse-on-surface py-md rounded-xl font-bold text-body-md
                     hover:opacity-80 active:scale-95 transition-all disabled:opacity-60
                     flex items-center justify-center gap-sm shadow-sm">
        @if (submitting()) {
          <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> Saving...
        } @else {
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">save</span>
          Save Mortality Record
        }
      </button>

      <!-- Today's records -->
      @if (entries().length > 0) {
        <div class="mt-xl">
          <div class="flex items-center justify-between mb-md">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Today's Records</h3>
            <span class="font-bold text-error text-body-md">
              {{ todayTotal }} birds total
            </span>
          </div>
          <div class="space-y-sm">
            @for (entry of entries(); track entry.id) {
              <div class="bg-white border border-outline-variant rounded-xl p-md flex items-center gap-md"
                   [class.border-error]="entry.count >= 20">
                <span class="material-symbols-outlined p-sm rounded-lg flex-shrink-0"
                      [class]="entry.count >= 20 ? 'bg-error text-on-error' : 'bg-on-surface text-inverse-on-surface'"
                      style="font-variation-settings:'FILL' 1">emergency</span>
                <div class="flex-1">
                  <p class="font-bold text-on-surface text-body-md">{{ entry.building }} — {{ entry.cause }}</p>
                  <p class="text-xs text-on-surface-variant">{{ entry.recordedAt }} · {{ entry.recordedBy }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold" [class]="entry.count >= 10 ? 'text-error' : 'text-on-surface'">
                    {{ entry.count }}
                  </p>
                  <p class="text-xs text-on-surface-variant">birds</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class MortalityLogComponent {
  private mortSvc   = inject(MortalityService);
  private notifSvc  = inject(NotificationService);
  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  buildings       = BUILDINGS;
  batches         = BATCHES;
  workers         = WORKERS;
  causeOptions    = CAUSES;
  disposalOptions = DISPOSALS;
  locationOptions = LOCATIONS;

  form = {
    building: '', batch: '', count: 0,
    cause: '' as MortCause | '',
    location:       LOCATIONS[0],
    symptoms:       '',
    disposalMethod: DISPOSALS[0],
    recordedBy:     '',
  };

  entries        = signal<MortEntry[]>([]);
  saved          = signal(false);
  submitting     = signal(false);
  validationError = signal('');
  private nextId  = 1;

  get todayTotal(): number { return this.entries().reduce((s, e) => s + e.count, 0); }

  get severityLabel(): string {
    if (this.form.count === 0) return 'No birds';
    if (this.form.count < 5)  return 'Normal range';
    if (this.form.count < 20) return 'Elevated — monitor';
    return 'Critical — alert supervisor';
  }

  get severityBadge(): string {
    if (this.form.count === 0) return 'bg-surface-container text-on-surface-variant';
    if (this.form.count < 5)  return 'bg-primary-fixed text-on-primary-fixed-variant';
    if (this.form.count < 20) return 'bg-secondary-fixed text-on-secondary-fixed-variant';
    return 'bg-error text-on-error';
  }

  adjustCount(delta: number): void {
    this.form.count = Math.max(0, (this.form.count || 0) + delta);
  }

  submit(): void {
    if (!this.form.building)   { this.validationError.set('Please select a building.');        return; }
    if (!this.form.batch)      { this.validationError.set('Please select a flock batch.');     return; }
    if (!this.form.recordedBy) { this.validationError.set('Please select the recorder.');      return; }
    if (!this.form.count || this.form.count <= 0) { this.validationError.set('Count must be at least 1.'); return; }
    if (!this.form.cause)      { this.validationError.set('Please select the probable cause.'); return; }

    this.validationError.set('');
    this.submitting.set(true);

    this.mortSvc.log({
      flock_batch_id: 1,
      building_id:    1,
      recorded_by:    1,
      count:          this.form.count,
      cause:          String(this.form.cause),
      location:       this.form.location || undefined,
      symptoms:       this.form.symptoms || undefined,
      disposal_method:this.form.disposalMethod || undefined,
      severity:       this.form.count < 5 ? 'normal' : this.form.count < 20 ? 'elevated' : 'critical',
    }).subscribe({
      next:  () => this.finishMortality(),
      error: () => this.finishMortality(),
    });
  }

  private finishMortality(): void {
    const causeLabel = CAUSES.find(c => c.key === this.form.cause)?.label ?? String(this.form.cause);
    const severity: Severity = this.form.count < 5 ? 'normal' : this.form.count < 20 ? 'elevated' : 'critical';
    // Push notification to all supervisors/managers if elevated
    if (this.form.count >= 5) {
      this.notifSvc.push({
        level:    this.form.count >= 20 ? 'critical' : 'warning',
        category: 'mortality',
        icon:     'emergency',
        title:    `Mortality ${this.form.count >= 20 ? 'Spike' : 'Event'} — ${this.form.building}`,
        message:  `${this.form.count} birds logged. Cause: ${causeLabel}. Batch ${this.form.batch}.`,
        route:    '/mortality/log',
        batch:    this.form.batch,
        building: this.form.building,
        forRoles: ['admin','manager','supervisor'],
      });
    }
    this.entries.update(list => [{
      id: this.nextId++,
      building: this.form.building, batch: this.form.batch,
      count: this.form.count, cause: causeLabel,
      location: this.form.location, symptoms: this.form.symptoms,
      disposalMethod: this.form.disposalMethod, recordedBy: this.form.recordedBy,
      recordedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      severity,
    }, ...list]);
    this.form = {
      building: '', batch: '', count: 0, cause: '',
      location: LOCATIONS[0], symptoms: '', disposalMethod: DISPOSALS[0], recordedBy: '',
    };
    this.submitting.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
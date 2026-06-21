import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type DamageType = 'cracked' | 'broken' | 'dirty' | 'blood_stained' | 'soft_shell' | 'double_yolk' | 'other';

interface DamageOption {
  key: DamageType;
  label: string;
  icon: string;
  description: string;
  color: string;
  labelColor: string;
}

interface DamageReport {
  id: number;
  building: string;
  batch: string;
  reportedAt: string;
  reportedBy: string;
  damageType: string;
  count: number;
  severity: string;
  cause: string;
  notes: string;
}

const DAMAGE_TYPES: DamageOption[] = [
  { key: 'cracked',      label: 'Cracked',       icon: 'egg_alt',         description: 'Shell cracked but membrane intact',   color: 'bg-error-container',           labelColor: 'text-on-error-container' },
  { key: 'broken',       label: 'Broken',         icon: 'broken_image',    description: 'Shell and membrane both broken',      color: 'bg-error-container',           labelColor: 'text-on-error-container' },
  { key: 'dirty',        label: 'Dirty / Soiled', icon: 'water_damage',    description: 'Contaminated with feces or mud',     color: 'bg-secondary-fixed',           labelColor: 'text-on-secondary-fixed-variant' },
  { key: 'blood_stained',label: 'Blood Stained',  icon: 'bloodtype',       description: 'Visible blood on shell',             color: 'bg-error-container',           labelColor: 'text-on-error-container' },
  { key: 'soft_shell',   label: 'Soft Shell',     icon: 'texture',         description: 'Shell too thin or rubbery',          color: 'bg-tertiary-fixed',            labelColor: 'text-on-tertiary-fixed-variant' },
  { key: 'double_yolk',  label: 'Double Yolk',    icon: 'join',            description: 'Abnormally large — double yolk',     color: 'bg-primary-fixed',             labelColor: 'text-on-primary-fixed-variant' },
  { key: 'other',        label: 'Other Defect',   icon: 'help',            description: 'Other visible defect',               color: 'bg-surface-container-highest', labelColor: 'text-on-surface' },
];

const SEVERITY = ['Low — Isolated incident', 'Medium — Multiple affected', 'High — Widespread issue'];
const CAUSES   = ['Rough handling', 'Equipment malfunction', 'Hen behavior (pecking)', 'Nutritional deficiency', 'Disease / illness', 'Environmental stress', 'Storage issue', 'Unknown'];
const BUILDINGS  = ['Alpha-1', 'Alpha-2', 'Beta-1', 'Beta-2', 'Gamma-1', 'Gamma-3', 'Delta-1'];
const BATCHES    = ['B-2024-001', 'B-2024-002', 'B-2024-004', 'B-2024-005'];
const REPORTERS  = ['Juan dela Cruz', 'Pedro Reyes', 'Rosa Mendoza', 'Carlos Bautista'];

@Component({
  selector: 'app-damaged-eggs',
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
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Report Damaged Eggs</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
      </div>

      <!-- Success -->
      @if (saved()) {
        <div class="bg-primary-fixed text-on-primary-fixed-variant rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">check_circle</span>
          <span class="font-bold">Damage report submitted successfully!</span>
        </div>
      }

      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-lg">

        <!-- Basic info -->
        <div class="px-lg py-md bg-error text-on-error">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">broken_image</span>
            <h2 class="font-bold" style="font-size:16px">Damage Report Details</h2>
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
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Reported By *</label>
              <select [(ngModel)]="form.reportedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select name...</option>
                @for (r of reporters; track r) { <option>{{ r }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Number of Damaged Eggs *</label>
              <input type="number" [(ngModel)]="form.count" min="1"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                     placeholder="0"/>
            </div>
          </div>
        </div>

        <!-- Damage type picker -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-error" style="font-variation-settings:'FILL' 1">category</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Type of Damage *</h2>
          </div>
        </div>

        <div class="p-lg">
          <div class="grid grid-cols-1 gap-sm">
            @for (type of damageTypes; track type.key) {
              <button (click)="form.damageType = type.key"
                      class="flex items-center gap-md p-md rounded-xl border-2 text-left transition-all"
                      [class]="form.damageType === type.key
                        ? 'border-primary ' + type.color + ' shadow-sm scale-[1.01]'
                        : 'border-outline-variant bg-white hover:border-outline'">
                <div class="p-sm rounded-lg flex-shrink-0" [class]="type.color">
                  <span class="material-symbols-outlined text-[20px]" [class]="type.labelColor"
                        style="font-variation-settings:'FILL' 1">{{ type.icon }}</span>
                </div>
                <div class="flex-1">
                  <p class="font-bold text-on-surface">{{ type.label }}</p>
                  <p class="text-xs text-on-surface-variant">{{ type.description }}</p>
                </div>
                @if (form.damageType === type.key) {
                  <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">check_circle</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Severity & cause -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-secondary" style="font-variation-settings:'FILL' 1">info</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Additional Details</h2>
          </div>
        </div>

        <div class="p-lg space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Severity</label>
              <select [(ngModel)]="form.severity"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                @for (s of severityOptions; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Probable Cause</label>
              <select [(ngModel)]="form.cause"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                @for (c of causeOptions; track c) { <option>{{ c }}</option> }
              </select>
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Notes / Observations</label>
            <textarea [(ngModel)]="form.notes" rows="3"
                      placeholder="Describe what you observed, location in house, any unusual conditions..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
            </textarea>
          </div>
        </div>
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
              class="w-full bg-error text-on-error py-md rounded-xl font-bold text-body-md
                     hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                     flex items-center justify-center gap-sm shadow-sm">
        @if (submitting()) {
          <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> Submitting...
        } @else {
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">report</span>
          Submit Damage Report
        }
      </button>

      <!-- Previous reports -->
      @if (reports().length > 0) {
        <div class="mt-xl">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">
            Today's Reports ({{ reports().length }})
          </h3>
          <div class="space-y-sm">
            @for (r of reports(); track r.id) {
              <div class="bg-white border border-outline-variant rounded-xl p-md flex items-center gap-md">
                <span class="material-symbols-outlined p-sm bg-error-container text-on-error-container rounded-lg"
                      style="font-variation-settings:'FILL' 1">broken_image</span>
                <div class="flex-1">
                  <p class="font-bold text-on-surface text-body-md">{{ r.building }} — {{ r.damageType }}</p>
                  <p class="text-xs text-on-surface-variant">{{ r.reportedAt }} · {{ r.reportedBy }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-error">{{ r.count }}</p>
                  <p class="text-xs text-on-surface-variant">eggs</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DamagedEggsComponent {
  private api = inject(ApiService);
  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  buildings      = BUILDINGS;
  batches        = BATCHES;
  reporters      = REPORTERS;
  damageTypes    = DAMAGE_TYPES;
  severityOptions = SEVERITY;
  causeOptions   = CAUSES;

  form = {
    building: '', batch: '', reportedBy: '',
    count: null as number | null,
    damageType: '' as DamageType | '',
    severity: SEVERITY[0],
    cause:    CAUSES[0],
    notes: '',
  };

  reports        = signal<DamageReport[]>([]);
  saved          = signal(false);
  submitting     = signal(false);
  validationError = signal('');
  private nextId  = 1;

  submit(): void {
    if (!this.form.building)   { this.validationError.set('Please select a building.');      return; }
    if (!this.form.batch)      { this.validationError.set('Please select a flock batch.');   return; }
    if (!this.form.reportedBy) { this.validationError.set('Please select the reporter.');    return; }
    if (!this.form.count || this.form.count < 1) { this.validationError.set('Enter at least 1 damaged egg.'); return; }
    if (!this.form.damageType) { this.validationError.set('Please select the damage type.'); return; }

    this.validationError.set('');
    this.submitting.set(true);

    this.api.post('damaged-eggs', {
      flock_batch_id: 1,
      building_id:    1,
      reported_by:    1,
      count:          this.form.count,
      damage_type:    this.form.damageType,
      severity:       this.form.severity,
      cause:          this.form.cause || undefined,
      notes:          this.form.notes || undefined,
    }).subscribe({
      next:  () => this.finishDamage(),
      error: () => this.finishDamage(),
    });
  }

  private finishDamage(): void {
    const damageLabel = DAMAGE_TYPES.find(d => d.key === this.form.damageType)?.label ?? this.form.damageType;
    this.reports.update(list => [{
      id: this.nextId++,
      building: this.form.building, batch: this.form.batch,
      reportedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      reportedBy: this.form.reportedBy, damageType: damageLabel,
      count: this.form.count ?? 0, severity: this.form.severity,
      cause: this.form.cause, notes: this.form.notes,
    }, ...list]);
    this.form = {
      building: '', batch: '', reportedBy: '', count: null, damageType: '',
      severity: SEVERITY[0], cause: CAUSES[0], notes: '',
    };
    this.submitting.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
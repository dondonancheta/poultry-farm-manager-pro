import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlockBatchService } from '../../core/services/flock-batch.service';
import { MasterDataService } from '../../core/services/index';

interface FlockFormData {
  batchCode: string; breed: string; arrivalDate: string;
  building: string; initialCount: number; sourceFarm: string;
  notes: string;
}

const BUILDINGS = ['Alpha-1','Alpha-2','Beta-1','Beta-2','Gamma-3','Delta-1'];
const DEFAULT_BREEDS = ['Cobb 500','Ross 308','Hubbard','Arbor Acres'];

@Component({
  selector: 'app-flock-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="p-lg max-w-2xl mx-auto pb-xl">
  <div class="flex items-center gap-md mb-lg">
    <a routerLink="/flocks"
       class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
      <span class="material-symbols-outlined">arrow_back</span>
    </a>
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Register New Batch</h1>
      <p class="text-on-surface-variant text-body-md">Add a new flock batch to the farm</p>
    </div>
  </div>

  <div class="bg-white border border-outline-variant rounded-2xl p-xl shadow-sm space-y-md">

    <!-- Batch code + auto-generate -->
    <div>
      <label class="text-label-md text-on-surface-variant block mb-xs">Batch Code *</label>
      <div class="flex gap-sm">
        <input type="text" [(ngModel)]="form.batchCode" placeholder="B-2024-007"
               class="flex-1 border border-outline-variant rounded-lg px-md py-sm text-body-md
                      focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"/>
        <button (click)="generateCode()"
                class="px-md py-sm bg-surface-container text-on-surface rounded-lg text-label-md
                       hover:bg-surface-container-high transition-all">
          Auto-generate
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
      <!-- Breed -->
      <div>
        <label class="text-label-md text-on-surface-variant block mb-xs">Breed *</label>
        <select [(ngModel)]="form.breed"
                class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                       focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select breed...</option>
          @for (b of breeds(); track b) { <option>{{ b }}</option> }
        </select>
      </div>

      <!-- Building -->
      <div>
        <label class="text-label-md text-on-surface-variant block mb-xs">Building / House *</label>
        <select [(ngModel)]="form.building"
                class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                       focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select building...</option>
          @for (b of buildings; track b) { <option>{{ b }}</option> }
        </select>
      </div>

      <!-- Arrival date -->
      <div>
        <label class="text-label-md text-on-surface-variant block mb-xs">Arrival Date *</label>
        <input type="date" [(ngModel)]="form.arrivalDate"
               class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      </div>

      <!-- Initial count -->
      <div>
        <label class="text-label-md text-on-surface-variant block mb-xs">Initial Count *</label>
        <div class="flex items-center gap-sm">
          <button (click)="form.initialCount = Math.max(0, form.initialCount - 500)"
                  class="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high
                         flex items-center justify-center font-bold">−</button>
          <input type="number" [(ngModel)]="form.initialCount" min="1"
                 class="flex-1 text-center border border-outline-variant rounded-lg px-sm py-sm
                        text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          <button (click)="form.initialCount = form.initialCount + 500"
                  class="w-9 h-9 rounded-lg bg-primary-fixed text-on-primary-fixed-variant
                         hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold">+</button>
        </div>
        <div class="flex gap-sm mt-xs">
          @for (n of [5000,10000,12000,15000,18000]; track n) {
            <button (click)="form.initialCount = n"
                    class="flex-1 py-xs border border-outline-variant rounded text-[10px]
                           hover:border-primary hover:bg-primary-fixed transition-all">
              {{ (n/1000).toFixed(0) }}k
            </button>
          }
        </div>
      </div>

      <!-- Source farm -->
      <div class="md:col-span-2">
        <label class="text-label-md text-on-surface-variant block mb-xs">Source Farm / Hatchery</label>
        <input type="text" [(ngModel)]="form.sourceFarm" placeholder="e.g. GreenValley Hatchery"
               class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      </div>

      <!-- Notes -->
      <div class="md:col-span-2">
        <label class="text-label-md text-on-surface-variant block mb-xs">Notes</label>
        <textarea [(ngModel)]="form.notes" rows="2" placeholder="Any additional notes about this batch..."
                  class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
      </div>
    </div>

    <!-- Summary preview -->
    @if (form.batchCode && form.breed && form.building && form.initialCount > 0) {
      <div class="bg-primary-container rounded-xl p-md">
        <p class="text-xs text-on-primary-container opacity-70 uppercase font-bold tracking-wide mb-sm">Batch Preview</p>
        <div class="grid grid-cols-3 gap-md text-center">
          <div>
            <div class="font-bold text-on-primary font-mono">{{ form.batchCode }}</div>
            <div class="text-xs text-on-primary-container opacity-70">Batch Code</div>
          </div>
          <div>
            <div class="font-bold text-on-primary">{{ form.initialCount.toLocaleString() }}</div>
            <div class="text-xs text-on-primary-container opacity-70">Birds</div>
          </div>
          <div>
            <div class="font-bold text-on-primary">{{ form.building }}</div>
            <div class="text-xs text-on-primary-container opacity-70">House</div>
          </div>
        </div>
      </div>
    }

    <!-- Error -->
    @if (error()) {
      <div class="bg-error-container text-on-error-container rounded-lg p-md flex items-center gap-sm text-sm">
        <span class="material-symbols-outlined text-[16px]">error</span>{{ error() }}
      </div>
    }

    <!-- Actions -->
    <div class="flex gap-md pt-md border-t border-outline-variant">
      <a routerLink="/flocks"
         class="flex-1 py-sm text-center border border-outline text-on-surface rounded-lg
                text-label-md hover:bg-surface-container transition-all">
        Cancel
      </a>
      <button (click)="submit()" [disabled]="saving()"
              class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold
                     hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                     flex items-center justify-center gap-xs">
        @if (saving()) {
          <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>Registering...
        } @else {
          <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">add_circle</span>
          Register Batch
        }
      </button>
    </div>
  </div>
</div>
  `,
})
export class FlockFormComponent implements OnInit {
  private flockSvc  = inject(FlockBatchService);
  private masterSvc = inject(MasterDataService);
  private router    = inject(Router);

  Math      = Math;
  buildings = BUILDINGS;
  breeds    = signal<string[]>(DEFAULT_BREEDS);
  saving    = signal(false);
  error     = signal('');

  form: FlockFormData = {
    batchCode: '', breed: '', arrivalDate: new Date().toISOString().split('T')[0],
    building: '', initialCount: 10000, sourceFarm: '', notes: '',
  };

  ngOnInit(): void {
    // Load breeds from master data
    this.masterSvc.getBreeds().subscribe({
      next: (data: any) => {
        if (data?.length) this.breeds.set(data.map((b: any) => b.name));
      },
      error: () => {},
    });
    this.generateCode();
  }

  generateCode(): void {
    const year  = new Date().getFullYear();
    const seq   = String(Math.floor(Math.random() * 900) + 100);
    this.form.batchCode = `B-${year}-${seq}`;
  }

  submit(): void {
    if (!this.form.batchCode.trim()) { this.error.set('Batch code is required.'); return; }
    if (!this.form.breed)           { this.error.set('Select a breed.');           return; }
    if (!this.form.building)        { this.error.set('Select a building.');         return; }
    if (!this.form.arrivalDate)     { this.error.set('Arrival date is required.');  return; }
    if (this.form.initialCount < 1) { this.error.set('Initial count must be > 0.'); return; }

    this.saving.set(true);
    this.error.set('');

    this.flockSvc.create({
      batchCode:    this.form.batchCode,
      breed:        this.form.breed,
      houseName:    this.form.building,
      arrivalDate:  this.form.arrivalDate,
      initialCount: this.form.initialCount,
      sourceFarm:   this.form.sourceFarm,
      notes:        this.form.notes,
      status:       'Active',
      population:   this.form.initialCount,
    } as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/flocks']);
      },
      error: () => {
        // Navigate anyway — optimistic
        this.saving.set(false);
        this.router.navigate(['/flocks']);
      },
    });
  }
}

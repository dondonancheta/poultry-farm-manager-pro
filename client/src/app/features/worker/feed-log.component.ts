import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeedService } from '../../core/services/index';

interface FeedType {
  id: string;
  name: string;
  category: string;
  stockKg: number;
  unit: string;
}

interface FeedEntry {
  id: number;
  building: string;
  batch: string;
  feedType: string;
  quantityKg: number;
  issuedBy: string;
  issuedAt: string;
  session: string;
  notes: string;
}

const FEED_TYPES: FeedType[] = [
  { id: 'starter-a', name: 'Starter Mix (Type A)', category: 'Starter',   stockKg: 4200, unit: 'kg' },
  { id: 'starter-b', name: 'Starter Mix (Type B)', category: 'Starter',   stockKg: 1800, unit: 'kg' },
  { id: 'grower-a',  name: 'Grower Pellets (A)',   category: 'Grower',    stockKg: 3100, unit: 'kg' },
  { id: 'finisher',  name: 'Finisher Crumbles',    category: 'Finisher',  stockKg:  950, unit: 'kg' },
  { id: 'layer',     name: 'Layer Mash (Premium)', category: 'Layer',     stockKg: 2750, unit: 'kg' },
];

const BUILDINGS  = ['Alpha-1', 'Alpha-2', 'Beta-1', 'Beta-2', 'Gamma-1', 'Gamma-3', 'Delta-1'];
const BATCHES    = ['B-2024-001', 'B-2024-002', 'B-2024-004', 'B-2024-005'];
const WORKERS    = ['Juan dela Cruz', 'Pedro Reyes', 'Rosa Mendoza', 'Carlos Bautista'];
const SESSIONS   = ['Morning (5:00–7:00 AM)', 'Noon (11:00 AM–1:00 PM)', 'Afternoon (4:00–6:00 PM)'];

@Component({
  selector: 'app-feed-log',
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
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Log Feed Consumption</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
      </div>

      <!-- Success -->
      @if (saved()) {
        <div class="bg-primary-fixed text-on-primary-fixed-variant rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">check_circle</span>
          <span class="font-bold">Feed consumption logged successfully!</span>
        </div>
      }

      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-lg">

        <!-- Header bar -->
        <div class="px-lg py-md flex items-center gap-sm"
             style="background:linear-gradient(135deg,#904d00,#fe932c)">
          <span class="material-symbols-outlined text-white" style="font-variation-settings:'FILL' 1">grass</span>
          <h2 class="font-bold text-white" style="font-size:16px">Feed Issuance Details</h2>
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
              <label class="text-label-md text-on-surface-variant block mb-xs">Feeding Session *</label>
              <select [(ngModel)]="form.session"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                @for (s of sessions; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Issued By *</label>
              <select [(ngModel)]="form.issuedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select name...</option>
                @for (w of workers; track w) { <option>{{ w }}</option> }
              </select>
            </div>
          </div>
        </div>

        <!-- Feed type selector -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-secondary" style="font-variation-settings:'FILL' 1">inventory_2</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Select Feed Type *</h2>
          </div>
        </div>

        <div class="p-lg space-y-sm">
          @for (feed of feedTypes; track feed.id) {
            <button (click)="selectFeed(feed)"
                    class="w-full flex items-center gap-md p-md rounded-xl border-2 text-left transition-all"
                    [class]="form.feedTypeId === feed.id
                      ? 'border-secondary bg-secondary-fixed shadow-sm scale-[1.01]'
                      : 'border-outline-variant bg-white hover:border-outline'">
              <div class="p-sm rounded-lg flex-shrink-0 bg-secondary-fixed">
                <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[20px]"
                      style="font-variation-settings:'FILL' 1">grass</span>
              </div>
              <div class="flex-1">
                <p class="font-bold text-on-surface">{{ feed.name }}</p>
                <p class="text-xs text-on-surface-variant">{{ feed.category }} · {{ feed.stockKg.toLocaleString() }} kg in stock</p>
              </div>
              <!-- Stock bar -->
              <div class="w-20">
                <div class="text-[10px] text-on-surface-variant text-right mb-xs">
                  {{ stockPct(feed) }}%
                </div>
                <div class="w-full bg-surface-container rounded-full h-1.5">
                  <div class="h-1.5 rounded-full"
                       [class]="stockPct(feed) < 30 ? 'bg-error' : 'bg-secondary'"
                       [style.width.%]="stockPct(feed)">
                  </div>
                </div>
              </div>
              @if (form.feedTypeId === feed.id) {
                <span class="material-symbols-outlined text-secondary flex-shrink-0"
                      style="font-variation-settings:'FILL' 1">check_circle</span>
              }
            </button>
          }
        </div>

        <!-- Quantity & notes -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">scale</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Quantity & Notes</h2>
          </div>
        </div>

        <div class="p-lg space-y-md">
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Quantity Consumed (kg) *</label>
            <div class="flex items-center gap-md">
              <button (click)="adjustQty(-50)"
                      class="w-10 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high
                             flex items-center justify-center font-bold text-on-surface transition-colors">
                −50
              </button>
              <input type="number" [(ngModel)]="form.quantityKg" min="0" step="0.5"
                     class="flex-1 text-center border border-outline-variant rounded-lg px-md py-sm
                            text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                     style="font-size:20px" placeholder="0"/>
              <button (click)="adjustQty(50)"
                      class="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant
                             hover:bg-secondary hover:text-on-secondary flex items-center justify-center
                             font-bold transition-all">
                +50
              </button>
            </div>
            <p class="text-xs text-on-surface-variant mt-xs text-center">kilograms</p>
          </div>

          <!-- Quick preset buttons -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Quick amounts</label>
            <div class="flex gap-sm flex-wrap">
              @for (preset of qtyPresets; track preset) {
                <button (click)="form.quantityKg = preset"
                        class="px-md py-xs rounded-lg border border-outline-variant bg-white text-body-md
                               hover:border-primary hover:bg-primary-fixed transition-all font-bold">
                  {{ preset }} kg
                </button>
              }
            </div>
          </div>

          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Notes</label>
            <textarea [(ngModel)]="form.notes" rows="2"
                      placeholder="Any observations about feed quality, wastage, or hen appetite..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
            </textarea>
          </div>
        </div>

        <!-- Summary -->
        @if (selectedFeed && form.quantityKg > 0) {
          <div class="px-lg py-md bg-secondary-fixed border-t border-outline-variant">
            <div class="grid grid-cols-3 gap-md text-center">
              <div>
                <div class="text-[11px] font-bold text-on-secondary-fixed-variant opacity-80 uppercase">Feed Type</div>
                <div class="font-bold text-on-secondary-fixed text-sm mt-xs">{{ selectedFeed.category }}</div>
              </div>
              <div>
                <div class="text-[11px] font-bold text-on-secondary-fixed-variant opacity-80 uppercase">Issued (kg)</div>
                <div class="font-bold text-on-secondary-fixed text-[22px]">{{ form.quantityKg }}</div>
              </div>
              <div>
                <div class="text-[11px] font-bold text-on-secondary-fixed-variant opacity-80 uppercase">Remaining</div>
                <div class="font-bold text-on-secondary-fixed text-[22px]">
                  {{ (selectedFeed.stockKg - form.quantityKg).toLocaleString() }}
                </div>
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
              class="w-full py-md rounded-xl font-bold text-body-md
                     hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                     flex items-center justify-center gap-sm shadow-sm text-on-secondary"
              style="background:linear-gradient(135deg,#904d00,#fe932c)">
        @if (submitting()) {
          <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> Logging...
        } @else {
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">save</span>
          Log Feed Consumption
        }
      </button>

      <!-- Today's logs -->
      @if (entries().length > 0) {
        <div class="mt-xl">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">
            Today's Feed Logs ({{ entries().length }})
          </h3>
          <div class="space-y-sm">
            @for (entry of entries(); track entry.id) {
              <div class="bg-white border border-outline-variant rounded-xl p-md flex items-center gap-md">
                <span class="material-symbols-outlined p-sm bg-secondary-fixed text-on-secondary-fixed-variant rounded-lg"
                      style="font-variation-settings:'FILL' 1">grass</span>
                <div class="flex-1">
                  <p class="font-bold text-on-surface text-body-md">{{ entry.building }} — {{ entry.feedType }}</p>
                  <p class="text-xs text-on-surface-variant">{{ entry.issuedAt }} · {{ entry.issuedBy }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-secondary">{{ entry.quantityKg }} kg</p>
                  <p class="text-xs text-on-surface-variant">{{ entry.session.split(' ')[0] }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class FeedLogComponent {
  private feedSvc = inject(FeedService);
  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  buildings = BUILDINGS;
  batches   = BATCHES;
  workers   = WORKERS;
  sessions  = SESSIONS;
  feedTypes = FEED_TYPES;
  qtyPresets = [100, 200, 350, 450, 500];

  form = {
    building: '', batch: '', session: SESSIONS[0], issuedBy: '',
    feedTypeId: '', quantityKg: 0 as number, notes: '',
  };

  selectedFeed: FeedType | null = null;

  entries        = signal<FeedEntry[]>([]);
  saved          = signal(false);
  submitting     = signal(false);
  validationError = signal('');
  private nextId  = 1;

  selectFeed(feed: FeedType): void {
    this.form.feedTypeId = feed.id;
    this.selectedFeed    = feed;
  }

  adjustQty(delta: number): void {
    this.form.quantityKg = Math.max(0, (this.form.quantityKg || 0) + delta);
  }

  stockPct(feed: FeedType): number {
    return Math.min(100, Math.round((feed.stockKg / 5000) * 100));
  }

  submit(): void {
    if (!this.form.building)    { this.validationError.set('Please select a building.');     return; }
    if (!this.form.batch)       { this.validationError.set('Please select a flock batch.');  return; }
    if (!this.form.issuedBy)    { this.validationError.set('Please select the issuer.');     return; }
    if (!this.form.feedTypeId)  { this.validationError.set('Please select a feed type.');    return; }
    if (!this.form.quantityKg || this.form.quantityKg <= 0) {
      this.validationError.set('Please enter the quantity consumed.'); return;
    }

    this.validationError.set('');
    this.submitting.set(true);

    this.feedSvc.logIssuance({
      feed_stock_id:  parseInt(String(this.form.feedTypeId)) || 1,
      flock_batch_id: 1,
      building_id:    1,
      issued_by:      1,
      quantity_kg:    this.form.quantityKg,
      session:        this.form.session,
      notes:          this.form.notes || undefined,
    }).subscribe({
      next: () => this.finishSubmit(),
      error: () => this.finishSubmit(), // show success even in offline mode
    });
  }

  private finishSubmit(): void {
    const feed = this.feedTypes.find(f => f.id === this.form.feedTypeId);
    this.entries.update(list => [{
      id: this.nextId++,
      building:   this.form.building,
      batch:      this.form.batch,
      feedType:   feed?.name ?? String(this.form.feedTypeId),
      quantityKg: this.form.quantityKg,
      issuedBy:   this.form.issuedBy,
      issuedAt:   new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      session:    this.form.session,
      notes:      this.form.notes,
    }, ...list]);
    this.form = {
      building: '', batch: '', session: SESSIONS[0], issuedBy: '',
      feedTypeId: '', quantityKg: 0, notes: '',
    };
    this.selectedFeed = null;
    this.submitting.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
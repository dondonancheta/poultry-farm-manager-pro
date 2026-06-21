import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type EntryType = 'egg_collection' | 'feed_consumed' | 'mortality' | 'damaged_eggs';
type EntryStatus = 'pending' | 'verified' | 'flagged' | 'rejected';

interface ProductionEntry {
  id: number;
  type: EntryType;
  building: string;
  batch: string;
  submittedBy: string;
  submittedAt: string;
  value: string;
  detail: string;
  status: EntryStatus;
  flagReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

const MOCK_ENTRIES: ProductionEntry[] = [
  { id: 1,  type: 'egg_collection', building: 'Alpha-1', batch: 'B-2024-001', submittedBy: 'Juan dela Cruz', submittedAt: '06:15 AM', value: '1,240 eggs',  detail: 'Large: 820 · Medium: 310 · Small: 110 · Cracked: 12', status: 'pending' },
  { id: 2,  type: 'feed_consumed',  building: 'Alpha-1', batch: 'B-2024-001', submittedBy: 'Juan dela Cruz', submittedAt: '06:30 AM', value: '450 kg',      detail: 'Starter Mix (Type A) · Morning session', status: 'pending' },
  { id: 3,  type: 'egg_collection', building: 'Beta-2',  batch: 'B-2024-002', submittedBy: 'Pedro Reyes',   submittedAt: '07:00 AM', value: '1,480 eggs',  detail: 'Large: 970 · Medium: 380 · Small: 130', status: 'pending' },
  { id: 4,  type: 'mortality',      building: 'Gamma-3', batch: 'B-2024-004', submittedBy: 'Rosa Mendoza',  submittedAt: '07:15 AM', value: '3 birds',      detail: 'Cause: Disease · Location: Near feeders', status: 'pending' },
  { id: 5,  type: 'damaged_eggs',   building: 'Beta-2',  batch: 'B-2024-002', submittedBy: 'Pedro Reyes',   submittedAt: '07:20 AM', value: '18 eggs',      detail: 'Type: Cracked · Cause: Rough handling', status: 'pending' },
  { id: 6,  type: 'feed_consumed',  building: 'Beta-2',  batch: 'B-2024-002', submittedBy: 'Pedro Reyes',   submittedAt: '07:25 AM', value: '380 kg',       detail: 'Grower Pellets (A) · Morning session', status: 'verified', verifiedBy: 'Maria Santos', verifiedAt: '08:00 AM' },
  { id: 7,  type: 'egg_collection', building: 'Delta-1', batch: 'B-2024-004', submittedBy: 'Carlos Bautista', submittedAt: '07:45 AM', value: '980 eggs', detail: 'Large: 620 · Medium: 270 · Small: 90',  status: 'verified', verifiedBy: 'Maria Santos', verifiedAt: '08:05 AM' },
  { id: 8,  type: 'mortality',      building: 'Alpha-2', batch: 'B-2024-005', submittedBy: 'Juan dela Cruz', submittedAt: '08:10 AM', value: '7 birds',      detail: 'Cause: Heat stress · Elevated severity', status: 'flagged', flagReason: 'Higher than usual — veterinarian check required' },
];

@Component({
  selector: 'app-verify-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-4xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/supervisor-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">
            Verify Production Entries
          </h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <!-- Summary chips -->
        <div class="hidden md:flex items-center gap-sm">
          <span class="px-md py-xs rounded-full text-label-md font-bold bg-secondary-fixed text-on-secondary-fixed-variant">
            {{ pendingCount }} pending
          </span>
          <span class="px-md py-xs rounded-full text-label-md font-bold bg-primary-fixed text-on-primary-fixed-variant">
            {{ verifiedCount }} verified
          </span>
          <span class="px-md py-xs rounded-full text-label-md font-bold bg-error-container text-on-error-container">
            {{ flaggedCount }} flagged
          </span>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-lg shadow-sm">
        <div class="flex gap-xs">
          @for (tab of statusTabs; track tab.key) {
            <button (click)="activeStatus = tab.key"
                    class="px-md py-xs rounded-lg text-label-md font-bold transition-all"
                    [class]="activeStatus === tab.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
              {{ tab.label }}
            </button>
          }
        </div>
        <div class="flex gap-md ml-auto flex-wrap">
          <select [(ngModel)]="filterType"
                  class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All types</option>
            <option value="egg_collection">Egg Collection</option>
            <option value="feed_consumed">Feed Consumed</option>
            <option value="mortality">Mortality</option>
            <option value="damaged_eggs">Damaged Eggs</option>
          </select>
          <select [(ngModel)]="filterBuilding"
                  class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All buildings</option>
            @for (b of buildings; track b) { <option>{{ b }}</option> }
          </select>
        </div>
      </div>

      <!-- Bulk actions bar (visible when there are pending) -->
      @if (pendingCount > 0 && (activeStatus === 'pending' || activeStatus === 'all')) {
        <div class="bg-primary-container rounded-xl px-lg py-md flex items-center gap-md mb-lg">
          <span class="material-symbols-outlined text-on-primary-container"
                style="font-variation-settings:'FILL' 1">select_all</span>
          <p class="text-body-md font-bold text-on-primary-container flex-1">
            {{ pendingCount }} entries awaiting your review
          </p>
          <button (click)="verifyAll()"
                  class="px-lg py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold
                         hover:opacity-90 active:scale-95 transition-all">
            Verify All Pending
          </button>
        </div>
      }

      <!-- Entry list -->
      <div class="space-y-sm">
        @for (entry of filtered(); track entry.id) {
          <div class="bg-white border rounded-2xl overflow-hidden shadow-sm transition-all"
               [class]="statusBorder(entry.status)">

            <!-- Entry row -->
            <div class="flex items-start gap-md p-lg">

              <!-- Type icon -->
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-xs"
                   [class]="typeIconBg(entry.type)">
                <span class="material-symbols-outlined text-[20px]"
                      style="font-variation-settings:'FILL' 1">{{ typeIcon(entry.type) }}</span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-md">
                  <div>
                    <p class="font-bold text-on-surface">{{ typeLabel(entry.type) }} — {{ entry.building }}</p>
                    <p class="text-xs text-on-surface-variant mt-xs">
                      Batch {{ entry.batch }} · By {{ entry.submittedBy }} · {{ entry.submittedAt }}
                    </p>
                  </div>
                  <span class="flex-shrink-0 px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                        [class]="statusChip(entry.status)">
                    {{ entry.status }}
                  </span>
                </div>

                <!-- Detail line -->
                <div class="mt-sm px-sm py-xs bg-surface-container rounded-lg">
                  <p class="text-body-md font-bold text-on-surface">{{ entry.value }}</p>
                  <p class="text-xs text-on-surface-variant mt-xs">{{ entry.detail }}</p>
                </div>

                <!-- Flag reason -->
                @if (entry.status === 'flagged' && entry.flagReason) {
                  <div class="mt-sm flex items-start gap-xs bg-error-container rounded-lg px-sm py-xs">
                    <span class="material-symbols-outlined text-on-error-container text-[14px] mt-xs flex-shrink-0"
                          style="font-variation-settings:'FILL' 1">flag</span>
                    <p class="text-xs text-on-error-container">{{ entry.flagReason }}</p>
                  </div>
                }

                <!-- Verified info -->
                @if (entry.status === 'verified' && entry.verifiedBy) {
                  <p class="text-xs text-primary mt-sm">
                    ✓ Verified by {{ entry.verifiedBy }} at {{ entry.verifiedAt }}
                  </p>
                }
              </div>

              <!-- Actions -->
              @if (entry.status === 'pending') {
                <div class="flex flex-col gap-sm flex-shrink-0">
                  <button (click)="verify(entry)"
                          class="flex items-center gap-xs px-md py-sm bg-primary-fixed text-on-primary-fixed-variant
                                 rounded-lg text-label-md hover:bg-primary hover:text-on-primary transition-all font-bold">
                    <span class="material-symbols-outlined text-[16px]"
                          style="font-variation-settings:'FILL' 1">check_circle</span>
                    Verify
                  </button>
                  <button (click)="openFlag(entry)"
                          class="flex items-center gap-xs px-md py-sm border border-secondary text-secondary
                                 rounded-lg text-label-md hover:bg-secondary-fixed transition-all">
                    <span class="material-symbols-outlined text-[16px]">flag</span>
                    Flag
                  </button>
                  <button (click)="reject(entry)"
                          class="flex items-center gap-xs px-md py-sm border border-error text-error
                                 rounded-lg text-label-md hover:bg-error-container transition-all">
                    <span class="material-symbols-outlined text-[16px]">cancel</span>
                    Reject
                  </button>
                </div>
              }
            </div>
          </div>
        }

        @if (filtered().length === 0) {
          <div class="bg-white border border-outline-variant rounded-2xl p-xl text-center">
            <span class="material-symbols-outlined text-5xl text-on-surface-variant opacity-30 block mb-md">
              task_alt
            </span>
            <p class="font-bold text-on-surface">No entries found</p>
            <p class="text-body-md text-on-surface-variant mt-xs">
              @if (activeStatus === 'pending') { All caught up — no pending entries. }
              @else { Try adjusting your filters. }
            </p>
          </div>
        }
      </div>

      <!-- Flag dialog -->
      @if (flagTarget) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-xl">
            <h3 class="font-bold text-on-surface mb-xs" style="font-size:18px">Flag Entry for Review</h3>
            <p class="text-body-md text-on-surface-variant mb-lg">
              {{ typeLabel(flagTarget.type) }} — {{ flagTarget.building }} — {{ flagTarget.value }}
            </p>
            <label class="text-label-md text-on-surface-variant block mb-xs">Reason for flagging *</label>
            <textarea [(ngModel)]="flagReason" rows="3"
                      placeholder="Explain why this entry needs review..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-lg">
            </textarea>
            <div class="flex gap-md">
              <button (click)="cancelFlag()"
                      class="flex-1 py-sm border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container transition-all">
                Cancel
              </button>
              <button (click)="confirmFlag()"
                      class="flex-1 py-sm bg-secondary text-on-secondary rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
                Submit Flag
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class VerifyEntriesComponent {
  private api = inject(ApiService);
  today    = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  buildings = ['Alpha-1', 'Alpha-2', 'Beta-1', 'Beta-2', 'Gamma-1', 'Gamma-3', 'Delta-1'];

  activeStatus  = 'pending';
  filterType    = '';
  filterBuilding = '';
  flagTarget: ProductionEntry | null = null;
  flagReason = '';

  entries = signal<ProductionEntry[]>(MOCK_ENTRIES);

  statusTabs = [
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Verified' },
    { key: 'flagged',  label: 'Flagged' },
    { key: 'all',      label: 'All' },
  ];

  filtered = computed(() =>
    this.entries().filter(e => {
      if (this.activeStatus !== 'all' && e.status !== this.activeStatus) return false;
      if (this.filterType     && e.type     !== this.filterType)     return false;
      if (this.filterBuilding && e.building !== this.filterBuilding) return false;
      return true;
    })
  );

  get pendingCount():  number { return this.entries().filter(e => e.status === 'pending').length; }
  get verifiedCount(): number { return this.entries().filter(e => e.status === 'verified').length; }
  get flaggedCount():  number { return this.entries().filter(e => e.status === 'flagged').length; }

  verify(entry: ProductionEntry): void {
    this.api.post<any>('egg-collections/' + entry.id + '/verify', {}).subscribe();
    this.entries.update(list => list.map(e => e.id === entry.id
      ? { ...e, status: 'verified' as EntryStatus, verifiedBy: 'Maria Santos', verifiedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }
      : e
    ));
  }

  verifyAll(): void {
    const now = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    this.entries.update(list => list.map(e =>
      e.status === 'pending'
        ? { ...e, status: 'verified' as EntryStatus, verifiedBy: 'Maria Santos', verifiedAt: now }
        : e
    ));
  }

  reject(entry: ProductionEntry): void {
    this.entries.update(list => list.map(e => e.id === entry.id
      ? { ...e, status: 'rejected' as EntryStatus }
      : e
    ));
  }

  openFlag(entry: ProductionEntry): void { this.flagTarget = entry; this.flagReason = ''; }
  cancelFlag(): void { this.flagTarget = null; this.flagReason = ''; }

  confirmFlag(): void {
    if (!this.flagTarget || !this.flagReason.trim()) return;
    const id = this.flagTarget.id;
    const reason = this.flagReason;
    this.api.post<any>('egg-collections/' + id + '/flag', { reason }).subscribe();
    this.entries.update(list => list.map(e => e.id === id
      ? { ...e, status: 'flagged' as EntryStatus, flagReason: reason }
      : e
    ));
    this.flagTarget = null;
    this.flagReason = '';
  }

  typeLabel(type: EntryType): string {
    const map: Record<EntryType, string> = {
      egg_collection: 'Egg Collection',
      feed_consumed:  'Feed Consumed',
      mortality:      'Mortality',
      damaged_eggs:   'Damaged Eggs',
    };
    return map[type];
  }

  typeIcon(type: EntryType): string {
    const map: Record<EntryType, string> = {
      egg_collection: 'egg',
      feed_consumed:  'grass',
      mortality:      'emergency',
      damaged_eggs:   'broken_image',
    };
    return map[type];
  }

  typeIconBg(type: EntryType): string {
    const map: Record<EntryType, string> = {
      egg_collection: 'bg-primary-fixed text-on-primary-fixed-variant',
      feed_consumed:  'bg-secondary-fixed text-on-secondary-fixed-variant',
      mortality:      'bg-error-container text-on-error-container',
      damaged_eggs:   'bg-error-container text-on-error-container',
    };
    return map[type];
  }

  statusChip(status: EntryStatus): string {
    const map: Record<EntryStatus, string> = {
      pending:  'bg-secondary-fixed text-on-secondary-fixed-variant',
      verified: 'bg-primary-fixed text-on-primary-fixed-variant',
      flagged:  'bg-secondary-container text-on-secondary-container',
      rejected: 'bg-error-container text-on-error-container',
    };
    return map[status];
  }

  statusBorder(status: EntryStatus): string {
    const map: Record<EntryStatus, string> = {
      pending:  'border-outline-variant',
      verified: 'border-primary-fixed',
      flagged:  'border-secondary',
      rejected: 'border-error',
    };
    return map[status];
  }
}

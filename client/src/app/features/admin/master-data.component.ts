import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MasterDataService } from '../../core/services/index';

interface Breed    { id: number; name: string; type: 'broiler' | 'layer' | 'dual'; origin: string; avgFcr: number; peakProdAge: number; active: boolean; }
interface FeedType { id: number; name: string; category: 'starter' | 'grower' | 'finisher' | 'layer'; ageFrom: number; ageTo: number; pricePerKg: number; active: boolean; }
interface Supplier { id: number; name: string; category: string; contact: string; phone: string; email: string; address: string; rating: number; active: boolean; }
interface Customer { id: number; name: string; type: 'wholesale' | 'retail' | 'restaurant'; contact: string; phone: string; email: string; creditLimit: number; balance: number; active: boolean; }
interface Medicine { id: number; name: string; type: string; activeIngredient: string; withdrawalDays: number; storageTemp: string; supplier: string; active: boolean; }

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-6xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/admin-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Master Data</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }} · Reference data management</p>
        </div>
      </div>

      <!-- Data category tabs -->
      <div class="flex gap-xs mb-lg border-b border-outline-variant overflow-x-auto pb-xs">
        @for (tab of dataTabs; track tab.key) {
          <button (click)="activeTab = tab.key"
                  class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px
                         whitespace-nowrap flex items-center gap-xs"
                  [class]="activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'">
            <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
            {{ tab.label }}
            <span class="ml-xs px-xs py-xs rounded-full text-[10px] bg-surface-container text-on-surface-variant font-normal">
              {{ tab.count }}
            </span>
          </button>
        }
      </div>

      <!-- ── Breeds ── -->
      @if (activeTab === 'breeds') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Poultry Breeds</h3>
            <button (click)="addBreed()"
                    class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg
                           text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>Add Breed
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-low">
                <tr>
                  @for (h of breedHeaders; track h) {
                    <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                @for (b of breeds(); track b.id) {
                  <tr class="hover:bg-surface-container-lowest transition-colors">
                    <td class="px-md py-md">
                      <input [(ngModel)]="b.name"
                             class="border border-outline-variant rounded-lg px-sm py-xs text-body-md w-32
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </td>
                    <td class="px-md py-md">
                      <select [(ngModel)]="b.type"
                              class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                     focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="broiler">Broiler</option>
                        <option value="layer">Layer</option>
                        <option value="dual">Dual purpose</option>
                      </select>
                    </td>
                    <td class="px-md py-md">
                      <input [(ngModel)]="b.origin"
                             class="border border-outline-variant rounded-lg px-sm py-xs text-body-md w-28
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </td>
                    <td class="px-md py-md">
                      <input type="number" [(ngModel)]="b.avgFcr" step="0.01"
                             class="w-20 text-center border border-outline-variant rounded-lg px-sm py-xs
                                    text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </td>
                    <td class="px-md py-md">
                      <div class="flex items-center gap-xs">
                        <input type="number" [(ngModel)]="b.peakProdAge"
                               class="w-16 text-center border border-outline-variant rounded-lg px-sm py-xs
                                      text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                        <span class="text-xs text-on-surface-variant">days</span>
                      </div>
                    </td>
                    <td class="px-md py-md">
                      <button (click)="b.active = !b.active"
                              class="relative w-10 h-5 rounded-full transition-all"
                              [class]="b.active ? 'bg-primary' : 'bg-surface-container-highest'">
                        <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                              [class]="b.active ? 'left-5' : 'left-0.5'"></span>
                      </button>
                    </td>
                    <td class="px-md py-md">
                      <button (click)="removeItem(breeds, b.id)"
                              class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── Feed Types ── -->
      @if (activeTab === 'feedtypes') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Feed Types</h3>
            <button (click)="addFeedType()"
                    class="flex items-center gap-xs bg-secondary text-on-secondary px-md py-xs rounded-lg
                           text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>Add Feed Type
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-low">
                <tr>
                  @for (h of feedHeaders; track h) {
                    <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                @for (f of feedTypes(); track f.id) {
                  <tr class="hover:bg-surface-container-lowest transition-colors">
                    <td class="px-md py-md">
                      <input [(ngModel)]="f.name"
                             class="border border-outline-variant rounded-lg px-sm py-xs text-body-md w-40
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </td>
                    <td class="px-md py-md">
                      <select [(ngModel)]="f.category"
                              class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                     focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="starter">Starter</option>
                        <option value="grower">Grower</option>
                        <option value="finisher">Finisher</option>
                        <option value="layer">Layer</option>
                      </select>
                    </td>
                    <td class="px-md py-md">
                      <div class="flex items-center gap-xs">
                        <input type="number" [(ngModel)]="f.ageFrom"
                               class="w-14 text-center border border-outline-variant rounded-lg px-xs py-xs text-body-md
                                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                        <span class="text-xs text-on-surface-variant">to</span>
                        <input type="number" [(ngModel)]="f.ageTo"
                               class="w-14 text-center border border-outline-variant rounded-lg px-xs py-xs text-body-md
                                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                        <span class="text-xs text-on-surface-variant">days</span>
                      </div>
                    </td>
                    <td class="px-md py-md">
                      <div class="flex items-center gap-xs">
                        <span class="text-on-surface-variant">₱</span>
                        <input type="number" [(ngModel)]="f.pricePerKg" step="0.50"
                               class="w-20 border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                        <span class="text-xs text-on-surface-variant">/kg</span>
                      </div>
                    </td>
                    <td class="px-md py-md">
                      <button (click)="f.active = !f.active"
                              class="relative w-10 h-5 rounded-full transition-all"
                              [class]="f.active ? 'bg-secondary' : 'bg-surface-container-highest'">
                        <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                              [class]="f.active ? 'left-5' : 'left-0.5'"></span>
                      </button>
                    </td>
                    <td class="px-md py-md">
                      <button (click)="removeItem(feedTypes, f.id)"
                              class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── Suppliers ── -->
      @if (activeTab === 'suppliers') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Suppliers</h3>
            <button class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>Add Supplier
            </button>
          </div>
          <div class="divide-y divide-outline-variant">
            @for (s of suppliers(); track s.id) {
              <div class="px-lg py-md hover:bg-surface-container-lowest transition-colors">
                <div class="flex items-start gap-md">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-tertiary-fixed">
                    <span class="material-symbols-outlined text-[20px] text-on-tertiary-fixed-variant"
                          style="font-variation-settings:'FILL' 1">local_shipping</span>
                  </div>
                  <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-md">
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Name</label>
                      <input [(ngModel)]="s.name"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Category</label>
                      <select [(ngModel)]="s.category"
                              class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md">
                        <option>Feed</option><option>Medicine</option><option>Supplies</option><option>Equipment</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Phone</label>
                      <input [(ngModel)]="s.phone"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Email</label>
                      <input type="email" [(ngModel)]="s.email"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                  </div>
                  <div class="flex items-center gap-sm flex-shrink-0">
                    <!-- Star rating -->
                    <div class="flex gap-xs">
                      @for (star of [1,2,3,4,5]; track star) {
                        <span (click)="s.rating = star"
                              class="material-symbols-outlined text-[18px] transition-colors cursor-pointer select-none"
                              [class]="star <= s.rating ? 'text-secondary-container' : 'text-outline-variant'"
                              [style]="star <= s.rating ? 'font-variation-settings:FILL 1' : 'font-variation-settings:FILL 0'">
                          star
                        </span>
                      }
                    </div>
                    <button (click)="removeItem(suppliers, s.id)"
                            class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── Customers ── -->
      @if (activeTab === 'customers') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Customers</h3>
            <button class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>Add Customer
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-low">
                <tr>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Customer</th>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Contact</th>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Credit Limit</th>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Balance</th>
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th class="px-md py-sm"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                @for (c of customers(); track c.id) {
                  <tr class="hover:bg-surface-container-lowest transition-colors">
                    <td class="px-md py-md">
                      <p class="font-bold text-on-surface text-sm">{{ c.name }}</p>
                      <p class="text-xs text-on-surface-variant">{{ c.email }}</p>
                    </td>
                    <td class="px-md py-md">
                      <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                            [class]="c.type === 'wholesale' ? 'bg-primary-fixed text-on-primary-fixed-variant'
                                   : c.type === 'restaurant' ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                   : 'bg-surface-container-highest text-on-surface'">
                        {{ c.type }}
                      </span>
                    </td>
                    <td class="px-md py-md text-sm text-on-surface-variant">{{ c.phone }}</td>
                    <td class="px-md py-md text-right">
                      <div class="flex items-center justify-end gap-xs">
                        <span class="text-on-surface-variant">₱</span>
                        <input type="number" [(ngModel)]="c.creditLimit"
                               class="w-24 text-right border border-outline-variant rounded-lg px-sm py-xs
                                      text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                      </div>
                    </td>
                    <td class="px-md py-md text-right">
                      <span class="font-bold" [class]="c.balance > 0 ? 'text-error' : 'text-primary'">
                        ₱{{ c.balance.toLocaleString() }}
                      </span>
                    </td>
                    <td class="px-md py-md">
                      <button (click)="c.active = !c.active"
                              class="relative w-10 h-5 rounded-full transition-all"
                              [class]="c.active ? 'bg-primary' : 'bg-surface-container-highest'">
                        <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                              [class]="c.active ? 'left-5' : 'left-0.5'"></span>
                      </button>
                    </td>
                    <td class="px-md py-md">
                      <button class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── Medicine List ── -->
      @if (activeTab === 'medicine') {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">Medicine & Vaccine List</h3>
            <button class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>Add Medicine
            </button>
          </div>
          <div class="divide-y divide-outline-variant">
            @for (m of medicines(); track m.id) {
              <div class="px-lg py-md hover:bg-surface-container-lowest transition-colors">
                <div class="flex items-start gap-md">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary-fixed">
                    <span class="material-symbols-outlined text-[20px] text-on-secondary-fixed-variant"
                          style="font-variation-settings:'FILL' 1">vaccines</span>
                  </div>
                  <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-md">
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Name</label>
                      <input [(ngModel)]="m.name"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Type</label>
                      <select [(ngModel)]="m.type"
                              class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md">
                        <option>Vaccine</option><option>Antibiotic</option><option>Vitamin</option>
                        <option>Antifungal</option><option>Antiparasitic</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Active Ingredient</label>
                      <input [(ngModel)]="m.activeIngredient"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Withdrawal (days)</label>
                      <input type="number" [(ngModel)]="m.withdrawalDays" min="0"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Storage Temp</label>
                      <input [(ngModel)]="m.storageTemp"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    </div>
                    <div>
                      <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-xs">Supplier</label>
                      <select [(ngModel)]="m.supplier"
                              class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md">
                        <option>VetCare PH</option><option>PhilVet</option><option>MedSupply PH</option>
                      </select>
                    </div>
                  </div>
                  <div class="flex flex-col gap-sm flex-shrink-0 items-end">
                    <button (click)="m.active = !m.active"
                            class="relative w-10 h-5 rounded-full transition-all"
                            [class]="m.active ? 'bg-primary' : 'bg-surface-container-highest'">
                      <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                            [class]="m.active ? 'left-5' : 'left-0.5'"></span>
                    </button>
                    <button (click)="removeItem(medicines, m.id)"
                            class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }



      <!-- Toast -->
      @if (toast()) {
        <div class="fixed bottom-xl right-lg bg-on-surface text-inverse-on-surface px-lg py-md rounded-xl
                    shadow-lg flex items-center gap-sm z-50">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">check_circle</span>
          {{ toast() }}
        </div>
      }


      @if (activeTab === 'eggprices') {
        <div class="space-y-md">

          <!-- Pricing summary strip -->
          <div class="grid grid-cols-5 gap-md">
            @for (size of eggSizes; track size.key) {
              <div class="bg-white border border-outline-variant rounded-2xl p-md text-center shadow-sm hover:shadow-md transition-all">
                <div class="px-sm py-xs rounded-lg text-label-md font-bold mb-sm mx-auto w-fit" [class]="size.color">{{ size.label }}</div>
                <div class="font-bold text-primary" style="font-size:22px">₱{{ size.pricePerEgg.toFixed(2) }}</div>
                <div class="text-[10px] text-on-surface-variant mt-xs">per egg</div>
                <div class="text-[11px] text-on-surface-variant mt-xs font-bold">₱{{ (size.pricePerEgg * 12).toFixed(2) }} / dozen</div>
              </div>
            }
          </div>

          <!-- Egg size standards & pricing table -->
          <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div class="px-lg py-md bg-primary text-on-primary flex items-center justify-between">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">egg</span>
                <h3 class="font-bold" style="font-size:16px">Egg Size Standards & Pricing</h3>
              </div>
              <span class="text-xs opacity-70">Changes apply to all new sales and reports</span>
            </div>
            <div class="grid grid-cols-12 gap-md px-lg py-sm bg-surface-container-low border-b border-outline-variant text-label-md text-on-surface-variant uppercase tracking-wider">
              <div class="col-span-2">Size</div>
              <div class="col-span-2 text-center">Min Weight</div>
              <div class="col-span-2 text-center">Max Weight</div>
              <div class="col-span-2 text-center">Price / Egg (₱)</div>
              <div class="col-span-2 text-center">Price / Dozen (₱)</div>
              <div class="col-span-2 text-center">Price / Tray (₱)</div>
            </div>
            <div class="divide-y divide-outline-variant">
              @for (size of eggSizes; track size.key) {
                <div class="grid grid-cols-12 gap-md items-center px-lg py-md hover:bg-surface-container-lowest transition-colors">
                  <div class="col-span-2">
                    <span class="px-md py-xs rounded-lg text-label-md font-bold inline-block" [class]="size.color">{{ size.label }}</span>
                  </div>
                  <div class="col-span-2">
                    <div class="flex items-center gap-xs justify-center">
                      <input type="number" [(ngModel)]="size.minGrams" min="1" max="999"
                             class="w-16 text-center border border-outline-variant rounded-lg px-sm py-xs text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary transition-colors"/>
                      <span class="text-xs text-on-surface-variant">g</span>
                    </div>
                  </div>
                  <div class="col-span-2">
                    <div class="flex items-center gap-xs justify-center">
                      <input type="number" [(ngModel)]="size.maxGrams" min="1"
                             class="w-16 text-center border border-outline-variant rounded-lg px-sm py-xs text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary transition-colors"/>
                      <span class="text-xs text-on-surface-variant">g</span>
                    </div>
                  </div>
                  <div class="col-span-2">
                    <div class="flex items-center gap-xs justify-center">
                      <span class="text-sm text-on-surface-variant font-bold">₱</span>
                      <input type="number" [(ngModel)]="size.pricePerEgg" min="0" step="0.01"
                             (ngModelChange)="onPriceChange()"
                             class="w-20 text-center border-2 rounded-lg px-sm py-xs text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                             [class]="size.pricePerEgg !== size.originalPrice ? 'border-secondary bg-secondary-fixed/20' : 'border-outline-variant hover:border-primary'"/>
                      @if (size.pricePerEgg !== size.originalPrice) {
                        <span class="text-[10px] text-secondary font-bold">●</span>
                      }
                    </div>
                  </div>
                  <div class="col-span-2 text-center">
                    <div class="font-bold text-primary">₱{{ (size.pricePerEgg * 12).toFixed(2) }}</div>
                    <div class="text-[10px] text-on-surface-variant">12 eggs</div>
                  </div>
                  <div class="col-span-2 text-center">
                    <div class="font-bold text-primary">₱{{ (size.pricePerEgg * 30).toFixed(2) }}</div>
                    <div class="text-[10px] text-on-surface-variant">30 eggs</div>
                  </div>
                </div>
              }
            </div>
            <div class="px-lg py-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
              <div class="text-xs text-on-surface-variant">
                @if (hasUnsavedPrices()) {
                  <span class="flex items-center gap-xs text-secondary font-bold">
                    <span class="material-symbols-outlined text-[14px]">edit</span>
                    {{ changedPriceCount() }} price(s) modified — save to apply
                  </span>
                } @else {
                  <span class="flex items-center gap-xs text-primary">
                    <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">check_circle</span>
                    All prices saved
                  </span>
                }
              </div>
              <div class="flex gap-sm">
                <button (click)="revertPrices()" [disabled]="!hasUnsavedPrices()"
                        class="px-md py-xs border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container transition-all disabled:opacity-40">
                  Revert
                </button>
                <button (click)="savePrices()" [disabled]="!hasUnsavedPrices()"
                        class="px-lg py-xs bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">save</span>
                  Save Prices
                </button>
              </div>
            </div>
          </div>

          <!-- Packaging reference -->
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-sm" style="font-size:16px">Packaging Price Reference</h3>
            <p class="text-body-md text-on-surface-variant mb-md">Auto-calculated from your egg prices above.</p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant">
                    <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Package Type</th>
                    @for (size of eggSizes; track size.key) {
                      <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-center">
                        <span class="px-xs py-xs rounded text-[10px] font-bold" [class]="size.color">{{ size.label }}</span>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant">
                  @for (pkg of packagingTypes; track pkg.label) {
                    <tr class="hover:bg-surface-container-lowest transition-colors">
                      <td class="px-md py-md">
                        <div class="flex items-center gap-sm">
                          <span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings:'FILL' 1">{{ pkg.icon }}</span>
                          <div>
                            <div class="font-bold text-on-surface text-sm">{{ pkg.label }}</div>
                            <div class="text-xs text-on-surface-variant">{{ pkg.qty }} eggs</div>
                          </div>
                        </div>
                      </td>
                      @for (size of eggSizes; track size.key) {
                        <td class="px-md py-md text-center">
                          <div class="font-bold text-primary">₱{{ (size.pricePerEgg * pkg.qty).toFixed(2) }}</div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          @if (weightRangeWarning()) {
            <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md flex items-center gap-md">
              <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[22px]" style="font-variation-settings:'FILL' 1">warning</span>
              <div>
                <p class="font-bold text-on-secondary-fixed-variant">Weight range overlap detected</p>
                <p class="text-xs text-on-secondary-fixed-variant mt-xs">{{ weightRangeWarning() }}</p>
              </div>
            </div>
          }

        </div>
      }

      <!-- Save row -->
      <div class="sticky bottom-0 mt-lg bg-white border border-outline-variant p-md
                  flex items-center justify-between rounded-2xl shadow-lg">
        <p class="text-body-md text-on-surface-variant">
          Changes are saved to this session. Connect to your API to persist.
        </p>
        <button (click)="saveAll()"
                class="flex items-center gap-sm bg-primary text-on-primary px-xl py-sm rounded-lg
                       text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">save</span>
          Save All Changes
        </button>
      </div>

    </div>
  `,
})

export class MasterDataComponent implements OnInit {
  private masterSvc = inject(MasterDataService);

  activeTab = 'breeds';
  toast     = signal('');

  // ── Data signals ──────────────────────────────────────────────────────────
  breeds    = signal<Breed[]>([
    { id:1, name:'Cobb 500',  type:'broiler', origin:'USA',      avgFcr:1.35, peakProdAge:35, active:true },
    { id:2, name:'Ross 308',  type:'broiler', origin:'Scotland', avgFcr:1.38, peakProdAge:33, active:true },
    { id:3, name:'Hubbard',   type:'dual',    origin:'France',   avgFcr:1.45, peakProdAge:40, active:true },
  ]);

  feedTypes = signal<FeedType[]>([
    { id:1, name:'Starter Mix (A)',    category:'starter',  ageFrom:0,  ageTo:14, pricePerKg:28.50, active:true },
    { id:2, name:'Starter Mix (B)',    category:'starter',  ageFrom:0,  ageTo:14, pricePerKg:26.00, active:true },
    { id:3, name:'Grower Pellets (A)', category:'grower',   ageFrom:15, ageTo:28, pricePerKg:24.00, active:true },
    { id:4, name:'Finisher Crumbles',  category:'finisher', ageFrom:29, ageTo:42, pricePerKg:22.50, active:true },
    { id:5, name:'Layer Mash Premium', category:'layer',    ageFrom:18, ageTo:99, pricePerKg:25.00, active:true },
  ]);

  suppliers = signal<Supplier[]>([
    { id:1, name:'AgriFeeds Corp',    category:'Feed',     contact:'Juan Reyes',   phone:'09171234567', email:'juan@agrifeeds.ph', address:'Bulacan',  rating:5, active:true },
    { id:2, name:'PrimeFeed Ltd',     category:'Feed',     contact:'Maria Cruz',   phone:'09281234567', email:'maria@primefeed.ph', address:'Pampanga', rating:4, active:true },
    { id:3, name:'NutriPro Supplies', category:'Feed',     contact:'Pedro Santos', phone:'09391234567', email:'pedro@nutripro.ph',  address:'Cavite',   rating:4, active:true },
    { id:4, name:'VetCare PH',        category:'Medicine', contact:'Dr. Bautista', phone:'09451234567', email:'vet@vetcare.ph',     address:'Manila',   rating:5, active:true },
    { id:5, name:'FarmCo Direct',     category:'Mixed',    contact:'Rosa Mendoza', phone:'09551234567', email:'rosa@farmco.ph',     address:'Laguna',   rating:3, active:true },
  ]);

  customers = signal<Customer[]>([
    { id:1, name:'Metro Fresh Market',     type:'wholesale',   contact:'Ana Lim',     phone:'09171111111', email:'ana@metro.ph',     creditLimit:50000, balance:12000, active:true },
    { id:2, name:'Sunrise Supermarket',    type:'wholesale',   contact:'Ben Cruz',    phone:'09282222222', email:'ben@sunrise.ph',   creditLimit:30000, balance:5000,  active:true },
    { id:3, name:'Casa Manila Restaurant', type:'restaurant',  contact:'Chef Reyes',  phone:'09393333333', email:'chef@casa.ph',     creditLimit:20000, balance:8000,  active:true },
    { id:4, name:'Green Market Retailer',  type:'retail',      contact:'Tess Santos', phone:'09454444444', email:'tess@green.ph',    creditLimit:10000, balance:0,     active:true },
    { id:5, name:'FarmGate Direct',        type:'retail',      contact:'Mike Delos',  phone:'09565555555', email:'mike@farmgate.ph', creditLimit:5000,  balance:2500,  active:true },
  ]);

  medicines = signal<Medicine[]>([
    { id:1, name:'Newcastle Vaccine (La Sota)', type:'Vaccine',    activeIngredient:'Live La Sota',   withdrawalDays:0,  storageTemp:'2-8°C',  supplier:'VetCare PH', active:true },
    { id:2, name:'Gumboro Vaccine',             type:'Vaccine',    activeIngredient:'Live IBD',       withdrawalDays:0,  storageTemp:'2-8°C',  supplier:'VetCare PH', active:true },
    { id:3, name:'Tetracycline 500mg',           type:'Antibiotic', activeIngredient:'Oxytetracycline',withdrawalDays:7,  storageTemp:'15-25°C',supplier:'VetCare PH', active:true },
    { id:4, name:'B-Complex Vitamins',           type:'Supplement', activeIngredient:'B1/B2/B6/B12',  withdrawalDays:0,  storageTemp:'15-25°C',supplier:'VetCare PH', active:true },
    { id:5, name:'Colistin Sulfate',             type:'Antibiotic', activeIngredient:'Colistin',      withdrawalDays:14, storageTemp:'15-25°C',supplier:'VetCare PH', active:true },
  ]);

  // ── ID counters ───────────────────────────────────────────────────────────
  private nextBreedId    = 4;
  private nextFeedId     = 6;
  private nextSupplierId = 6;
  private nextCustomerId = 6;
  private nextMedId      = 6;

  get dataTabs() {
    return [
      { key: 'breeds',    label: 'Breeds',              icon: 'cruelty_free',   count: this.breeds().length    },
      { key: 'feedtypes', label: 'Feed Types',           icon: 'grass',          count: this.feedTypes().length },
      { key: 'suppliers', label: 'Suppliers',            icon: 'local_shipping', count: this.suppliers().length },
      { key: 'customers', label: 'Customers',            icon: 'store',          count: this.customers().length },
      { key: 'medicine',  label: 'Medicine',             icon: 'vaccines',       count: this.medicines().length },
      { key: 'eggprices', label: 'Egg Prices & Sizes',  icon: 'egg',            count: 5                       },
    ];
  }

  breedHeaders  = ['Breed Name', 'Type', 'Origin', 'Avg FCR', 'Peak Age', 'Active', ''];
  feedHeaders   = ['Feed Name', 'Category', 'Bird Age Range', 'Price/kg', 'Active', ''];

  addBreed(): void {
    this.breeds.update(list => [...list, { id: this.nextBreedId++, name: 'New Breed', type: 'broiler', origin: '', avgFcr: 1.40, peakProdAge: 35, active: true }]);
  }

  addFeedType(): void {
    this.feedTypes.update(list => [...list, { id: this.nextFeedId++, name: 'New Feed Type', category: 'grower', ageFrom: 0, ageTo: 35, pricePerKg: 25, active: true }]);
  }

  addSupplier(): void {
    this.suppliers.update(list => [...list, { id: this.nextSupplierId++, name: 'New Supplier', category: 'Feed', contact: '', phone: '', email: '', address: '', rating: 3, active: true }]);
  }

  addCustomer(): void {
    this.customers.update(list => [...list, { id: this.nextCustomerId++, name: 'New Customer', type: 'retail', contact: '', phone: '', email: '', creditLimit: 5000, balance: 0, active: true }]);
  }

  deleteBreed(id: number): void    { this.breeds.update(l => l.filter(b => b.id !== id)); }
  deleteFeedType(id: number): void  { this.feedTypes.update(l => l.filter(f => f.id !== id)); }
  deleteSupplier(id: number): void  { this.suppliers.update(l => l.filter(s => s.id !== id)); }
  deleteCustomer(id: number): void  { this.customers.update(l => l.filter(c => c.id !== id)); }
  deleteMedicine(id: number): void  { this.medicines.update(l => l.filter(m => m.id !== id)); }

  ratingStars(r: number): number[] { return Array.from({ length: r }, (_, i) => i); }

  ngOnInit(): void {
    this.masterSvc.getBreeds().subscribe({    next:(data:any)=>{ if(data?.length) this.breeds.set(data);    }, error:()=>{} });
    this.masterSvc.getFeedTypes().subscribe({ next:(data:any)=>{ if(data?.length) this.feedTypes.set(data); }, error:()=>{} });
    this.masterSvc.getSuppliers().subscribe({ next:(data:any)=>{ if(data?.length) this.suppliers.set(data); }, error:()=>{} });
    this.masterSvc.getCustomers().subscribe({ next:(data:any)=>{ if(data?.length) this.customers.set(data); }, error:()=>{} });
    this.masterSvc.getMedicines().subscribe({ next:(data:any)=>{ if(data?.length) this.medicines.set(data); }, error:()=>{} });
  }

  saveAll(): void {
    this.breeds().forEach(b => {
      if (b.id > 3) this.masterSvc.createBreed(b).subscribe({ error:()=>{} });
      else          this.masterSvc.updateBreed(b.id, b).subscribe({ error:()=>{} });
    });
    this.feedTypes().forEach(f => {
      if (f.id > 5) this.masterSvc.createFeedType(f).subscribe({ error:()=>{} });
      else          this.masterSvc.updateFeedType(f.id, f).subscribe({ error:()=>{} });
    });
    this.suppliers().forEach(s => {
      if (s.id > 5) this.masterSvc.createSupplier(s).subscribe({ error:()=>{} });
      else          this.masterSvc.updateSupplier(s.id, s).subscribe({ error:()=>{} });
    });
    this.showToastNow('All master data saved successfully.');
  }

  showToastNow(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3500);
  }

  // ── Egg Prices & Sizes ────────────────────────────────────────────────────
  eggSizes = [
    { key:'small',       label:'Small',       minGrams:45,  maxGrams:52,  pricePerEgg:1.80, originalPrice:1.80, color:'bg-surface-container text-on-surface'               },
    { key:'medium',      label:'Medium',      minGrams:53,  maxGrams:62,  pricePerEgg:2.10, originalPrice:2.10, color:'bg-primary-fixed text-on-primary-fixed-variant'      },
    { key:'large',       label:'Large',       minGrams:63,  maxGrams:72,  pricePerEgg:2.50, originalPrice:2.50, color:'bg-primary text-on-primary'                         },
    { key:'extra_large', label:'Extra Large', minGrams:73,  maxGrams:84,  pricePerEgg:3.00, originalPrice:3.00, color:'bg-secondary-fixed text-on-secondary-fixed-variant'  },
    { key:'jumbo',       label:'Jumbo',       minGrams:85,  maxGrams:999, pricePerEgg:3.50, originalPrice:3.50, color:'bg-primary-container text-on-primary-container'      },
  ];

  packagingTypes = [
    { label:'Single Egg',  qty:1,   icon:'egg'         },
    { label:'Half Dozen',  qty:6,   icon:'egg'         },
    { label:'One Dozen',   qty:12,  icon:'inventory_2' },
    { label:'Tray (30)',   qty:30,  icon:'inventory_2' },
    { label:'Flat (36)',   qty:36,  icon:'inventory_2' },
    { label:'Case (360)',  qty:360, icon:'warehouse'   },
  ];

  onPriceChange(): void {}

  hasUnsavedPrices(): boolean {
    return this.eggSizes.some(s => s.pricePerEgg !== s.originalPrice);
  }

  changedPriceCount(): number {
    return this.eggSizes.filter(s => s.pricePerEgg !== s.originalPrice).length;
  }

  revertPrices(): void {
    this.eggSizes.forEach(s => s.pricePerEgg = s.originalPrice);
  }

  savePrices(): void {
    this.eggSizes.forEach(s => s.originalPrice = s.pricePerEgg);
    this.showToastNow('Egg prices saved successfully.');
  }

  weightRangeWarning(): string {
    for (let i = 0; i < this.eggSizes.length - 1; i++) {
      if (this.eggSizes[i].maxGrams >= this.eggSizes[i + 1].minGrams) {
        return this.eggSizes[i].label + ' max overlaps with ' + this.eggSizes[i + 1].label + ' min.';
      }
    }
    return '';
  }
  today = new Date().toLocaleDateString('en-PH', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  removeItem(sig: any, id: number): void {
    sig.update((list: any[]) => list.filter((x: any) => x.id !== id));
  }

}
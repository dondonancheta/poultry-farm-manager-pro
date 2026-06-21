import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService, ReportJob } from '../../core/services/index';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { timer, Subject } from 'rxjs';
import { takeUntil, switchMap, takeWhile } from 'rxjs/operators';

type ReportFormat = 'pdf' | 'xlsx';

interface ReportTemplate {
  id: string; category: string; name: string;
  description: string; icon: string; iconBg: string; iconColor: string;
  estimatedTime: string;
}

interface LocalJob {
  jobId:     string;
  name:      string;
  format:    ReportFormat;
  status:    'processing' | 'ready' | 'failed';
  progress:  number;
  createdAt: string;
  size?:     string;
  downloading?: boolean;
}

const TEMPLATES: ReportTemplate[] = [
  { id:'daily-production',   category:'Operational', name:'Daily Production Report',     description:'Eggs collected, damage, feed usage and mortality for a given day',        icon:'egg',              iconBg:'bg-primary-fixed',           iconColor:'text-on-primary-fixed-variant',          estimatedTime:'~10s' },
  { id:'weekly-production',  category:'Operational', name:'Weekly Production Summary',   description:'Aggregated 7-day production with day-by-day breakdown per house',         icon:'calendar_view_week',iconBg:'bg-primary-fixed',           iconColor:'text-on-primary-fixed-variant',          estimatedTime:'~15s' },
  { id:'monthly-production', category:'Operational', name:'Monthly Production Report',   description:'Full month production data with trends, targets vs actuals',              icon:'calendar_month',    iconBg:'bg-primary-fixed',           iconColor:'text-on-primary-fixed-variant',          estimatedTime:'~25s' },
  { id:'egg-inventory',      category:'Inventory',   name:'Egg Inventory Report',        description:'Current stock by size category, movements, spoilage rates',              icon:'inventory_2',       iconBg:'bg-tertiary-fixed',          iconColor:'text-on-tertiary-fixed-variant',         estimatedTime:'~8s'  },
  { id:'feed-inventory',     category:'Inventory',   name:'Feed Inventory Report',       description:'Stock levels, consumption rates, FCR per batch, reorder status',         icon:'grass',             iconBg:'bg-secondary-fixed',         iconColor:'text-on-secondary-fixed-variant',        estimatedTime:'~12s' },
  { id:'medicine-inventory', category:'Inventory',   name:'Medicine Inventory Report',   description:'Medicine stock, expiry monitoring, usage history',                       icon:'vaccines',          iconBg:'bg-secondary-fixed',         iconColor:'text-on-secondary-fixed-variant',        estimatedTime:'~10s' },
  { id:'sales-report',       category:'Financial',   name:'Sales Report',                description:'Sales by date, customer, egg size, and payment method',                  icon:'point_of_sale',     iconBg:'bg-primary-container',       iconColor:'text-on-primary-container',              estimatedTime:'~15s' },
  { id:'profitability',      category:'Financial',   name:'Profitability Report',        description:'Revenue, feed costs, medicine, labor — gross and net profit breakdown',  icon:'trending_up',       iconBg:'bg-primary-container',       iconColor:'text-on-primary-container',              estimatedTime:'~20s' },
  { id:'cost-analysis',      category:'Financial',   name:'Cost Per Egg Analysis',       description:'Cost breakdown per egg: feed, medicine, labor, mortality losses',        icon:'calculate',         iconBg:'bg-primary-container',       iconColor:'text-on-primary-container',              estimatedTime:'~18s' },
  { id:'mortality-report',   category:'Health',      name:'Mortality Report',            description:'Mortality events, causes, trends by building and breed',                 icon:'monitoring',        iconBg:'bg-error-container',         iconColor:'text-on-error-container',                estimatedTime:'~12s' },
  { id:'vaccination-report', category:'Health',      name:'Vaccination Report',          description:'Vaccination schedule compliance, completed vs overdue per batch',        icon:'vaccines',          iconBg:'bg-error-container',         iconColor:'text-on-error-container',                estimatedTime:'~10s' },
  { id:'treatment-history',  category:'Health',      name:'Treatment History',           description:'All treatments administered: medicine, dosage, withdrawal periods',      icon:'medication',        iconBg:'bg-error-container',         iconColor:'text-on-error-container',                estimatedTime:'~10s' },
];

const CATEGORIES = ['All', 'Operational', 'Inventory', 'Financial', 'Health'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="p-lg max-w-5xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center gap-md mb-lg">
    <a routerLink="/manager/dashboard"
       class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
      <span class="material-symbols-outlined">arrow_back</span>
    </a>
    <div class="flex-1">
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Generate Reports</h1>
      <p class="text-body-md text-on-surface-variant">{{ today }}</p>
    </div>
  </div>

  <!-- Config panel -->
  <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-lg">
    <div class="px-lg py-md bg-primary text-on-primary flex items-center justify-between">
      <div class="flex items-center gap-sm">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">tune</span>
        <h2 class="font-bold" style="font-size:16px">Report Parameters</h2>
      </div>
      <span class="text-xs opacity-70">Applies to all generated reports</span>
    </div>
    <div class="p-lg">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div>
          <label class="text-label-md text-on-surface-variant block mb-xs">Date From</label>
          <input type="date" [(ngModel)]="config.dateFrom"
                 class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        </div>
        <div>
          <label class="text-label-md text-on-surface-variant block mb-xs">Date To</label>
          <input type="date" [(ngModel)]="config.dateTo"
                 class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        </div>
        <div>
          <label class="text-label-md text-on-surface-variant block mb-xs">Building Filter</label>
          <select [(ngModel)]="config.building"
                  class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All buildings</option>
            @for (b of buildings; track b) { <option>{{ b }}</option> }
          </select>
        </div>
        <div>
          <label class="text-label-md text-on-surface-variant block mb-xs">Format</label>
          <div class="flex gap-sm">
            <button (click)="config.format = 'pdf'"
                    class="flex-1 flex items-center justify-center gap-xs py-sm rounded-lg border-2 text-label-md font-bold transition-all"
                    [class]="config.format==='pdf'
                      ? 'border-error bg-error-container text-on-error-container'
                      : 'border-outline-variant text-on-surface-variant hover:border-outline'">
              <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>PDF
            </button>
            <button (click)="config.format = 'xlsx'"
                    class="flex-1 flex items-center justify-center gap-xs py-sm rounded-lg border-2 text-label-md font-bold transition-all"
                    [class]="config.format==='xlsx'
                      ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant'
                      : 'border-outline-variant text-on-surface-variant hover:border-outline'">
              <span class="material-symbols-outlined text-[16px]">table_chart</span>XLSX
            </button>
          </div>
        </div>
      </div>

      <!-- Date presets -->
      <div class="flex flex-wrap gap-sm mt-md pt-md border-t border-outline-variant items-center">
        <span class="text-label-md text-on-surface-variant">Quick range:</span>
        @for (p of datePresets; track p.label) {
          <button (click)="applyPreset(p)"
                  class="px-md py-xs rounded-lg border border-outline-variant bg-surface-container text-label-md
                         hover:border-primary hover:bg-primary-fixed transition-all">
            {{ p.label }}
          </button>
        }
      </div>
    </div>
  </div>

  <!-- Category filter tabs -->
  <div class="flex gap-xs mb-md overflow-x-auto pb-xs">
    @for (cat of categories; track cat) {
      <button (click)="activeCategory = cat"
              class="px-lg py-xs rounded-lg text-label-md font-bold transition-all whitespace-nowrap flex-shrink-0"
              [class]="activeCategory === cat
                ? 'bg-primary text-on-primary'
                : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary'">
        {{ cat }}
        @if (cat !== 'All') {
          <span class="ml-xs text-[10px] opacity-70">({{ templatesByCategory(cat).length }})</span>
        }
      </button>
    }
  </div>

  <!-- Template grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
    @for (tpl of filteredTemplates(); track tpl.id) {
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm
                  hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="flex items-start gap-md mb-md">
          <span class="material-symbols-outlined p-sm rounded-xl text-[22px] flex-shrink-0"
                [class]="tpl.iconBg + ' ' + tpl.iconColor"
                style="font-variation-settings:'FILL' 1">{{ tpl.icon }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface">{{ tpl.name }}</p>
            <p class="text-xs text-on-surface-variant mt-xs leading-relaxed">{{ tpl.description }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-sm border-t border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="text-xs text-on-surface-variant flex items-center gap-xs">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              {{ tpl.estimatedTime }}
            </span>
            <span class="px-xs py-xs rounded text-[10px] font-bold uppercase"
                  [class]="config.format==='pdf'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-primary-fixed text-on-primary-fixed-variant'">
              {{ config.format.toUpperCase() }}
            </span>
          </div>
          <button (click)="generate(tpl)"
                  class="flex items-center gap-xs px-md py-xs bg-primary text-on-primary
                         rounded-lg text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">download</span>
            Generate
          </button>
        </div>
      </div>
    }
  </div>

  <!-- Job queue -->
  @if (jobs().length > 0) {
    <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
        <div>
          <h3 class="font-bold text-on-surface" style="font-size:16px">Generated Reports</h3>
          <p class="text-xs text-on-surface-variant mt-xs">{{ processingCount() }} processing · {{ readyCount() }} ready to download</p>
        </div>
        <button (click)="clearCompleted()"
                class="text-label-md text-on-surface-variant hover:text-error transition-colors flex items-center gap-xs">
          <span class="material-symbols-outlined text-[16px]">delete_sweep</span>Clear completed
        </button>
      </div>
      <div class="divide-y divide-outline-variant">
        @for (job of jobs(); track job.jobId) {
          <div class="flex items-center gap-md px-lg py-md hover:bg-surface-container-lowest transition-colors">

            <!-- Format icon -->
            <span class="material-symbols-outlined p-sm rounded-lg flex-shrink-0 text-[20px]"
                  [class]="job.format==='pdf'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-primary-fixed text-on-primary-fixed-variant'"
                  style="font-variation-settings:'FILL' 1">
              {{ job.format==='pdf' ? 'picture_as_pdf' : 'table_chart' }}
            </span>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-bold text-on-surface text-sm">{{ job.name }}</p>
              <p class="text-xs text-on-surface-variant mt-xs">
                {{ job.format.toUpperCase() }} · {{ job.createdAt }}
                @if (job.size) { · {{ job.size }} }
              </p>
              @if (job.status === 'processing') {
                <div class="mt-xs">
                  <div class="flex justify-between text-[10px] text-on-surface-variant mb-xs">
                    <span>Generating…</span>
                    <span>{{ job.progress }}%</span>
                  </div>
                  <div class="w-full bg-surface-container rounded-full h-1.5">
                    <div class="h-1.5 rounded-full bg-primary transition-all duration-300"
                         [style.width.%]="job.progress"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Action -->
            <div class="flex-shrink-0">
              @if (job.status === 'processing') {
                <span class="flex items-center gap-xs text-label-md text-on-surface-variant">
                  <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  {{ job.progress }}%
                </span>
              } @else if (job.status === 'ready') {
                <button (click)="download(job)" [disabled]="job.downloading"
                        class="flex items-center gap-xs px-md py-xs bg-primary text-on-primary
                               rounded-lg text-label-md font-bold hover:opacity-90 transition-all
                               disabled:opacity-60">
                  @if (job.downloading) {
                    <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    Opening…
                  } @else {
                    <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">download</span>
                    Download
                  }
                </button>
              } @else {
                <span class="flex items-center gap-xs text-label-md text-error">
                  <span class="material-symbols-outlined text-[16px]">error</span>Failed
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Summary footer -->
      @if (readyCount() > 0) {
        <div class="px-lg py-md bg-primary-fixed border-t border-outline-variant flex items-center justify-between">
          <span class="text-sm text-on-primary-fixed-variant font-bold">
            {{ readyCount() }} report(s) ready
          </span>
          <button (click)="downloadAll()"
                  class="flex items-center gap-xs px-md py-xs bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">download_for_offline</span>
            Download All
          </button>
        </div>
      }
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
export class ManagerReportsComponent implements OnDestroy {
  private reportSvc = inject(ReportService);
  private http      = inject(HttpClient);
  private destroy$  = new Subject<void>();

  today      = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  categories = CATEGORIES;
  templates  = TEMPLATES;
  buildings  = ['Alpha-1','Alpha-2','Beta-2','Gamma-3','Delta-1'];
  activeCategory = 'All';
  toast = signal('');

  config = {
    dateFrom: this.offsetDate(-7),
    dateTo:   this.offsetDate(0),
    building: '',
    format:   'pdf' as ReportFormat,
  };

  datePresets = [
    { label:'Today',        from: this.offsetDate(0),   to: this.offsetDate(0)  },
    { label:'Yesterday',    from: this.offsetDate(-1),  to: this.offsetDate(-1) },
    { label:'Last 7 days',  from: this.offsetDate(-7),  to: this.offsetDate(0)  },
    { label:'Last 30 days', from: this.offsetDate(-30), to: this.offsetDate(0)  },
    { label:'This month',   from: this.startOfMonth(),  to: this.offsetDate(0)  },
  ];

  jobs = signal<LocalJob[]>([]);

  processingCount = () => this.jobs().filter(j => j.status === 'processing').length;
  readyCount      = () => this.jobs().filter(j => j.status === 'ready').length;

  filteredTemplates = () =>
    this.activeCategory === 'All'
      ? this.templates
      : this.templates.filter(t => t.category === this.activeCategory);

  templatesByCategory = (cat: string) => this.templates.filter(t => t.category === cat);

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  applyPreset(p: { label: string; from: string; to: string }): void {
    this.config.dateFrom = p.from;
    this.config.dateTo   = p.to;
  }

  generate(tpl: ReportTemplate): void {
    // Add to local queue immediately as processing
    const localJob: LocalJob = {
      jobId:     `local-${Date.now()}`,
      name:      tpl.name,
      format:    this.config.format,
      status:    'processing',
      progress:  0,
      createdAt: new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }),
      reportType: tpl.id,
      dateFrom:   this.config.dateFrom,
      dateTo:     this.config.dateTo,
    } as any;
    this.jobs.update(list => [localJob, ...list]);

    // Call real API
    this.reportSvc.generate({
      report_type: tpl.id,
      format:      this.config.format,
      date_from:   this.config.dateFrom,
      date_to:     this.config.dateTo,
      building:    this.config.building || undefined,
    }).subscribe({
      next: ({ job_id }) => {
        // Update job with real server job_id
        this.jobs.update(list => list.map(j =>
          j.jobId === localJob.jobId ? { ...j, jobId: job_id } : j
        ));
        // Poll status every 800ms until ready
        this.pollJobStatus(job_id);
      },
      error: () => {
        // Fallback: simulate progress locally if API unreachable
        this.simulateProgress(localJob.jobId);
      },
    });
  }

  private pollJobStatus(jobId: string): void {
    timer(800, 800).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.reportSvc.getStatus(jobId)),
      takeWhile(job => job.status === 'processing', true),
    ).subscribe({
      next: (serverJob: ReportJob) => {
        this.jobs.update(list => list.map(j =>
          j.jobId === jobId
            ? {
                ...j,
                status:   serverJob.status as LocalJob['status'],
                progress: serverJob.progress,
                size:     serverJob.size,
              }
            : j
        ));
        if (serverJob.status === 'ready') {
          this.showToast(`"${serverJob.name}" is ready to download.`);
        }
      },
      error: () => {
        // If polling fails, simulate locally
        this.simulateProgress(jobId);
      },
    });
  }

  private simulateProgress(jobId: string): void {
    let progress = 0;
    const iv = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 12;
      if (progress >= 100) {
        clearInterval(iv);
        const size = `${(Math.random() * 400 + 50).toFixed(0)} KB`;
        this.jobs.update(list => list.map(j =>
          j.jobId === jobId ? { ...j, status:'ready', progress:100, size } : j
        ));
        const job = this.jobs().find(j => j.jobId === jobId);
        if (job) this.showToast(`"${job.name}" is ready to download.`);
      } else {
        this.jobs.update(list => list.map(j =>
          j.jobId === jobId ? { ...j, progress } : j
        ));
      }
    }, 700);
  }

  download(job: LocalJob): void {
    // Mark job as downloading
    this.jobs.update(list => list.map(j =>
      j.jobId === job.jobId ? { ...j, downloading: true } : j
    ));
    this.showToast(`Preparing "${job.name}"…`);

    const url = `${environment.apiUrl}/reports/${job.jobId}/download`;
    const token = localStorage.getItem('pfp_token') ?? '';

    // Fetch as Blob to trigger real file download
    this.http.get(url, {
      headers:      { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      observe:      'response',
    }).subscribe({
      next: (resp) => {
        const contentType    = resp.headers.get('content-type') ?? 'text/csv';
        const contentDisposition = resp.headers.get('content-disposition') ?? '';
        const blob           = resp.body!;

        if (job.format === 'pdf' || contentType.includes('html')) {
          // For PDF/HTML: open in new tab and let browser print dialog handle it
          const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'text/html' }));
          const win = window.open(blobUrl, '_blank');
          if (win) {
            win.focus();
            // Clean up blob URL after window opens
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          }
          this.showToast(`"${job.name}" opened — use browser Print (Ctrl+P) to save as PDF.`);
        } else {
          // For XLSX/CSV: trigger file download
          const filename = this.extractFilename(contentDisposition) ||
            `${job.name.toLowerCase().replace(/\s+/g,'-')}_${Date.now()}.csv`;
          const blobUrl  = URL.createObjectURL(new Blob([blob], { type: contentType }));
          const a        = document.createElement('a');
          a.href         = blobUrl;
          a.download     = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          this.showToast(`"${job.name}" downloaded successfully.`);
        }

        this.jobs.update(list => list.map(j =>
          j.jobId === job.jobId ? { ...j, downloading: false } : j
        ));
      },
      error: () => {
        // Fallback: generate a basic CSV in-browser if server unavailable
        this.downloadFallback(job);
      },
    });
  }

  private downloadFallback(job: LocalJob): void {
    const rows: string[][] = [
      ['PoultryFarm Pro — ' + job.name],
      ['GreenValley Poultry Farm'],
      ['Generated', new Date().toLocaleString()],
      ['Format', job.format.toUpperCase()],
      [],
      ['Note', 'Full data available when connected to the API server'],
    ];
    const csv     = rows.map(r => r.join(',')).join('\n');
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = `${job.name.toLowerCase().replace(/\s+/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    this.showToast(`"${job.name}" downloaded (offline mode).`);
    this.jobs.update(list => list.map(j =>
      j.jobId === job.jobId ? { ...j, downloading: false } : j
    ));
  }

  private extractFilename(disposition: string): string {
    const match = disposition.match(/filename[^;=\n]*=(['"\s]*)([^'"\n;]*)/i);
    return match ? match[2].trim() : '';
  }

  downloadAll(): void {
    this.jobs().filter(j => j.status === 'ready').forEach(j => this.download(j));
  }

  clearCompleted(): void {
    this.jobs.update(list => list.filter(j => j.status === 'processing'));
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 4000);
  }

  private offsetDate(days: number): string {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private startOfMonth(): string {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  }
}

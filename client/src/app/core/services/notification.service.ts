import { Injectable, signal, computed, inject } from '@angular/core';
import { interval, Subject, forkJoin } from 'rxjs';
import { takeUntil, startWith, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';

export type AlertLevel    = 'critical' | 'warning' | 'info' | 'success';
export type AlertCategory = 'mortality' | 'feed' | 'medicine' | 'eggs' | 'production' | 'sales' | 'system' | 'vaccination' | 'health';

export interface AppNotification {
  id:       string;
  level:    AlertLevel;
  category: AlertCategory;
  icon:     string;
  title:    string;
  message:  string;
  time:     string;
  read:     boolean;
  route?:   string;
  batch?:   string;
  building?:string;
  forRoles: string[];
}

// Seeded fallback — used until GET /api/notifications responds
const SEEDED: AppNotification[] = [
  { id:'n1',  level:'critical', category:'mortality',   icon:'emergency',    title:'Mortality Spike — Alpha-2',          message:'B-2024-005 reported 7 bird deaths (3.0%). Exceeds 2% threshold.',        time:'2h ago',    read:false, route:'/flocks',            batch:'B-2024-005', building:'Alpha-2', forRoles:['admin','manager','supervisor'] },
  { id:'n2',  level:'critical', category:'health',      icon:'warning',      title:'FCR Critical — Alpha-2',             message:'B-2024-005 FCR is 1.68, above the 1.6 threshold. Review feed schedule.',  time:'3h ago',    read:false, route:'/manager/analytics', batch:'B-2024-005', building:'Alpha-2', forRoles:['admin','manager'] },
  { id:'n3',  level:'warning',  category:'vaccination', icon:'vaccines',     title:'Vaccination Overdue — Delta-1',      message:"B-2024-004 Marek's Disease Stage 2 is 2 days overdue. Act now.",          time:'1 day ago',  read:false, route:'/health',            batch:'B-2024-004', building:'Delta-1', forRoles:['admin','manager','supervisor'] },
  { id:'n4',  level:'warning',  category:'feed',        icon:'inventory_2',  title:'Feed Stock Low — Finisher Crumbles', message:'950 kg remaining (19%). Reorder threshold is 1,000 kg.',                 time:'5h ago',    read:false, route:'/feed',                                             forRoles:['admin','manager','supervisor'] },
  { id:'n5',  level:'warning',  category:'feed',        icon:'inventory_2',  title:'Feed Stock Low — Starter Mix (B)',   message:'1,800 kg remaining (18%). Estimated 4 days of supply left.',             time:'5h ago',    read:true,  route:'/feed',                                             forRoles:['admin','manager','supervisor'] },
  { id:'n6',  level:'warning',  category:'health',      icon:'schedule',     title:'Withdrawal Period Active',           message:'B-2024-001 — Tetracycline. Egg withdrawal ends in 7 days. Do not sell.', time:'8:00 AM',   read:false, route:'/health',            batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','manager','supervisor','worker'] },
  { id:'n7',  level:'info',     category:'vaccination', icon:'vaccines',     title:'Vaccination Due Tomorrow',           message:'B-2024-001 Newcastle Stage 3 scheduled for tomorrow.',                   time:'6h ago',    read:true,  route:'/health',            batch:'B-2024-001',                    forRoles:['admin','manager','supervisor'] },
  { id:'n8',  level:'info',     category:'feed',        icon:'grass',        title:'Feed Delivery Received',             message:'2,000 kg Starter Mix (B) received from AgriFeeds Corp.',                time:'Yesterday', read:true,  route:'/feed',                                             forRoles:['admin','manager','supervisor'] },
  { id:'n9',  level:'success',  category:'production',  icon:'task_alt',     title:'8 Entries Verified',                 message:'Maria Santos verified 8 production entries for today.',                  time:'8h ago',    read:true,  route:'/eggs',                                             forRoles:['admin','manager','supervisor','worker'] },
  { id:'n10', level:'success',  category:'eggs',        icon:'egg',          title:'Daily Target Met — Beta-2',          message:'B-2024-002 collected 1,480 eggs — exceeds 1,200 target.',                time:'9h ago',    read:true,  route:'/eggs',              batch:'B-2024-002', building:'Beta-2', forRoles:['admin','manager','supervisor','worker'] },
  { id:'n11', level:'info',     category:'sales',       icon:'trending_up',  title:'Monthly Revenue Milestone',          message:'Farm reached ₱100,000 in monthly revenue — 3 days ahead of last month.', time:'2d ago',   read:true,  route:'/sales',                                            forRoles:['admin','manager'] },
  { id:'n12', level:'success',  category:'vaccination', icon:'check_circle', title:'Gumboro Vaccination Complete',       message:'B-2024-002 Gumboro Stage 2 completed for all 15,000 birds.',            time:'Today',     read:false, route:'/health',            batch:'B-2024-002', building:'Beta-2', forRoles:['admin','manager','supervisor'] },
  { id:'n13', level:'info',     category:'eggs',        icon:'egg_alt',      title:'Damaged Egg Report Logged',          message:'Worker logged 12 cracked eggs in Alpha-1. Batch B-2024-001.',            time:'30m ago',   read:false, route:'/eggs',              batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','manager','supervisor','worker'] },
  { id:'n14', level:'info',     category:'system',      icon:'settings',     title:'Egg Prices Updated',                 message:'Admin updated egg pricing: Large ₱2.50, Extra Large ₱3.00.',             time:'1d ago',    read:true,  route:'/admin/settings',                                   forRoles:['admin','manager'] },
  { id:'n15', level:'warning',  category:'health',      icon:'medication',   title:'Medicine Stock Low — Gumboro',       message:'Gumboro vaccine: 50 doses remaining (25%). Reorder recommended.',        time:'12h ago',   read:false, route:'/health',                                           forRoles:['admin','manager','supervisor'] },
  { id:'n16', level:'info',     category:'production',  icon:'grass',        title:'Feed Log Submitted',                 message:'Juan dela Cruz submitted feed log for Alpha-1 — 450 kg Starter A.',      time:'6:30 AM',   read:true,  route:'/feed',              batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','supervisor'] },
  { id:'n17', level:'success',  category:'eggs',        icon:'egg',          title:'Collection Complete — All Houses',   message:'All 5 houses have submitted egg collection for today.',                   time:'8:00 AM',   read:false, route:'/eggs',                                             forRoles:['admin','manager','supervisor'] },
];

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api      = inject(ApiService);
  private auth     = inject(AuthService);
  private destroy$ = new Subject<void>();

  private allAlerts = signal<AppNotification[]>(SEEDED);
  private apiLoaded = signal(false);   // true once GET /api/notifications succeeds
  private nextId    = 100;

  // ── Public computed ─────────────────────────────────────────────────────────
  myAlerts = computed(() => {
    const role = this.auth.user()?.role ?? 'worker';
    return this.allAlerts().filter(a => a.forRoles.includes(role));
  });

  unreadCount   = computed(() => this.myAlerts().filter(a => !a.read).length);
  criticalCount = computed(() => this.myAlerts().filter(a => a.level === 'critical' && !a.read).length);
  recentAlerts  = computed(() => this.myAlerts().slice(0, 5));

  constructor() {
    // Step 1: Load persisted notifications from API immediately on service init
    this.loadFromApi();

    // Step 2: Poll inventory + vaccination alerts every 5 minutes
    interval(5 * 60 * 1000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() =>
        forkJoin({
          inventory:    this.api.get<any[]>('inventory/alerts').pipe(catchError(() => of([]))),
          vaccinations: this.api.get<any[]>('vaccinations').pipe(catchError(() => of([]))),
        })
      ),
    ).subscribe(({ inventory, vaccinations }) => {
      const incoming: AppNotification[] = [];

      (inventory || []).forEach((item: any, i: number) => {
        const id = `inv-${item.id ?? i}`;
        if (this.allAlerts().some(a => a.id === id)) return;
        incoming.push({
          id,
          level:    item.current <= (item.threshold ?? item.minThreshold) * 0.5 ? 'critical' : 'warning',
          category: item.category === 'medicine' ? 'medicine' : 'feed',
          icon:     item.category === 'medicine' ? 'medication' : 'inventory_2',
          title:    `${item.name} ${item.level === 'critical' ? 'critically low' : 'running low'}`,
          message:  `${item.current} ${item.unit} remaining (below ${item.threshold ?? item.minThreshold} ${item.unit} threshold)`,
          time:     'Just now',
          read:     false,
          route:    item.category === 'medicine' ? '/health' : '/feed',
          forRoles: ['admin', 'manager', 'supervisor'],
        });
      });

      (vaccinations || [])
        .filter((v: any) => v.status === 'overdue')
        .forEach((v: any) => {
          const id = `vacc-overdue-${v.id}`;
          if (this.allAlerts().some(a => a.id === id)) return;
          incoming.push({
            id,
            level:    'critical',
            category: 'vaccination',
            icon:     'vaccines',
            title:    `Vaccination Overdue — ${v.building ?? v.batch}`,
            message:  `${v.vaccineName} for batch ${v.batchCode ?? v.batch} is overdue.`,
            time:     'Now',
            read:     false,
            route:    '/health',
            batch:    v.batchCode ?? v.batch,
            building: v.building,
            forRoles: ['admin', 'manager', 'supervisor'],
          });
        });

      if (incoming.length) {
        this.allAlerts.update(list => [...incoming, ...list].slice(0, 100));
      }
    });
  }

  // ── Load from API (with server-persisted read state) ─────────────────────
  private loadFromApi(): void {
    this.api.get<{ data: AppNotification[] }>('notifications').pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (!res?.data?.length) return;

      // Merge API notifications with seeded ones:
      // API data wins on read state; seeded data fills in forRoles (not in API response)
      const apiMap = new Map(res.data.map(n => [n.id, n]));

      this.allAlerts.update(existing => {
        // Update read state on existing seeded notifications from API data
        const updated = existing.map(e => {
          const api = apiMap.get(e.id);
          return api ? { ...e, read: api.read } : e;
        });

        // Add any API notifications not in seeded list (dynamically created by server)
        const existingIds = new Set(existing.map(e => e.id));
        const newFromApi  = res.data
          .filter(n => !existingIds.has(n.id))
          .map(n => ({ ...n, forRoles: n.forRoles ?? ['admin'] }));

        return [...newFromApi, ...updated];
      });

      this.apiLoaded.set(true);
    });
  }

  // ── Mark read (updates signal + persists to API) ─────────────────────────
  markRead(id: string): void {
    this.allAlerts.update(list => list.map(a => a.id === id ? { ...a, read: true } : a));
    this.api.post<any>('notifications/read', { id }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  markReadBatch(ids: string[]): void {
    this.allAlerts.update(list =>
      list.map(a => ids.includes(a.id) ? { ...a, read: true } : a)
    );
    this.api.post<any>('notifications/read', { id: ids }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  markAllRead(): void {
    const role = this.auth.user()?.role ?? 'worker';
    this.allAlerts.update(list =>
      list.map(a => a.forRoles.includes(role) ? { ...a, read: true } : a)
    );
    this.api.post<any>('notifications/read-all', { role }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  /** Push a new alert from any component */
  push(alert: Omit<AppNotification, 'id' | 'read' | 'time'>): void {
    this.allAlerts.update(list => [{
      ...alert,
      id:   `push-${this.nextId++}`,
      read: false,
      time: 'Just now',
    }, ...list]);
  }

  destroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}

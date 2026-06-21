import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/index';
import { DashboardService } from '../../core/services/dashboard.service';

interface RecentUser { id:number; name:string; email:string; role:string; status:'active'|'inactive'; lastLogin:string; }
interface AdminKpi    { label:string; value:string|number; color:string; icon:string; iconBg:string; sub:string; route:string; }
interface QuickAction { label:string; icon:string; iconBg:string; iconColor:string; route:string; desc:string; }
interface ActivityItem { id:string; icon:string; iconColor:string; message:string; user:string; time:string; }

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="p-lg max-w-5xl mx-auto pb-xl space-y-gutter">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-bold text-primary" style="font-size:28px;line-height:36px">Administration Panel</h1>
      <p class="text-body-md text-on-surface-variant mt-xs">
        {{ today }} · Logged in as <strong>{{ adminName }}</strong>
      </p>
    </div>
    <div class="flex gap-sm">
      <a routerLink="/admin/users"
         class="flex items-center gap-sm border border-outline text-on-surface px-md py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">people</span>Users
      </a>
      <a routerLink="/admin/master-data"
         class="flex items-center gap-sm border border-outline text-on-surface px-md py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">database</span>Master Data
      </a>
      <a routerLink="/admin/settings"
         class="flex items-center gap-sm bg-primary text-on-primary px-md py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]">settings</span>Settings
      </a>
    </div>
  </div>

  <!-- System KPIs from live data -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
    @for (kpi of kpis(); track kpi.label) {
      <a [routerLink]="kpi.route"
         class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block">
        <div class="flex items-start justify-between mb-md">
          <span class="material-symbols-outlined p-sm rounded-xl text-[22px] flex-shrink-0"
                [class]="kpi.iconBg" style="font-variation-settings:'FILL' 1">{{ kpi.icon }}</span>
          <span class="text-[10px] text-on-surface-variant">{{ kpi.sub }}</span>
        </div>
        <div class="font-bold" [class]="kpi.color" style="font-size:26px;line-height:32px">{{ kpi.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wider mt-xs">{{ kpi.label }}</div>
      </a>
    }
  </div>

  <!-- Quick actions grid -->
  <div>
    <h2 class="font-bold text-on-surface mb-md" style="font-size:16px">Quick Actions</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
      @for (action of quickActions; track action.label) {
        <a [routerLink]="action.route"
           class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm hover:shadow-md
                  hover:-translate-y-0.5 transition-all text-center block">
          <div class="w-12 h-12 rounded-xl mx-auto mb-md flex items-center justify-center"
               [class]="action.iconBg">
            <span class="material-symbols-outlined text-[22px]" [class]="action.iconColor"
                  style="font-variation-settings:'FILL' 1">{{ action.icon }}</span>
          </div>
          <p class="font-bold text-on-surface text-sm">{{ action.label }}</p>
          <p class="text-xs text-on-surface-variant mt-xs">{{ action.desc }}</p>
        </a>
      }
    </div>
  </div>

  <!-- Content grid: user table + activity + system info -->
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-gutter">

    <!-- Recent users (3/5) -->
    <div class="lg:col-span-3 bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
        <h3 class="font-bold text-on-surface" style="font-size:15px">User Accounts</h3>
        <a routerLink="/admin/users"
           class="text-label-md text-primary font-bold hover:underline flex items-center gap-xs">
          <span class="material-symbols-outlined text-[14px]">arrow_forward</span>Manage All
        </a>
      </div>
      @if (loadingUsers()) {
        <div class="p-xl text-center text-on-surface-variant flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined animate-spin text-[20px]">refresh</span> Loading users...
        </div>
      } @else {
        <div class="divide-y divide-outline-variant">
          @for (user of recentUsers(); track user.id) {
            <div class="flex items-center gap-md px-lg py-md hover:bg-surface-container-lowest transition-colors">
              <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                   [class]="roleAvatar(user.role)">
                {{ initials(user.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-on-surface text-sm truncate">{{ user.name }}</p>
                <p class="text-xs text-on-surface-variant truncate">{{ user.email }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase block mb-xs"
                      [class]="roleBadge(user.role)">{{ user.role }}</span>
                <div class="flex items-center gap-xs justify-end">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="user.status==='active' ? 'bg-primary' : 'bg-outline'"></span>
                  <span class="text-[10px] text-on-surface-variant capitalize">{{ user.status }}</span>
                </div>
              </div>
              <a routerLink="/admin/users"
                 class="p-xs hover:bg-primary-fixed rounded-lg transition-colors text-on-surface-variant hover:text-primary flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </a>
            </div>
          }
        </div>
        <!-- Role distribution bar -->
        <div class="px-lg py-md border-t border-outline-variant bg-surface-container-lowest">
          <p class="text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Role Distribution</p>
          <div class="flex gap-xs items-center h-4 rounded-full overflow-hidden">
            @for (seg of roleSegments(); track seg.role) {
              <div class="h-full transition-all" [class]="seg.color" [style.width.%]="seg.pct" [title]="seg.role + ': ' + seg.count"></div>
            }
          </div>
          <div class="flex gap-md mt-sm flex-wrap">
            @for (seg of roleSegments(); track seg.role) {
              <div class="flex items-center gap-xs">
                <span class="w-2.5 h-2.5 rounded-sm" [class]="seg.color"></span>
                <span class="text-[11px] text-on-surface-variant capitalize">{{ seg.role }} ({{ seg.count }})</span>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Activity + System info (2/5) -->
    <div class="lg:col-span-2 space-y-md">
      <!-- Recent activity -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:15px">Recent Activity</h3>
        </div>
        <div class="divide-y divide-outline-variant">
          @for (act of activityItems(); track act.id) {
            <div class="flex items-start gap-sm px-lg py-sm hover:bg-surface-container-lowest transition-colors">
              <span class="material-symbols-outlined text-[16px] flex-shrink-0 mt-xs"
                    [class]="act.iconColor" style="font-variation-settings:'FILL' 1">{{ act.icon }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-on-surface leading-relaxed">{{ act.message }}</p>
                <p class="text-[10px] text-on-surface-variant mt-xs">{{ act.user }} · {{ act.time }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- System info -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">System Info</h3>
        <div class="space-y-sm">
          @for (info of sysInfo; track info.label) {
            <div class="flex justify-between items-center py-xs border-b border-outline-variant last:border-0">
              <span class="text-xs text-on-surface-variant">{{ info.label }}</span>
              <span class="text-xs font-bold text-on-surface">{{ info.value }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Settings quick links -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">Quick Settings</h3>
        <div class="space-y-xs">
          @for (s of settingsLinks; track s.label) {
            <a [routerLink]="s.route"
               class="flex items-center gap-sm p-sm rounded-xl hover:bg-surface-container transition-colors block">
              <span class="material-symbols-outlined p-xs rounded-lg text-[18px] flex-shrink-0"
                    [class]="s.iconClass" style="font-variation-settings:'FILL' 1">{{ s.icon }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-on-surface text-sm">{{ s.label }}</p>
                <p class="text-[11px] text-on-surface-variant">{{ s.desc }}</p>
              </div>
              <span class="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
            </a>
          }
        </div>
      </div>
    </div>
  </div>
</div>
  `,
})
export class AdminHomeComponent implements OnInit {
  private userSvc  = inject(UserService);
  private dashSvc  = inject(DashboardService);

  today     = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  adminName = 'Ana Reyes';
  loadingUsers = signal(true);
  users     = signal<RecentUser[]>([]);
  dashKpis  = signal<any>(null);

  // ── Computed ────────────────────────────────────────────────────────────────
  recentUsers = computed(() => this.users().slice(0,6));

  kpis = computed((): AdminKpi[] => {
    const u = this.users();
    const k = this.dashKpis();
    return [
      { label:'Total Users',   value: u.length || 8,           color:'text-primary',   icon:'people',             iconBg:'bg-primary-fixed text-on-primary-fixed-variant',              sub:'All roles',        route:'/admin/users' },
      { label:'Active Users',  value: u.filter(x=>x.status==='active').length || 7, color:'text-primary', icon:'person',    iconBg:'bg-primary-fixed text-on-primary-fixed-variant',   sub:'Currently active', route:'/admin/users' },
      { label:'Today\'s Eggs', value: k ? (k.today_eggs||12720).toLocaleString() : '12,720', color:'text-secondary', icon:'egg', iconBg:'bg-secondary-fixed text-on-secondary-fixed-variant', sub:'All houses', route:'/eggs' },
      { label:'Active Flocks', value: k?.active_flocks || 4,   color:'text-on-surface',icon:'groups',             iconBg:'bg-surface-container text-on-surface-variant',                sub:'Farm-wide',        route:'/flocks' },
    ];
  });

  roleSegments = computed(() => {
    const u = this.users();
    const total = u.length || 1;
    const counts: Record<string,number> = {};
    u.forEach(x => counts[x.role] = (counts[x.role]||0) + 1);
    const colors: Record<string,string> = { admin:'bg-primary-container', manager:'bg-tertiary-fixed', supervisor:'bg-secondary-fixed', worker:'bg-primary-fixed' };
    return Object.entries(counts).map(([role,count]) => ({
      role, count, pct: Math.round(count/total*100), color: colors[role]||'bg-surface-container'
    }));
  });

  activityItems = computed((): ActivityItem[] => [
    { id:'a1', icon:'person_add',   iconColor:'text-primary',   message:'New user Carlos Bautista added to Delta-1',    user:'Ana Reyes (Admin)',  time:'2 hours ago' },
    { id:'a2', icon:'settings',     iconColor:'text-secondary', message:'Egg prices updated — Large ₱2.50, XL ₱3.00',  user:'Ana Reyes (Admin)',  time:'Yesterday'   },
    { id:'a3', icon:'people',       iconColor:'text-on-surface-variant', message:'User Rosa Mendoza status changed to inactive', user:'Ana Reyes (Admin)', time:'2 days ago' },
    { id:'a4', icon:'egg',          iconColor:'text-primary',   message:'Egg size standards updated for all categories', user:'Ana Reyes (Admin)',  time:'3 days ago'  },
    { id:'a5', icon:'local_shipping',iconColor:'text-tertiary', message:'New supplier AgriFeeds Corp added to master data',user:'Johnathan Aris (Manager)','time':'4 days ago'},
  ]);

  // ── Static data ──────────────────────────────────────────────────────────────
  quickActions: QuickAction[] = [
    { label:'User Management', icon:'manage_accounts', iconBg:'bg-primary-fixed',     iconColor:'text-on-primary-fixed-variant',          route:'/admin/users',       desc:'Create, edit, manage access' },
    { label:'System Settings', icon:'settings',        iconBg:'bg-secondary-fixed',   iconColor:'text-on-secondary-fixed-variant',        route:'/admin/settings',    desc:'Farm info, alerts, egg prices' },
    { label:'Master Data',     icon:'database',        iconBg:'bg-tertiary-fixed',    iconColor:'text-on-tertiary-fixed-variant',         route:'/admin/master-data', desc:'Breeds, suppliers, medicines' },
    { label:'Farm Management', icon:'agriculture',     iconBg:'bg-surface-container', iconColor:'text-on-surface',                        route:'/farm',              desc:'Buildings, occupancy' },
    { label:'Egg Production',  icon:'egg',             iconBg:'bg-primary-fixed',     iconColor:'text-on-primary-fixed-variant',          route:'/eggs',              desc:'Production records' },
    { label:'Analytics',       icon:'leaderboard',     iconBg:'bg-secondary-fixed',   iconColor:'text-on-secondary-fixed-variant',        route:'/manager/analytics', desc:'Production trends, FCR' },
    { label:'Reports',         icon:'assessment',      iconBg:'bg-tertiary-fixed',    iconColor:'text-on-tertiary-fixed-variant',         route:'/manager/reports',   desc:'Generate PDF/XLSX reports' },
    { label:'Notifications',   icon:'notifications',   iconBg:'bg-error-container',   iconColor:'text-on-error-container',               route:'/notifications',     desc:'Alerts and system events' },
  ];

  settingsLinks = [
    { icon:'home_health',    iconClass:'bg-primary-fixed text-on-primary-fixed-variant',          label:'Farm Buildings',    desc:'6 houses configured',        route:'/admin/settings' },
    { icon:'egg',            iconClass:'bg-primary-fixed text-on-primary-fixed-variant',          label:'Egg Prices & Sizes',desc:'Small ₱1.80 → Jumbo ₱3.50',  route:'/admin/settings' },
    { icon:'local_shipping', iconClass:'bg-tertiary-fixed text-on-tertiary-fixed-variant',        label:'Suppliers',         desc:'5 feed & medicine suppliers', route:'/admin/master-data' },
    { icon:'notifications',  iconClass:'bg-error-container text-on-error-container',              label:'Alert Thresholds',  desc:'Mortality & stock limits',    route:'/admin/settings' },
  ];

  sysInfo = [
    { label:'Version',         value:'PoultryFarm Pro v1.0.0' },
    { label:'Database',        value:'PostgreSQL 16'           },
    { label:'API',             value:'localhost:8000 (mock)'   },
    { label:'Last Backup',     value:'Today, 2:00 AM'          },
    { label:'Storage',         value:'2.4 GB / 50 GB'          },
    { label:'Uptime',          value:'99.9% (30 days)'         },
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Load users
    this.userSvc.getAll({ per_page: 20 }).subscribe({
      next:  (res) => { if (res.data?.length) this.users.set(res.data as any); this.loadingUsers.set(false); },
      error: ()    => { this.loadingUsers.set(false); },
    });

    // Load dashboard KPIs
    this.dashSvc.getKPIs().subscribe({
      next:  (k) => this.dashKpis.set(k),
      error: ()  => {},
    });

    // Set admin name from stored auth
    try {
      const stored = localStorage.getItem('pfp_user');
      if (stored) this.adminName = JSON.parse(stored).name ?? 'Admin';
    } catch {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  initials(name: string): string {
    return name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  }

  roleAvatar(role: string): string {
    return { admin:'bg-primary-container text-on-primary-container', manager:'bg-tertiary-fixed text-on-tertiary-fixed-variant', supervisor:'bg-secondary-fixed text-on-secondary-fixed-variant', worker:'bg-primary-fixed text-on-primary-fixed-variant' }[role] ?? 'bg-surface-container text-on-surface';
  }

  roleBadge(role: string): string { return this.roleAvatar(role); }

  toggleStatus(user: RecentUser): void {
    this.users.update(list => list.map(u => u.id === user.id
      ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const }
      : u
    ));
    this.userSvc.toggleStatus(user.id).subscribe();
  }
}

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/index';

type Role   = 'admin' | 'manager' | 'supervisor' | 'worker';
type Status = 'active' | 'inactive' | 'suspended';

interface SystemUser {
  id: number; name: string; email: string; role: Role;
  status: Status; building?: string; lastLogin: string;
  createdAt: string; phone?: string;
}

interface UserFormData {
  name: string; email: string; role: Role; building: string;
  phone: string; password: string; confirmPassword: string;
}

const MOCK_USERS: SystemUser[] = [
  { id:1, name:'Ana Reyes',       email:'admin1@admin.com',           role:'admin',      status:'active',   lastLogin:'Just now',    createdAt:'2024-01-01', phone:'+63 912 345 6789' },
  { id:2, name:'Johnathan Aris',  email:'manager1@manager.com',       role:'manager',    status:'active',   lastLogin:'2h ago',      createdAt:'2024-01-05', phone:'+63 917 234 5678' },
  { id:3, name:'Maria Santos',    email:'supervisor1@supervisor.com', role:'supervisor', status:'active',   lastLogin:'4h ago',      createdAt:'2024-01-08', phone:'+63 918 345 6780', building:'All Houses' },
  { id:4, name:'Juan dela Cruz',  email:'worker1@worker.com',         role:'worker',     status:'active',   lastLogin:'6h ago',      createdAt:'2024-01-10', phone:'+63 919 456 7891', building:'Alpha-1' },
  { id:5, name:'Pedro Reyes',     email:'pedro@worker.com',           role:'worker',     status:'active',   lastLogin:'Yesterday',   createdAt:'2024-01-12', phone:'+63 920 567 8902', building:'Beta-2' },
  { id:6, name:'Rosa Mendoza',    email:'rosa@worker.com',            role:'worker',     status:'inactive', lastLogin:'3 days ago',  createdAt:'2024-01-12', phone:'+63 921 678 9013', building:'Gamma-3' },
  { id:7, name:'Carlos Bautista', email:'carlos@worker.com',          role:'worker',     status:'active',   lastLogin:'1h ago',      createdAt:'2024-01-15', phone:'+63 922 789 0124', building:'Delta-1' },
  { id:8, name:'Liza Flores',     email:'liza@supervisor.com',        role:'supervisor', status:'suspended',lastLogin:'1 week ago',  createdAt:'2024-01-18', phone:'+63 923 890 1235', building:'Beta Houses' },
];

@Component({
  selector: 'app-manage-users',
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
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">User Management</h1>
      <p class="text-body-md text-on-surface-variant">
        {{ today }}
        @if (loading()) {
          <span class="inline-flex items-center gap-xs ml-sm">
            <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Loading...
          </span>
        }
      </p>
    </div>
    <button (click)="openAdd()"
            class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg
                   text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
      <span class="material-symbols-outlined text-[18px]">person_add</span>Add User
    </button>
  </div>

  <!-- API error -->
  @if (apiError()) {
    <div class="bg-error-container text-on-error-container rounded-xl p-md mb-lg flex items-center gap-sm">
      <span class="material-symbols-outlined text-[18px]">warning</span>
      {{ apiError() }} — showing cached data.
    </div>
  }

  <!-- Stats strip -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
    @for (stat of userStats(); track stat.label) {
      <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
        <div class="font-bold text-[22px]" [class]="stat.color">{{ stat.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ stat.label }}</div>
      </div>
    }
  </div>

  <!-- Search + filters -->
  <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-lg shadow-sm">
    <div class="relative flex-1 min-w-48">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
      <input type="text" [(ngModel)]="search" placeholder="Search name or email..."
             class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md
                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
    </div>
    <select [(ngModel)]="filterRole"
            class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
      <option value="">All roles</option>
      <option value="admin">Admin</option>
      <option value="manager">Manager</option>
      <option value="supervisor">Supervisor</option>
      <option value="worker">Worker</option>
    </select>
    <select [(ngModel)]="filterStatus"
            class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
      <option value="">All statuses</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="suspended">Suspended</option>
    </select>
    <button (click)="search=''; filterRole=''; filterStatus=''"
            class="text-label-md text-on-surface-variant hover:text-error transition-colors flex items-center gap-xs">
      <span class="material-symbols-outlined text-[16px]">filter_list_off</span>Clear
    </button>
  </div>

  <!-- User table -->
  <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
    <table class="w-full text-left border-collapse">
      <thead class="bg-surface-container-low border-b border-outline-variant">
        <tr>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider">User</th>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Building</th>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Last Login</th>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
          <th class="px-lg py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-outline-variant">
        @for (user of filteredUsers(); track user.id) {
          <tr class="hover:bg-surface-container-lowest transition-colors">
            <td class="px-lg py-md">
              <div class="flex items-center gap-md">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                     [class]="roleAvatarClass(user.role)">
                  {{ initials(user.name) }}
                </div>
                <div>
                  <p class="font-bold text-on-surface text-sm">{{ user.name }}</p>
                  <p class="text-xs text-on-surface-variant">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-lg py-md">
              <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                    [class]="roleBadge(user.role)">{{ user.role }}</span>
            </td>
            <td class="px-lg py-md hidden md:table-cell text-sm text-on-surface-variant">
              {{ user.building || '—' }}
            </td>
            <td class="px-lg py-md hidden md:table-cell text-sm text-on-surface-variant">
              {{ user.lastLogin }}
            </td>
            <td class="px-lg py-md">
              <div class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full flex-shrink-0"
                      [class]="user.status==='active' ? 'bg-primary'
                             : user.status==='suspended' ? 'bg-error' : 'bg-outline'"></span>
                <span class="text-xs capitalize"
                      [class]="user.status==='suspended' ? 'text-error font-bold' : 'text-on-surface-variant'">
                  {{ user.status }}
                </span>
              </div>
            </td>
            <td class="px-lg py-md">
              <div class="flex items-center justify-end gap-xs">
                <button (click)="openEdit(user)" title="Edit user"
                        class="p-xs hover:bg-primary-fixed rounded-lg transition-colors text-on-surface-variant hover:text-primary">
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button (click)="openPassword(user)" title="Change password"
                        class="p-xs hover:bg-tertiary-fixed rounded-lg transition-colors text-on-surface-variant hover:text-on-tertiary-fixed-variant">
                  <span class="material-symbols-outlined text-[18px]">lock</span>
                </button>
                <button (click)="toggleStatus(user)"
                        [title]="user.status==='active' ? 'Deactivate' : 'Activate'"
                        class="p-xs rounded-lg transition-colors"
                        [class]="user.status==='active'
                          ? 'text-secondary hover:bg-secondary-fixed'
                          : 'text-primary hover:bg-primary-fixed'">
                  <span class="material-symbols-outlined text-[18px]">
                    {{ user.status==='active' ? 'person_off' : 'person' }}
                  </span>
                </button>
                @if (user.id !== 1) {
                  <button (click)="deleteUser(user)" title="Delete user"
                          class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                }
              </div>
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="6" class="px-lg py-xl text-center text-on-surface-variant">
            No users match your filters.
          </td></tr>
        }
      </tbody>
    </table>
  </div>

  <!-- ═══ Add / Edit user modal ═══ -->
  @if (showForm()) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">
            {{ editingUser ? 'Edit User' : 'Add New User' }}
          </h3>
          <button (click)="closeForm()" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Full Name *</label>
              <input type="text" [(ngModel)]="formData.name" placeholder="e.g. Juan dela Cruz"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Email Address *</label>
              <input type="email" [(ngModel)]="formData.email" placeholder="user@farm.com"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Role *</label>
              <select [(ngModel)]="formData.role"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="worker">Farm Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Farm Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Assigned Building</label>
              <select [(ngModel)]="formData.building"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                             focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All / Not assigned</option>
                @for (b of buildings; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Phone Number</label>
              <input type="tel" [(ngModel)]="formData.phone" placeholder="+63 9XX XXX XXXX"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            @if (!editingUser) {
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Password *</label>
                <div class="relative">
                  <input [type]="showNewPw ? 'text' : 'password'" [(ngModel)]="formData.password"
                         placeholder="Min. 8 characters"
                         class="w-full border border-outline-variant rounded-lg px-md py-sm pr-10 text-body-md
                                focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                  <button type="button" (click)="showNewPw = !showNewPw"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    <span class="material-symbols-outlined text-[18px]">{{ showNewPw ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                <!-- Password strength -->
                @if (formData.password.length > 0) {
                  <div class="mt-xs">
                    <div class="flex gap-xs">
                      @for (seg of [1,2,3,4]; track seg) {
                        <div class="flex-1 h-1 rounded-full transition-all"
                             [class]="pwStrength() >= seg
                               ? (pwStrength() <= 1 ? 'bg-error' : pwStrength() === 2 ? 'bg-secondary-container' : pwStrength() === 3 ? 'bg-secondary' : 'bg-primary')
                               : 'bg-surface-container-highest'"></div>
                      }
                    </div>
                    <p class="text-[10px] mt-xs" [class]="pwStrength() <= 1 ? 'text-error' : pwStrength() <= 2 ? 'text-secondary' : 'text-primary'">
                      {{ pwStrengthLabel() }}
                    </p>
                  </div>
                }
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Confirm Password *</label>
                <div class="relative">
                  <input [type]="showConfirmPw ? 'text' : 'password'" [(ngModel)]="formData.confirmPassword"
                         placeholder="Repeat password"
                         class="w-full border border-outline-variant rounded-lg px-md py-sm pr-10 text-body-md
                                focus:outline-none focus:ring-2 focus:ring-primary/20"
                         [class.border-error]="formData.confirmPassword && formData.password !== formData.confirmPassword"
                         [class.border-primary]="formData.confirmPassword && formData.password === formData.confirmPassword"/>
                  <button type="button" (click)="showConfirmPw = !showConfirmPw"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    <span class="material-symbols-outlined text-[18px]">{{ showConfirmPw ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                  <p class="text-[10px] text-error mt-xs">Passwords do not match</p>
                }
              </div>
            }
          </div>
          @if (formError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md flex items-center gap-sm text-body-md">
              <span class="material-symbols-outlined text-[18px]">error</span>{{ formError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="closeForm()"
                    class="flex-1 py-sm border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container">
              Cancel
            </button>
            <button (click)="saveUser()" [disabled]="saving()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-xs">
              @if (saving()) { <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> }
              {{ editingUser ? 'Save Changes' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ═══ Change Password modal ═══ -->
  @if (showPasswordModal() && passwordTarget) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:18px">Change Password</h3>
            <p class="text-xs text-on-surface-variant mt-xs">{{ passwordTarget.name }} · {{ passwordTarget.email }}</p>
          </div>
          <button (click)="closePasswordModal()" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">

          <!-- Current password display -->
          <div class="bg-surface-container rounded-xl p-md">
            <div class="flex items-center justify-between mb-xs">
              <label class="text-label-md text-on-surface-variant font-bold">Current Password</label>
              <button (click)="showCurrentPw = !showCurrentPw"
                      class="flex items-center gap-xs text-label-md text-primary hover:underline">
                <span class="material-symbols-outlined text-[16px]">{{ showCurrentPw ? 'visibility_off' : 'visibility' }}</span>
                {{ showCurrentPw ? 'Hide' : 'Show' }}
              </button>
            </div>
            <div class="font-mono font-bold text-on-surface text-body-md tracking-widest">
              {{ showCurrentPw ? currentPasswordDisplay() : '••••••••' }}
            </div>
            <p class="text-[10px] text-on-surface-variant mt-xs">
              This is the stored credential. Do not share with unauthorized users.
            </p>
          </div>

          <!-- New password -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">New Password *</label>
            <div class="relative">
              <input [type]="showChangePw ? 'text' : 'password'" [(ngModel)]="changePasswordForm.newPassword"
                     placeholder="Minimum 8 characters"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm pr-10 text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              <button type="button" (click)="showChangePw = !showChangePw"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined text-[18px]">{{ showChangePw ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <!-- Strength meter -->
            @if (changePasswordForm.newPassword.length > 0) {
              <div class="mt-xs">
                <div class="flex gap-xs">
                  @for (seg of [1,2,3,4]; track seg) {
                    <div class="flex-1 h-1 rounded-full transition-all"
                         [class]="changePwStrength() >= seg
                           ? (changePwStrength() <= 1 ? 'bg-error' : changePwStrength() === 2 ? 'bg-secondary-container' : changePwStrength() === 3 ? 'bg-secondary' : 'bg-primary')
                           : 'bg-surface-container-highest'"></div>
                  }
                </div>
                <p class="text-[10px] mt-xs"
                   [class]="changePwStrength() <= 1 ? 'text-error' : changePwStrength() <= 2 ? 'text-secondary' : 'text-primary'">
                  {{ changePwStrengthLabel() }} — {{ changePwHint() }}
                </p>
              </div>
            }
          </div>

          <!-- Confirm new password -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Confirm New Password *</label>
            <div class="relative">
              <input [type]="showChangeConfirmPw ? 'text' : 'password'"
                     [(ngModel)]="changePasswordForm.confirmPassword"
                     placeholder="Repeat new password"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm pr-10 text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"
                     [class.border-error]="changePasswordForm.confirmPassword && changePasswordForm.newPassword !== changePasswordForm.confirmPassword"
                     [class.border-primary]="changePasswordForm.confirmPassword && changePasswordForm.newPassword === changePasswordForm.confirmPassword"/>
              <button type="button" (click)="showChangeConfirmPw = !showChangeConfirmPw"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined text-[18px]">{{ showChangeConfirmPw ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (changePasswordForm.confirmPassword && changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
              <p class="text-[10px] text-error mt-xs">Passwords do not match</p>
            }
          </div>

          <!-- Generate random password -->
          <button (click)="generateRandomPassword()"
                  class="w-full py-sm border border-outline text-on-surface rounded-lg text-label-md
                         hover:bg-surface-container transition-all flex items-center justify-center gap-sm">
            <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">password</span>
            Generate Secure Password
          </button>

          <!-- Send reset email option -->
          <div class="flex items-center gap-md p-md bg-surface-container rounded-xl">
            <span class="material-symbols-outlined text-[20px] text-on-surface-variant" style="font-variation-settings:'FILL' 1">mail</span>
            <div class="flex-1">
              <p class="font-bold text-on-surface text-sm">Send Reset Link by Email</p>
              <p class="text-xs text-on-surface-variant">Send a password reset link to {{ passwordTarget.email }}</p>
            </div>
            <button (click)="sendResetEmail()"
                    class="px-md py-xs border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container-high transition-all">
              Send
            </button>
          </div>

          @if (passwordError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md flex items-center gap-sm text-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ passwordError() }}
            </div>
          }

          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="closePasswordModal()"
                    class="flex-1 py-sm border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container">
              Cancel
            </button>
            <button (click)="savePassword()" [disabled]="savingPassword()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-xs">
              @if (savingPassword()) { <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> }
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- Toast -->
  @if (toast()) {
    <div class="fixed bottom-lg right-lg bg-on-surface text-inverse-on-surface px-lg py-md rounded-xl
                shadow-lg flex items-center gap-sm z-50">
      <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">check_circle</span>
      {{ toast() }}
    </div>
  }
</div>
  `,
})
export class ManageUsersComponent implements OnInit {
  private userSvc = inject(UserService);

  today    = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  buildings = ['Alpha-1','Alpha-2','Beta-1','Beta-2','Gamma-1','Gamma-3','Delta-1','All Houses','Beta Houses'];

  // State
  users    = signal<SystemUser[]>(MOCK_USERS);
  loading  = signal(false);
  saving   = signal(false);
  savingPassword = signal(false);
  showForm = signal(false);
  showPasswordModal = signal(false);
  formError = signal('');
  passwordError = signal('');
  apiError  = signal('');
  toast     = signal('');

  // Filters
  search = ''; filterRole = ''; filterStatus = '';

  // User form
  editingUser: SystemUser | null = null;
  formData: UserFormData = this.blankForm();
  showNewPw     = false;
  showConfirmPw = false;

  // Password modal
  passwordTarget: SystemUser | null = null;
  showCurrentPw      = false;
  showChangePw       = false;
  showChangeConfirmPw = false;
  changePasswordForm = { newPassword:'', confirmPassword:'' };

  // Stored passwords (in a real app these come from the API; here we keep them locally for the demo)
  private storedPasswords: Record<number, string> = {
    1: 'admin1', 2: 'manager1', 3: 'supervisor1', 4: 'worker1',
    5: 'worker123', 6: 'worker123', 7: 'worker123', 8: 'liza123',
  };
  private nextId = 9;

  // ── Computed ───────────────────────────────────────────────────────────────
  userStats = computed(() => {
    const u = this.users();
    return [
      { label:'Total Users', value: u.length,                                          color:'text-primary'   },
      { label:'Active',      value: u.filter(x=>x.status==='active').length,           color:'text-primary'   },
      { label:'Inactive',    value: u.filter(x=>x.status==='inactive').length,         color:'text-on-surface'},
      { label:'Suspended',   value: u.filter(x=>x.status==='suspended').length,        color:'text-error'     },
    ];
  });

  filteredUsers = computed(() =>
    this.users().filter(u => {
      const q = this.search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (this.filterRole   && u.role   !== this.filterRole)   return false;
      if (this.filterStatus && u.status !== this.filterStatus) return false;
      return true;
    })
  );

  // Password strength helpers
  pwStrength(): number     { return this.calcStrength(this.formData.password); }
  pwStrengthLabel(): string { return this.strengthLabel(this.pwStrength()); }
  changePwStrength(): number      { return this.calcStrength(this.changePasswordForm.newPassword); }
  changePwStrengthLabel(): string  { return this.strengthLabel(this.changePwStrength()); }
  changePwHint(): string {
    const p = this.changePasswordForm.newPassword;
    const hints: string[] = [];
    if (p.length < 8)        hints.push('min 8 chars');
    if (!/[A-Z]/.test(p))   hints.push('uppercase');
    if (!/[0-9]/.test(p))   hints.push('number');
    if (!/[^A-Za-z0-9]/.test(p)) hints.push('symbol');
    return hints.length ? 'Add: ' + hints.join(', ') : '✓ Strong password';
  }

  private calcStrength(pw: string): number {
    if (!pw || pw.length < 6) return 0;
    let score = 0;
    if (pw.length >= 8)          score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  private strengthLabel(s: number): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][s] ?? '';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loading.set(true);
    this.userSvc.getAll().subscribe({
      next: (res) => {
        if (res.data?.length) this.users.set(res.data as any);
        this.loading.set(false);
      },
      error: () => {
        this.apiError.set('Could not reach API server');
        this.loading.set(false);
      },
    });
  }

  // ── User form ──────────────────────────────────────────────────────────────
  openAdd(): void {
    this.editingUser = null;
    this.formData    = this.blankForm();
    this.formError.set('');
    this.showNewPw = false; this.showConfirmPw = false;
    this.showForm.set(true);
  }

  openEdit(u: SystemUser): void {
    this.editingUser = u;
    this.formData    = { name:u.name, email:u.email, role:u.role, building:u.building??'', phone:u.phone??'', password:'', confirmPassword:'' };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingUser = null; }

  saveUser(): void {
    if (!this.formData.name.trim())  { this.formError.set('Name is required.');   return; }
    if (!this.formData.email.trim()) { this.formError.set('Email is required.');  return; }
    if (!this.editingUser && !this.formData.password)
      { this.formError.set('Password is required for new users.'); return; }
    if (!this.editingUser && this.formData.password !== this.formData.confirmPassword)
      { this.formError.set('Passwords do not match.'); return; }
    if (!this.editingUser && this.formData.password.length < 8)
      { this.formError.set('Password must be at least 8 characters.'); return; }

    this.saving.set(true);

    if (this.editingUser) {
      const id = this.editingUser.id;
      this.userSvc.update(id, {
        name:     this.formData.name,
        email:    this.formData.email,
        role:     this.formData.role,
        building: this.formData.building || undefined,
        phone:    this.formData.phone    || undefined,
      }).subscribe({
        next: () => {
          this.users.update(list => list.map(u => u.id === id
            ? { ...u, name:this.formData.name, email:this.formData.email, role:this.formData.role, building:this.formData.building||undefined, phone:this.formData.phone||undefined }
            : u
          ));
          this.finish('User updated successfully.');
        },
        error: () => {
          // Optimistic update (mock API)
          this.users.update(list => list.map(u => u.id === id
            ? { ...u, name:this.formData.name, email:this.formData.email, role:this.formData.role, building:this.formData.building||undefined, phone:this.formData.phone||undefined }
            : u
          ));
          this.finish('User updated (offline mode).');
        },
      });
    } else {
      this.userSvc.create({
        name:     this.formData.name,
        email:    this.formData.email,
        role:     this.formData.role,
        building: this.formData.building || undefined,
        phone:    this.formData.phone    || undefined,
        password: this.formData.password,
      }).subscribe({
        next: (newUser: any) => {
          const u: SystemUser = {
            id: newUser.id ?? this.nextId++,
            name: this.formData.name, email: this.formData.email, role: this.formData.role,
            status: 'active', building: this.formData.building||undefined, phone: this.formData.phone||undefined,
            lastLogin: 'Never', createdAt: new Date().toISOString().split('T')[0],
          };
          this.storedPasswords[u.id] = this.formData.password;
          this.users.update(list => [u, ...list]);
          this.finish('User created successfully.');
        },
        error: () => {
          const u: SystemUser = {
            id: this.nextId++, name:this.formData.name, email:this.formData.email, role:this.formData.role,
            status:'active', building:this.formData.building||undefined, phone:this.formData.phone||undefined,
            lastLogin:'Never', createdAt:new Date().toISOString().split('T')[0],
          };
          this.storedPasswords[u.id] = this.formData.password;
          this.users.update(list => [u, ...list]);
          this.finish('User created (offline mode).');
        },
      });
    }
  }

  private finish(msg: string): void {
    this.saving.set(false);
    this.closeForm();
    this.showToast(msg);
  }

  // ── Password modal ─────────────────────────────────────────────────────────
  openPassword(u: SystemUser): void {
    this.passwordTarget = u;
    this.changePasswordForm = { newPassword:'', confirmPassword:'' };
    this.passwordError.set('');
    this.showCurrentPw = false;
    this.showChangePw  = false;
    this.showChangeConfirmPw = false;
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void { this.showPasswordModal.set(false); this.passwordTarget = null; }

  currentPasswordDisplay(): string {
    return this.passwordTarget ? (this.storedPasswords[this.passwordTarget.id] ?? '(not stored)') : '';
  }

  generateRandomPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    // ensure it meets all criteria
    pw = pw.slice(0, 8) + 'A1!';
    this.changePasswordForm.newPassword      = pw;
    this.changePasswordForm.confirmPassword  = pw;
    this.showChangePw = true;
  }

  sendResetEmail(): void {
    if (!this.passwordTarget) return;
    this.userSvc.resetPassword(this.passwordTarget.id).subscribe();
    this.showToast(`Password reset email sent to ${this.passwordTarget.email}.`);
    this.closePasswordModal();
  }

  savePassword(): void {
    if (!this.changePasswordForm.newPassword)
      { this.passwordError.set('Enter a new password.'); return; }
    if (this.changePasswordForm.newPassword.length < 8)
      { this.passwordError.set('Password must be at least 8 characters.'); return; }
    if (this.changePasswordForm.newPassword !== this.changePasswordForm.confirmPassword)
      { this.passwordError.set('Passwords do not match.'); return; }
    if (!this.passwordTarget) return;

    this.savingPassword.set(true);
    const id = this.passwordTarget.id;

    this.userSvc.update(id, { password: this.changePasswordForm.newPassword }).subscribe({
      next: () => { this.finishPassword(id); },
      error: () => { this.finishPassword(id); }, // works via mock too
    });
  }

  private finishPassword(id: number): void {
    this.storedPasswords[id] = this.changePasswordForm.newPassword;
    this.savingPassword.set(false);
    const name = this.passwordTarget?.name ?? '';
    this.closePasswordModal();
    this.showToast(`Password updated for ${name}.`);
  }

  // ── Status + delete ────────────────────────────────────────────────────────
  toggleStatus(u: SystemUser): void {
    const next: Status = u.status === 'active' ? 'inactive' : 'active';
    this.userSvc.toggleStatus(u.id).subscribe();
    this.users.update(list => list.map(x => x.id === u.id ? {...x, status:next} : x));
    this.showToast(`${u.name} ${next === 'active' ? 'activated' : 'deactivated'}.`);
  }

  deleteUser(u: SystemUser): void {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    this.userSvc.remove(u.id).subscribe();
    this.users.update(list => list.filter(x => x.id !== u.id));
    this.showToast(`${u.name} deleted.`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  initials(name: string): string {
    return name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  }

  roleAvatarClass(role: Role): string {
    return { admin:'bg-primary-container text-on-primary-container', manager:'bg-tertiary-fixed text-on-tertiary-fixed-variant', supervisor:'bg-secondary-fixed text-on-secondary-fixed-variant', worker:'bg-primary-fixed text-on-primary-fixed-variant' }[role];
  }

  roleBadge(role: Role): string { return this.roleAvatarClass(role); }

  private blankForm(): UserFormData {
    return { name:'', email:'', role:'worker', building:'', phone:'', password:'', confirmPassword:'' };
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3500);
  }
}

interface UserFormData { name:string; email:string; role:Role; building:string; phone:string; password:string; confirmPassword:string; }

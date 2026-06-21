// ── User / Auth ──────────────────────────────────────────────────────────────
export type Role = 'admin' | 'manager' | 'supervisor' | 'worker';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

// ── Flock / Batch ─────────────────────────────────────────────────────────────
export type BatchStatus = 'Active' | 'Harvested' | 'Quarantined';

export interface FlockBatch {
  id: number;
  batchCode: string;
  houseName: string;
  breed: string;
  ageDays: number;
  population: number;
  fcr: number;
  mortalityPct: number;
  status: BatchStatus;
  arrivalDate: string;
  sourceFarm: string;
  purchaseCostPerHen?: number;
}

export interface MortalityLog {
  id: number;
  batchId: number;
  date: string;
  count: number;
  cause: string;
  recordedBy: string;
}

// ── Egg Production ────────────────────────────────────────────────────────────
export type EggSize = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';

export interface EggCollection {
  id: number;
  batchId: number;
  buildingId: number;
  collectionTime: string;
  collectorId: number;
  sizeBreakdown: Record<EggSize, number>;
  cracked: number;
  dirty: number;
  spoiled: number;
  rejected: number;
  totalCollected: number;
  date: string;
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export interface FeedStock {
  id: number;
  feedType: string;
  batchNumber: string;
  supplierId: number;
  quantityKg: number;
  unitCost: number;
  expiryDate: string;
  receivedDate: string;
  notes?: string;
}

// ── Health ────────────────────────────────────────────────────────────────────
export interface Treatment {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  dosageMl: number;
  administeredAt: string;
  administeredBy: number;
  withdrawalDays: number;
  safeDate?: string;
  daysLeft?: number;
}

export interface Vaccination {
  id: number;
  batchId: number;
  vaccineName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'completed' | 'overdue';
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'credit' | 'bank-transfer';

export interface SaleLineItem {
  eggSize: EggSize;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  customerId: number;
  customerName?: string;
  saleDate: string;
  lineItems: SaleLineItem[];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  notes?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  activeFlocks: number;
  totalBirds: number;
  todayMortality: number;
  feedRemainingTons: number;
  vaccinationsToday: number;
  todayRevenue: number;
  monthlyRevenue: number;
  grossProfitPct: number;
}

export interface ActivityItem {
  id: number;
  type: 'vaccination' | 'alert' | 'feed' | 'sale' | 'mortality';
  title: string;
  subtitle: string;
  timeAgo: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Alert {
  id: number;
  type: AlertSeverity;
  title: string;
  message: string;
  seen: boolean;
  createdAt: string;
}

// ── Shared ────────────────────────────────────────────────────────────────────
export interface DateRange { from: string; to: string; }

export interface Building {
  id: number;
  name: string;
  capacity: number;
  type: 'broiler' | 'layer' | 'breeder';
}

export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

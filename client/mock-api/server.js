/**
 * PoultryFarm Pro — Express Mock API
 * Mirrors the Laravel 12 API contract exactly.
 * Run: node server.js
 * Port: 8000
 */

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');

const app    = express();
const PORT   = 8000;
const SECRET = 'poultry-farm-pro-dev-secret-2024';

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:4000', 'http://127.0.0.1:4200'], credentials: true }));
app.use(express.json());

// ── Request logger ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════════════════════════
// STATIC DATA STORE (in-memory, resets on restart)
// ════════════════════════════════════════════════════════════════════════════

const USERS = [
  { id: 1, name: 'Ana Reyes',       email: 'admin1@admin.com',           password: 'admin1',      role: 'admin',      status: 'active',   building: null,       phone: '+63 912 345 6789', createdAt: '2024-01-01', lastLogin: 'Just now' },
  { id: 2, name: 'Johnathan Aris',  email: 'manager1@manager.com',       password: 'manager1',    role: 'manager',    status: 'active',   building: null,       phone: '+63 917 234 5678', createdAt: '2024-01-05', lastLogin: '2h ago' },
  { id: 3, name: 'Maria Santos',    email: 'supervisor1@supervisor.com', password: 'supervisor1', role: 'supervisor', status: 'active',   building: 'All Houses',phone: '+63 918 345 6780', createdAt: '2024-01-08', lastLogin: '4h ago' },
  { id: 4, name: 'Juan dela Cruz',  email: 'worker1@worker.com',         password: 'worker1',     role: 'worker',     status: 'active',   building: 'Alpha-1',  phone: '+63 919 456 7891', createdAt: '2024-01-10', lastLogin: '6h ago' },
  { id: 5, name: 'Pedro Reyes',     email: 'pedro@worker.com',           password: 'worker123',   role: 'worker',     status: 'active',   building: 'Beta-2',   phone: '+63 920 567 8902', createdAt: '2024-01-12', lastLogin: 'Yesterday' },
  { id: 6, name: 'Rosa Mendoza',    email: 'rosa@worker.com',            password: 'worker123',   role: 'worker',     status: 'inactive', building: 'Gamma-3',  phone: '+63 921 678 9013', createdAt: '2024-01-12', lastLogin: '3 days ago' },
  { id: 7, name: 'Carlos Bautista', email: 'carlos@worker.com',          password: 'worker123',   role: 'worker',     status: 'active',   building: 'Delta-1',  phone: '+63 922 789 0124', createdAt: '2024-01-15', lastLogin: '1h ago' },
];

const FLOCK_BATCHES = [
  { id: 1, batchCode: 'B-2024-001', houseName: 'Alpha-1', breed: 'Cobb 500',  ageDays: 32, population: 12450, fcr: 1.42, mortalityPct: 1.2, status: 'Active',    arrivalDate: '2024-01-10', sourceFarm: 'GreenValley' },
  { id: 2, batchCode: 'B-2024-002', houseName: 'Beta-2',  breed: 'Ross 308',  ageDays: 18, population: 15000, fcr: 1.35, mortalityPct: 0.5, status: 'Active',    arrivalDate: '2024-01-24', sourceFarm: 'SunFarm' },
  { id: 3, batchCode: 'B-2024-003', houseName: 'Gamma-3', breed: 'Cobb 500',  ageDays: 45, population: 0,     fcr: 1.60, mortalityPct: 2.1, status: 'Harvested', arrivalDate: '2023-12-28', sourceFarm: 'GreenValley' },
  { id: 4, batchCode: 'B-2024-004', houseName: 'Delta-1', breed: 'Hubbard',   ageDays: 5,  population: 10200, fcr: 1.10, mortalityPct: 0.1, status: 'Active',    arrivalDate: '2024-02-06', sourceFarm: 'PrimeBirds' },
  { id: 5, batchCode: 'B-2024-005', houseName: 'Alpha-2', breed: 'Ross 308',  ageDays: 12, population: 14850, fcr: 1.28, mortalityPct: 0.3, status: 'Active',    arrivalDate: '2024-01-30', sourceFarm: 'SunFarm' },
];

let eggCollections  = [];
let feedLogs        = [];
let mortalityLogs   = [];
let damagedEggs     = [];
let reportJobs      = {};
let userIdCounter   = 8;
let collectionIdCounter = 1;
let mortalityIdCounter  = 1;

// Seed some egg collections
for (let i = 7; i >= 0; i--) {
  const d = new Date(); d.setDate(d.getDate() - i);
  eggCollections.push({
    id: collectionIdCounter++,
    flockBatchId: 1, buildingId: 1, building: 'Alpha-1', batch: 'B-2024-001',
    collectionDate: d.toISOString().split('T')[0], collectionTime: '06:15',
    collectorId: 4, collector: 'Juan dela Cruz',
    sizes: { small: 110, medium: 310, large: 750, extra_large: 50, jumbo: 20 },
    totalCollected: 1240, goodEggs: 1228,
    cracked: 8, dirty: 4, spoiled: 0, rejected: 0,
    verifiedStatus: 'verified', verifiedBy: 'Maria Santos',
    createdAt: d.toISOString(),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ════════════════════════════════════════════════════════════════════════════

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] ?? '';
  const token  = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthenticated.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token expired or invalid.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  next();
}

function paginate(arr, page = 1, perPage = 20) {
  const p    = parseInt(page);
  const pp   = parseInt(perPage);
  const from = (p - 1) * pp;
  return {
    data:          arr.slice(from, from + pp),
    total:         arr.length,
    current_page:  p,
    per_page:      pp,
    last_page:     Math.ceil(arr.length / pp),
  };
}

function today() { return new Date().toISOString().split('T')[0]; }

// ════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password && u.status === 'active');
  if (!user) return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '8h' });
  const { password: _, ...safeUser } = user;

  res.json({ token, token_type: 'Bearer', expires_in: 28800, user: safeUser });
});

app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = USERS.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/auth/refresh', authMiddleware, (req, res) => {
  const token = jwt.sign({ id: req.user.id, email: req.user.email, role: req.user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, expires_in: 28800 });
});

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/dashboard/kpis', authMiddleware, (_req, res) => {
  const todayEggs = eggCollections
    .filter(e => e.collectionDate === today())
    .reduce((s, e) => s + e.totalCollected, 0);
  const activeFlocks = FLOCK_BATCHES.filter(b => b.status === 'Active').length;
  const totalBirds   = FLOCK_BATCHES.filter(b => b.status === 'Active').reduce((s, b) => s + b.population, 0);
  const todayMort    = mortalityLogs.filter(m => m.recordedAt.startsWith(today())).reduce((s, m) => s + m.count, 0);

  res.json({
    active_flocks:       activeFlocks,
    total_birds:         totalBirds,
    today_eggs:          todayEggs || 12720,
    month_eggs:          87340,
    today_mortality:     todayMort || 8,
    feed_remaining_tons: 13.8,
    vaccinations_today:  3,
    today_revenue:       24500,
    month_revenue:       124500,
    gross_profit:        93375,
    gross_margin_pct:    75,
    generated_at:        new Date().toISOString(),
  });
});

app.get('/api/dashboard/activity', authMiddleware, (_req, res) => {
  res.json([
    { id: 'egg-1',  type: 'egg_collection', title: '12,720 eggs collected across all houses', subtitle: 'By Juan dela Cruz',         time: '7:30 AM', icon: 'egg' },
    { id: 'task-1', type: 'verification',   title: '8 production entries verified',            subtitle: 'By Maria Santos',           time: '8:05 AM', icon: 'task_alt' },
    { id: 'vacc-1', type: 'vaccination',    title: 'Newcastle vaccine — Beta-2 completed',     subtitle: 'By Maria Santos',           time: '9:30 AM', icon: 'vaccines' },
    { id: 'sale-1', type: 'sale',           title: '₱24,500 sales — 3 customers',              subtitle: 'By Johnathan Aris',         time: '10:15 AM',icon: 'point_of_sale' },
    { id: 'mort-1', type: 'mortality',      title: 'Mortality logged — 7 birds (Gamma-3)',     subtitle: 'By Rosa Mendoza',           time: '11:00 AM',icon: 'emergency' },
  ]);
});

// ════════════════════════════════════════════════════════════════════════════
// FLOCK BATCHES
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/flock-batches', authMiddleware, (req, res) => {
  let data = [...FLOCK_BATCHES];
  if (req.query.status) data = data.filter(b => b.status === req.query.status);
  res.json(paginate(data, req.query.page, req.query.per_page));
});

app.get('/api/flock-batches/:id', authMiddleware, (req, res) => {
  const batch = FLOCK_BATCHES.find(b => b.id === parseInt(req.params.id));
  if (!batch) return res.status(404).json({ message: 'Batch not found.' });
  res.json(batch);
});

app.get('/api/flock-batches/:id/performance', authMiddleware, (req, res) => {
  res.json({
    batch_id:  parseInt(req.params.id),
    age_curve: [
      { day: 0, weight_g: 42 }, { day: 7, weight_g: 180 }, { day: 14, weight_g: 420 },
      { day: 21, weight_g: 750 }, { day: 28, weight_g: 1100 }, { day: 35, weight_g: 1800 },
      { day: 42, weight_g: 2400 },
    ],
    daily_eggs: Array.from({ length: 7 }, (_, i) => ({
      date:  new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      count: Math.floor(1100 + Math.random() * 300),
    })).reverse(),
  });
});

app.post('/api/flock-batches', authMiddleware, (req, res) => {
  const batch = { id: Date.now(), ...req.body, status: 'Active', createdAt: new Date().toISOString() };
  FLOCK_BATCHES.push(batch);
  res.status(201).json(batch);
});

// ════════════════════════════════════════════════════════════════════════════
// EGG COLLECTIONS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/egg-collections', authMiddleware, (req, res) => {
  let data = [...eggCollections];
  if (req.query.date)        data = data.filter(e => e.collectionDate === req.query.date);
  if (req.query.building_id) data = data.filter(e => e.buildingId === parseInt(req.query.building_id));
  if (req.query.batch_id)    data = data.filter(e => e.flockBatchId === parseInt(req.query.batch_id));
  data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(paginate(data, req.query.page, req.query.per_page));
});

app.post('/api/egg-collections', authMiddleware, (req, res) => {
  const totalSized   = Object.values(req.body.sizes || {}).reduce((s, v) => s + (v || 0), 0);
  const totalDefects = (req.body.cracked || 0) + (req.body.dirty || 0) + (req.body.spoiled || 0) + (req.body.rejected || 0);
  const entry = {
    id: collectionIdCounter++,
    ...req.body,
    totalCollected: totalSized,
    goodEggs:       Math.max(0, totalSized - totalDefects),
    verifiedStatus: 'pending',
    createdAt:      new Date().toISOString(),
  };
  eggCollections.unshift(entry);
  res.status(201).json(entry);
});

app.get('/api/egg-collections/summary', authMiddleware, (req, res) => {
  const from = req.query.date_from ?? today();
  const to   = req.query.date_to   ?? today();
  const subset = eggCollections.filter(e => e.collectionDate >= from && e.collectionDate <= to);
  const total  = subset.reduce((s, e) => s + e.totalCollected, 0);
  const defects = subset.reduce((s, e) => s + e.cracked + e.dirty + e.spoiled + e.rejected, 0);
  res.json({
    period: { from, to },
    total_collected: total || 12720,
    good_eggs:       (total - defects) || 12590,
    defect_count:    defects || 130,
    spoilage_pct:    total > 0 ? ((defects / total) * 100).toFixed(2) : '1.02',
    by_size:         { small: 1100, medium: 3200, large: 8400, extra_large: 0, jumbo: 0 },
  });
});


// Verify a single egg collection entry
app.post('/api/egg-collections/:id/verify', authMiddleware, (req, res) => {
  const id    = parseInt(req.params.id);
  const entry = eggCollections.find(e => e.id === id);
  if (!entry) return res.status(404).json({ message: 'Collection entry not found.' });
  entry.verifiedStatus = 'verified';
  entry.verifiedBy     = req.user?.name || 'Supervisor';
  entry.verifiedAt     = new Date().toISOString();
  res.json(entry);
});

app.post('/api/egg-collections/:id/flag', authMiddleware, (req, res) => {
  const id    = parseInt(req.params.id);
  const entry = eggCollections.find(e => e.id === id);
  if (!entry) return res.status(404).json({ message: 'Collection entry not found.' });
  entry.verifiedStatus = 'flagged';
  entry.flagReason     = req.body?.reason ?? 'Flagged for review';
  res.json(entry);
});

app.delete('/api/egg-collections/:id', authMiddleware, (req, res) => {
  const id  = parseInt(req.params.id);
  const idx = eggCollections.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found.' });
  eggCollections.splice(idx, 1);
  res.status(204).end();
});

app.get('/api/egg-inventory', authMiddleware, (_req, res) => {
  res.json({ small: 1100, medium: 3200, large: 8400, extra_large: 620, jumbo: 180, updated_at: new Date().toISOString() });
});

// ════════════════════════════════════════════════════════════════════════════
// FEED
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/feed-stock', authMiddleware, (_req, res) => {
  res.json([
    { id: 1, name: 'Starter Mix (Type A)', category: 'starter', quantity_kg: 4200, price_per_kg: 28.50, expiry_date: null, received_date: '2024-01-20' },
    { id: 2, name: 'Grower Pellets (A)',   category: 'grower',  quantity_kg: 3100, price_per_kg: 24.00, expiry_date: null, received_date: '2024-01-18' },
    { id: 3, name: 'Finisher Crumbles',    category: 'finisher',quantity_kg:  950, price_per_kg: 22.50, expiry_date: null, received_date: '2024-01-15' },
    { id: 4, name: 'Layer Mash (Premium)', category: 'layer',   quantity_kg: 2750, price_per_kg: 25.00, expiry_date: null, received_date: '2024-01-22' },
    { id: 5, name: 'Starter Mix (Type B)', category: 'starter', quantity_kg: 1800, price_per_kg: 26.00, expiry_date: null, received_date: '2024-01-20' },
  ]);
});

app.post('/api/feed-issuance', authMiddleware, (req, res) => {
  const log = { id: Date.now(), ...req.body, issuedAt: new Date().toISOString() };
  feedLogs.unshift(log);
  res.status(201).json(log);
});

app.get('/api/feed/fcr', authMiddleware, (req, res) => {
  res.json({
    fcr:            1.38,
    total_feed_kg:  58000,
    total_eggs:     42000,
    by_flock: [
      { batch: 'B-2024-001', fcr: 1.42, feed_kg: 18200, eggs: 12817 },
      { batch: 'B-2024-002', fcr: 1.35, feed_kg: 18900, eggs: 14000 },
      { batch: 'B-2024-004', fcr: 1.10, feed_kg: 2800,  eggs: 2545  },
      { batch: 'B-2024-005', fcr: 1.28, feed_kg: 9800,  eggs: 7656  },
    ],
  });
});

// ════════════════════════════════════════════════════════════════════════════
// MORTALITY
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/mortality-logs', authMiddleware, (req, res) => {
  let data = [...mortalityLogs];
  if (req.query.batch_id) data = data.filter(m => m.flockBatchId === parseInt(req.query.batch_id));
  res.json(paginate(data, req.query.page, req.query.per_page));
});

app.post('/api/mortality-logs', authMiddleware, (req, res) => {
  const log = {
    id: mortalityIdCounter++,
    ...req.body,
    recordedAt: new Date().toISOString(),
    createdAt:  new Date().toISOString(),
  };
  mortalityLogs.unshift(log);
  // Update flock batch current_count
  const batch = FLOCK_BATCHES.find(b => b.id === req.body.flockBatchId);
  if (batch) batch.population = Math.max(0, batch.population - req.body.count);
  res.status(201).json(log);
});

// ════════════════════════════════════════════════════════════════════════════
// DAMAGED EGGS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/damaged-eggs', authMiddleware, (_req, res) => {
  res.json(paginate(damagedEggs));
});

app.post('/api/damaged-eggs', authMiddleware, (req, res) => {
  const report = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
  damagedEggs.unshift(report);
  res.status(201).json(report);
});

// ════════════════════════════════════════════════════════════════════════════
// HEALTH — MEDICINE, TREATMENTS, VACCINATIONS
// ════════════════════════════════════════════════════════════════════════════

const MEDICINES = [
  { id: 1, name: 'Newcastle (LaSota)',   type: 'Vaccine',    withdrawalDays: 0, storageTemp: '2–8°C',   stock: 200, unit: 'doses', expiryDate: '2025-03-15', supplier: 'VetCare PH', active: true },
  { id: 2, name: 'Gumboro (IBD Live)',   type: 'Vaccine',    withdrawalDays: 0, storageTemp: '2–8°C',   stock: 50,  unit: 'doses', expiryDate: '2025-02-28', supplier: 'VetCare PH', active: true },
  { id: 3, name: 'Marek\'s Disease',     type: 'Vaccine',    withdrawalDays: 0, storageTemp: '−196°C',  stock: 320, unit: 'doses', expiryDate: '2025-06-01', supplier: 'PhilVet',    active: true },
  { id: 4, name: 'Tetracycline 500mg',  type: 'Antibiotic', withdrawalDays: 7, storageTemp: '15–25°C', stock: 12,  unit: 'packs', expiryDate: '2025-08-10', supplier: 'MedSupply PH',active: true },
  { id: 5, name: 'B-Complex Vitamins',  type: 'Vitamin',    withdrawalDays: 0, storageTemp: '15–25°C', stock: 8,   unit: 'packs', expiryDate: '2025-04-20', supplier: 'MedSupply PH',active: true },
];

const VACCINATIONS = [
  { id: 1, batchId: 2, batchCode: 'B-2024-002', building: 'Beta-2',  vaccineName: 'Newcastle Stage 2', scheduledDate: today(), status: 'completed', completedDate: today(), administeredBy: 'Maria Santos' },
  { id: 2, batchId: 1, batchCode: 'B-2024-001', building: 'Alpha-1', vaccineName: 'Newcastle Stage 3', scheduledDate: new Date(Date.now() + 10*86400000).toISOString().split('T')[0], status: 'scheduled' },
  { id: 3, batchId: 4, batchCode: 'B-2024-004', building: 'Delta-1', vaccineName: 'Marek\'s Disease',  scheduledDate: new Date(Date.now() - 2*86400000).toISOString().split('T')[0],  status: 'overdue' },
  { id: 4, batchId: 5, batchCode: 'B-2024-005', building: 'Alpha-2', vaccineName: 'Gumboro Stage 1',   scheduledDate: new Date(Date.now() + 8*86400000).toISOString().split('T')[0],  status: 'scheduled' },
];

app.get('/api/medicines', authMiddleware, (_req, res) => res.json(MEDICINES));

app.get('/api/treatments', authMiddleware, (_req, res) => {
  res.json([
    { id: 1, batchId: 1, batchCode: 'B-2024-001', medicineName: 'Tetracycline 500mg', dosageMl: 10, administeredAt: new Date().toISOString(), administeredBy: 'Maria Santos', withdrawalDays: 7, symptoms: 'Respiratory distress', diagnosis: 'CRD suspected' },
    { id: 2, batchId: 5, batchCode: 'B-2024-005', medicineName: 'B-Complex Vitamins', dosageMl: 0,  administeredAt: new Date(Date.now() - 3*86400000).toISOString(), administeredBy: 'Maria Santos', withdrawalDays: 0, symptoms: 'Low appetite', diagnosis: 'Vitamin deficiency' },
  ]);
});

app.post('/api/treatments', authMiddleware, (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body, createdAt: new Date().toISOString() });
});

app.get('/api/treatments/active-withdrawal', authMiddleware, (_req, res) => {
  const safeDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  res.json([
    { id: 1, batchCode: 'B-2024-001', medicineName: 'Tetracycline 500mg', administeredAt: new Date().toISOString(), withdrawalDays: 7, safeDate, daysLeft: 7 },
  ]);
});

app.get('/api/vaccinations', authMiddleware, (_req, res) => res.json(VACCINATIONS));
app.get('/api/vaccinations/schedule', authMiddleware, (_req, res) => res.json(VACCINATIONS));

// ════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/inventory', authMiddleware, (_req, res) => {
  res.json([
    { id: 1, category: 'feed',     name: 'Starter Mix (Type A)', current: 4200, capacity: 10000, unit: 'kg',    minThreshold: 1000, reorderPoint: 2000, lastUpdated: '6:30 AM', supplier: 'AgriFeeds Corp',  location: 'Feed Warehouse A' },
    { id: 2, category: 'feed',     name: 'Grower Pellets (A)',   current: 3100, capacity: 8000,  unit: 'kg',    minThreshold:  800, reorderPoint: 1500, lastUpdated: '7:00 AM', supplier: 'PrimeFeed Ltd',   location: 'Feed Warehouse B' },
    { id: 3, category: 'feed',     name: 'Finisher Crumbles',    current:  950, capacity: 5000,  unit: 'kg',    minThreshold:  500, reorderPoint: 1000, lastUpdated: '7:00 AM', supplier: 'PrimeFeed Ltd',   location: 'Feed Warehouse B' },
    { id: 4, category: 'medicine', name: 'Newcastle Vaccine',    current:  200, capacity: 1000,  unit: 'doses', minThreshold:  100, reorderPoint:  200, lastUpdated: 'Yesterday', expiryDate: '2025-03-15', supplier: 'VetCare PH', location: 'Medicine Cabinet 1' },
    { id: 5, category: 'medicine', name: 'Gumboro Vaccine',      current:   50, capacity:  500,  unit: 'doses', minThreshold:   80, reorderPoint:  150, lastUpdated: 'Yesterday', expiryDate: '2025-02-28', supplier: 'VetCare PH', location: 'Medicine Cabinet 1' },
    { id: 6, category: 'eggs',     name: 'Large Eggs (stock)',   current: 8400, capacity: 20000, unit: 'pcs',   minThreshold: 2000, reorderPoint: 4000, lastUpdated: '7:30 AM',  location: 'Egg Cold Storage' },
    { id: 7, category: 'eggs',     name: 'Medium Eggs (stock)',  current: 3200, capacity: 10000, unit: 'pcs',   minThreshold: 1000, reorderPoint: 2000, lastUpdated: '7:30 AM',  location: 'Egg Cold Storage' },
  ]);
});

app.get('/api/inventory/alerts', authMiddleware, (_req, res) => {
  res.json([
    { id: 3, name: 'Finisher Crumbles', level: 'low',      unit: 'kg',    current: 950,  threshold: 1000 },
    { id: 5, name: 'Gumboro Vaccine',   level: 'critical', unit: 'doses', current: 50,   threshold: 80   },
  ]);
});

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/analytics/production', authMiddleware, (req, res) => {
  const dateFrom = req.query.date_from;
  const dateTo   = req.query.date_to;
  const days     = dateFrom && dateTo
    ? Math.ceil((new Date(dateTo) - new Date(dateFrom)) / 86400000) + 1
    : 30;

  const trend = Array.from({ length: Math.min(days, 90) }, (_, i) => {
    const d = new Date(dateFrom || new Date());
    if (dateFrom) d.setDate(d.getDate() + i);
    else          d.setDate(d.getDate() - (days - 1 - i));
    const dow = d.getDay();
    // Higher on weekends (more staff for collection)
    const base = (dow === 0 || dow === 6) ? 9200 : 8100;
    return {
      date: d.toISOString().split('T')[0],
      eggs: Math.floor(base + Math.random() * 4500),
    };
  });
  const total     = trend.reduce((s, d) => s + d.eggs, 0);
  const avg_daily = Math.round(total / trend.length);
  res.json({ trend, avg_daily, total });
});

app.get('/api/analytics/fcr', authMiddleware, (_req, res) => {
  const by_batch = FLOCK_BATCHES.filter(b => b.status === 'Active').map(b => ({
    batch:    b.batchCode,
    building: b.houseName,
    fcr:      b.fcr,
    age:      b.ageDays,
    feed_kg:  Math.floor(b.fcr * (b.ageDays * b.population * 0.0012)),
    eggs:     Math.floor(b.population * b.ageDays * 0.0008),
  }));
  const farm_avg = parseFloat((by_batch.reduce((s, b) => s + b.fcr, 0) / by_batch.length).toFixed(2));
  res.json({ farm_avg, by_batch });
});

app.get('/api/analytics/mortality', authMiddleware, (req, res) => {
  const dateFrom = req.query.date_from;
  const dateTo   = req.query.date_to;
  const days     = dateFrom && dateTo
    ? Math.ceil((new Date(dateTo) - new Date(dateFrom)) / 86400000)
    : 49;
  const numWeeks = Math.max(4, Math.min(Math.ceil(days / 7), 12));

  const weekly = Array.from({ length: numWeeks }, (_, i) => ({
    week: `W${i + 1}`,
    pct:  parseFloat((0.4 + Math.random() * 2.5).toFixed(2)),
  }));
  const avg_pct   = parseFloat((weekly.reduce((s, w) => s + w.pct, 0) / weekly.length).toFixed(2));
  const best  = FLOCK_BATCHES.reduce((b, c) => c.mortalityPct < b.mortalityPct ? c : b);
  const worst = FLOCK_BATCHES.filter(b => b.status === 'Active').reduce((b, c) => c.mortalityPct > b.mortalityPct ? c : b);
  res.json({ weekly, avg_pct, best_batch: best.batchCode, worst_batch: worst.batchCode });
});

app.get('/api/analytics/profitability', authMiddleware, (_req, res) => {
  res.json({
    revenue: 124500, feed_costs: 22800, medicine_costs: 3200, labor: 5125,
    gross_profit: 93375, gross_margin_pct: 75,
    cost_per_egg: 1.84, revenue_per_egg: 2.50, margin_per_egg: 0.66,
    by_batch: FLOCK_BATCHES.filter(b => b.status === 'Active').map(b => ({
      batch: b.batchCode, building: b.houseName, revenue: Math.floor(Math.random() * 40000 + 10000),
      feed_cost: Math.floor(Math.random() * 10000 + 2000), gross_margin_pct: Math.floor(Math.random() * 30 + 50),
      cost_per_egg: (1.5 + Math.random() * 1.2).toFixed(2),
    })),
  });
});

// ════════════════════════════════════════════════════════════════════════════
// REPORTS (async job simulation)
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/reports', authMiddleware, (req, res) => {
  const jobId = `job-${Date.now()}`;
  reportJobs[jobId] = {
    job_id:      jobId,
    name:        (req.body.report_type || 'report').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    report_type: req.body.report_type,
    format:      req.body.format,
    date_from:   req.body.date_from,
    date_to:     req.body.date_to,
    building:    req.body.building,
    status:      'processing',
    progress:    0,
    created_at:  new Date().toISOString(),
  };

  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 25) + 10;
    if (progress >= 100) {
      clearInterval(interval);
      reportJobs[jobId].status   = 'ready';
      reportJobs[jobId].progress = 100;
      reportJobs[jobId].size     = `${Math.floor(Math.random() * 400 + 50)} KB`;
      reportJobs[jobId].download_url = `/api/reports/${jobId}/download`;
    } else {
      reportJobs[jobId].progress = progress;
    }
  }, 800);

  res.status(202).json({ job_id: jobId });
});

app.get('/api/reports/:jobId', authMiddleware, (req, res) => {
  const job = reportJobs[req.params.jobId];
  if (!job) return res.status(404).json({ message: 'Report job not found.' });
  res.json(job);
});

app.get('/api/reports/:jobId/download', authMiddleware, (req, res) => {
  const job = reportJobs[req.params.jobId];
  if (!job || job.status !== 'ready') return res.status(404).json({ message: 'Report not ready.' });

  const format = job.format || 'xlsx';
  const type   = job.report_type || job.name || 'daily-production';
  const now    = new Date().toLocaleString('en-PH');

  // ── Generate CSV data for each report type ──────────────────────────────────
  let csvRows = [];
  let title   = job.name || 'Report';

  if (type.includes('production') || type === 'daily-production' || type === 'weekly-production' || type === 'monthly-production') {
    title = 'Production Report';
    csvRows = [
      ['Date', 'Building', 'Batch', 'Eggs Collected', 'Target', 'Variance', 'Quality %'],
      ...FLOCK_BATCHES.filter(b => b.status === 'Active').map((b, i) => [
        new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        b.houseName, b.batchCode,
        Math.floor(8000 + Math.random() * 4000),
        8500,
        Math.floor((Math.random() - 0.3) * 2000),
        (96 + Math.random() * 3).toFixed(1) + '%',
      ]),
    ];
  } else if (type.includes('egg-inventory') || type === 'egg-inventory') {
    title = 'Egg Inventory Report';
    csvRows = [
      ['Size', 'Min Weight (g)', 'Max Weight (g)', 'Current Stock', 'Price/Egg (₱)', 'Total Value (₱)', 'Stock Level'],
      ['Small',       45, 52,  1100, '1.80',  (1100*1.80).toFixed(2),  'Normal'],
      ['Medium',      53, 62,  3200, '2.10',  (3200*2.10).toFixed(2),  'Normal'],
      ['Large',       63, 72,  8400, '2.50',  (8400*2.50).toFixed(2),  'Good'],
      ['Extra Large', 73, 84,   620, '3.00',  (620*3.00).toFixed(2),   'Low'],
      ['Jumbo',       85,999,   180, '3.50',  (180*3.50).toFixed(2),   'Critical'],
      ['TOTAL', '', '', 1100+3200+8400+620+180, '', ((1100*1.80)+(3200*2.10)+(8400*2.50)+(620*3.00)+(180*3.50)).toFixed(2), ''],
    ];
  } else if (type.includes('feed') || type === 'feed-inventory') {
    title = 'Feed Inventory Report';
    csvRows = [
      ['Feed Type', 'Category', 'Quantity (kg)', 'Price/kg (₱)', 'Value (₱)', 'Stock %', 'Supplier', 'Status'],
      ['Starter Mix (Type A)', 'Starter',  4200, '28.50', (4200*28.50).toFixed(2), '42%', 'AgriFeeds Corp', 'Normal'],
      ['Starter Mix (Type B)', 'Starter',  1800, '26.00', (1800*26.00).toFixed(2), '18%', 'AgriFeeds Corp', 'Low'],
      ['Grower Pellets (A)',   'Grower',   3100, '24.00', (3100*24.00).toFixed(2), '39%', 'PrimeFeed Ltd',  'Normal'],
      ['Finisher Crumbles',   'Finisher',  950, '22.50', (950*22.50).toFixed(2),  '19%', 'PrimeFeed Ltd',  'Critical'],
      ['Layer Mash (Premium)','Layer',    2750, '25.00', (2750*25.00).toFixed(2), '46%', 'NutriPro',       'Normal'],
    ];
  } else if (type.includes('medicine')) {
    title = 'Medicine Inventory Report';
    csvRows = [
      ['Medicine', 'Type', 'Stock', 'Unit', 'Expiry Date', 'Withdrawal Days', 'Supplier', 'Status'],
      ...MEDICINES.map(m => [m.name, m.type, m.stock, m.unit, m.expiryDate, m.withdrawalDays, m.supplier, m.stock < 50 ? 'Low' : 'Normal']),
    ];
  } else if (type.includes('sales')) {
    title = 'Sales Report';
    csvRows = [
      ['Invoice No.', 'Customer', 'Date', 'Egg Size', 'Quantity', 'Unit Price (₱)', 'Subtotal (₱)', 'Payment', 'Status'],
      ['INV-1042', 'Metro Fresh Market',     new Date().toLocaleDateString(), 'Large',       8000, '2.50', '20,000', 'Cash',          'Paid'],
      ['INV-1042', 'Metro Fresh Market',     new Date().toLocaleDateString(), 'Medium',      2000, '2.10', '4,200',  'Cash',          'Paid'],
      ['INV-1041', 'Sunrise Supermarket',    new Date(Date.now()-86400000).toLocaleDateString(), 'Large', 5000, '2.50', '12,500', 'Bank Transfer', 'Paid'],
      ['INV-1040', 'Casa Manila Restaurant', new Date(Date.now()-172800000).toLocaleDateString(), 'Extra Large', 2500, '3.00', '7,500', 'Credit', 'Pending'],
      ['INV-1038', 'Metro Fresh Market',     new Date(Date.now()-432000000).toLocaleDateString(), 'Large', 10000, '2.50', '25,000', 'Credit', 'Overdue'],
    ];
  } else if (type.includes('profitability') || type.includes('cost')) {
    title = 'Profitability Report';
    csvRows = [
      ['Batch', 'Building', 'Revenue (₱)', 'Feed Cost (₱)', 'Medicine Cost (₱)', 'Labor Alloc (₱)', 'Gross Profit (₱)', 'Margin %'],
      ...FLOCK_BATCHES.filter(b => b.status === 'Active').map(b => {
        const rev  = Math.floor(25000 + Math.random() * 30000);
        const feed = Math.floor(rev * 0.18);
        const med  = Math.floor(rev * 0.03);
        const lab  = Math.floor(rev * 0.04);
        const gp   = rev - feed - med - lab;
        return [b.batchCode, b.houseName, rev, feed, med, lab, gp, ((gp/rev)*100).toFixed(1)+'%'];
      }),
    ];
  } else if (type.includes('mortality')) {
    title = 'Mortality Report';
    csvRows = [
      ['Date', 'Batch', 'Building', 'Count', 'Cause', 'Severity', 'Mortality %', 'Recorded By'],
      [new Date().toLocaleDateString(), 'B-2024-005', 'Alpha-2', 7, 'Disease', 'Elevated', '3.0%', 'Maria Santos'],
      [new Date(Date.now()-86400000).toLocaleDateString(), 'B-2024-001', 'Alpha-1', 2, 'Natural', 'Normal', '0.2%', 'Juan dela Cruz'],
    ];
  } else if (type.includes('vaccination')) {
    title = 'Vaccination Report';
    csvRows = [
      ['Batch', 'Building', 'Vaccine', 'Scheduled Date', 'Status', 'Completed Date', 'Administered By', 'LOT No.'],
      ['B-2024-002', 'Beta-2',  'Newcastle Stage 2', new Date().toLocaleDateString(), 'Completed', new Date().toLocaleDateString(), 'Maria Santos', 'LOT-2024-001'],
      ['B-2024-001', 'Alpha-1', 'Newcastle Stage 3', new Date(Date.now()+864000000).toLocaleDateString(), 'Scheduled', '', '', ''],
      ['B-2024-004', 'Delta-1', "Marek's Disease",   new Date(Date.now()-172800000).toLocaleDateString(), 'Overdue',   '', '', ''],
    ];
  } else if (type.includes('treatment')) {
    title = 'Treatment History Report';
    csvRows = [
      ['Date', 'Batch', 'Building', 'Medicine', 'Dosage', 'Duration (days)', 'Birds Treated', 'Diagnosis', 'Withdrawal Ends', 'Administered By'],
      [new Date().toLocaleDateString(), 'B-2024-001', 'Alpha-1', 'Tetracycline 500mg', '10ml/L water', 5, 150, 'CRD Suspected', new Date(Date.now()+604800000).toLocaleDateString(), 'Maria Santos'],
      [new Date(Date.now()-259200000).toLocaleDateString(), 'B-2024-005', 'Alpha-2', 'B-Complex Vitamins', 'Mix in feed', 3, 14850, 'Vitamin B Deficiency', 'N/A', 'Maria Santos'],
    ];
  } else {
    title = job.name || 'Report';
    csvRows = [
      ['Field', 'Value'],
      ['Generated', now],
      ['Report Type', type],
      ['Farm', 'GreenValley Poultry Farm'],
      ['Total Birds', FLOCK_BATCHES.filter(b => b.status === 'Active').reduce((s, b) => s + b.population, 0).toLocaleString()],
    ];
  }

  // ── Serialize to CSV ────────────────────────────────────────────────────────
  const escapeCSV = val => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [
    `# ${title}`,
    `# GreenValley Poultry Farm`,
    `# Generated: ${now}`,
    `# Date Range: ${job.date_from || 'N/A'} to ${job.date_to || 'N/A'}`,
    '',
    ...csvRows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  if (format === 'xlsx') {
    // Return CSV as .csv (client can open in Excel)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g,'-')}_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } else {
    // Return HTML styled for print → PDF
    const tableRows = csvRows.slice(1).map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    const headers = csvRows[0] ? csvRows[0].map(h => `<th>${h}</th>`).join('') : '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #0b1c30; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #012d1d; padding-bottom: 12px; }
  .farm-name { font-size: 18px; font-weight: 700; color: #012d1d; }
  .report-title { font-size: 14px; font-weight: 700; margin-top: 4px; }
  .meta { text-align: right; font-size: 10px; color: #717973; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #012d1d; color: white; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5eeff; font-size: 10px; }
  tr:nth-child(even) td { background: #f4f7f4; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #c1c8c2; font-size: 9px; color: #717973; display: flex; justify-content: space-between; }
  @media print { body { padding: 10px; } @page { margin: 15mm; } }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="farm-name">🐔 GreenValley Poultry Farm</div>
      <div class="report-title">${title}</div>
    </div>
    <div class="meta">
      <div>Generated: ${now}</div>
      ${job.date_from ? `<div>Period: ${job.date_from} to ${job.date_to}</div>` : ''}
    </div>
  </div>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>PoultryFarm Pro ERP</span>
    <span>Confidential — For internal use only</span>
    <span>Page 1</span>
  </div>
  <script>window.onload=()=>window.print();</script>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${title.replace(/\s+/g,'-')}_${Date.now()}.html"`);
    res.send(html);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// SALES & CUSTOMERS
// ════════════════════════════════════════════════════════════════════════════

const CUSTOMERS = [
  { id: 1, name: 'Metro Fresh Market',    type: 'wholesale',  contact: 'Ramon Gil',   phone: '+63 912 777 8888', creditLimit: 50000, balance: 12500, active: true },
  { id: 2, name: 'Sunrise Supermarket',   type: 'wholesale',  contact: 'Elena Santos',phone: '+63 913 888 9999', creditLimit: 30000, balance: 0,     active: true },
  { id: 3, name: 'Casa Manila Restaurant',type: 'restaurant', contact: 'Chef Marcos', phone: '+63 914 999 0000', creditLimit: 20000, balance: 5000,  active: true },
];

app.get('/api/customers',    authMiddleware, (_req, res) => res.json(CUSTOMERS));
app.get('/api/sales',        authMiddleware, (_req, res) => res.json({ data: [], total: 0, current_page: 1, per_page: 20 }));
app.post('/api/sales', authMiddleware, (req, res) => {
  const sale = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
  // Deduct from mock egg inventory tracking (client-side signal is authoritative, this keeps server in sync)
  const items = req.body.line_items || req.body.items || [];
  items.forEach(item => {
    const size = item.egg_size || item.eggSize;
    const qty  = item.qty || item.quantity || 0;
    if (size && qty > 0) {
      // Track sold quantities (informational — actual stock signal lives in Angular)
      sale[`sold_${size}`] = qty;
    }
  });
  res.status(201).json(sale);
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — USERS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
  let data = USERS.map(({ password: _, ...u }) => u);
  if (req.query.role)   data = data.filter(u => u.role === req.query.role);
  if (req.query.status) data = data.filter(u => u.status === req.query.status);
  res.json(paginate(data, req.query.page, req.query.per_page));
});

app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  const { password: _, ...safe } = req.body;
  const user = { id: userIdCounter++, ...safe, status: 'active', createdAt: new Date().toISOString(), lastLogin: 'Never' };
  USERS.push({ ...user, password: req.body.password ?? 'changeme' });
  res.status(201).json(user);
});

app.put('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = USERS.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });
  // If password field provided, update it
  if (req.body.password) {
    USERS[idx].password = req.body.password;
    const { password: _, ...safe } = USERS[idx];
    return res.json({ ...safe, message: 'Password updated.' });
  }
  const { password: _, ...updates } = req.body;
  Object.assign(USERS[idx], updates);
  const { password: __, ...safe } = USERS[idx];
  res.json(safe);
});

app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) return res.status(403).json({ message: 'Cannot delete the primary admin account.' });
  const idx = USERS.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });
  USERS.splice(idx, 1);
  res.status(204).end();
});

app.post('/api/users/:id/toggle-status', authMiddleware, adminOnly, (req, res) => {
  const user = USERS.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.status = user.status === 'active' ? 'inactive' : 'active';
  const { password: _, ...safe } = user;
  res.json({ ...safe, message: `User ${user.status}.` });
});

app.post('/api/users/:id/reset-password', authMiddleware, adminOnly, (req, res) => {
  const user = USERS.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ message: `Password reset email sent to ${user.email}.` });
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — SYSTEM SETTINGS & MASTER DATA
// ════════════════════════════════════════════════════════════════════════════

const SETTINGS = {
  farm_name: 'GreenValley Poultry Farm', farm_code: 'GVF-001',
  currency: 'PHP', timezone: 'Asia/Manila',
  mortality_alert: 2, fcr_alert: 1.6, feed_low_tons: 2,
  notify_email: true, notify_sms: false,
};

app.get('/api/system-settings', authMiddleware, adminOnly, (_req, res) => res.json(SETTINGS));
app.put('/api/system-settings', authMiddleware, adminOnly, (req, res) => {
  Object.assign(SETTINGS, req.body);
  res.json({ ...SETTINGS, message: 'Settings saved.' });
});

// Master data endpoints
const BREEDS    = [{ id: 1, name: 'Cobb 500', type: 'broiler', origin: 'USA', avgFcr: 1.35, peakProdAge: 35, active: true }, { id: 2, name: 'Ross 308', type: 'broiler', origin: 'Scotland', avgFcr: 1.38, peakProdAge: 33, active: true }, { id: 3, name: 'Hubbard', type: 'dual', origin: 'France', avgFcr: 1.45, peakProdAge: 40, active: true }];
const FEED_TYPES = [{ id: 1, name: 'Starter Mix (Type A)', category: 'starter', ageFrom: 0, ageTo: 14, pricePerKg: 28.50, active: true }, { id: 2, name: 'Grower Pellets (A)', category: 'grower', ageFrom: 15, ageTo: 28, pricePerKg: 24.00, active: true }];
const SUPPLIERS = [{ id: 1, name: 'AgriFeeds Corp', category: 'Feed', contact: 'Jose Santos', phone: '+63 912 111 2222', email: 'orders@agrifeeds.ph', rating: 5, active: true }, { id: 2, name: 'VetCare PH', category: 'Medicine', contact: 'Dr. Reyes', phone: '+63 918 333 4444', email: 'orders@vetcare.ph', rating: 5, active: true }];

app.get('/api/master-data/breeds',     authMiddleware, adminOnly, (_req, res) => res.json(BREEDS));
app.post('/api/master-data/breeds',    authMiddleware, adminOnly, (req, res) => { const b = { id: Date.now(), ...req.body, active: true }; BREEDS.push(b); res.status(201).json(b); });
app.put('/api/master-data/breeds/:id', authMiddleware, adminOnly, (req, res) => { const b = BREEDS.find(x => x.id === parseInt(req.params.id)); if (!b) return res.status(404).end(); Object.assign(b, req.body); res.json(b); });
app.delete('/api/master-data/breeds/:id', authMiddleware, adminOnly, (req, res) => { const i = BREEDS.findIndex(x => x.id === parseInt(req.params.id)); if (i === -1) return res.status(404).end(); BREEDS.splice(i, 1); res.status(204).end(); });

app.get('/api/master-data/feed-types',  authMiddleware, adminOnly, (_req, res) => res.json(FEED_TYPES));
app.get('/api/master-data/suppliers',   authMiddleware, adminOnly, (_req, res) => res.json(SUPPLIERS));
app.get('/api/master-data/medicines',   authMiddleware, (_req, res) => res.json(MEDICINES));
app.get('/api/master-data/customers',   authMiddleware, adminOnly, (_req, res) => res.json(CUSTOMERS));

// Feed receiving
app.post('/api/feed-receiving', authMiddleware, (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body, received_at: new Date().toISOString() });
});

// Update / reschedule vaccination
app.put('/api/vaccinations/:id', authMiddleware, (req, res) => {
  const vacc = VACCINATIONS.find(v => v.id === parseInt(req.params.id));
  if (!vacc) return res.status(404).json({ message: 'Vaccination not found.' });
  if (req.body.scheduled_date) vacc.scheduledDate = req.body.scheduled_date;
  if (req.body.status)         vacc.status        = req.body.status;
  res.json(vacc);
});

// Mark vaccination done
app.post('/api/vaccinations/:id/complete', authMiddleware, (req, res) => {
  const vacc = VACCINATIONS.find(v => v.id === parseInt(req.params.id));
  if (!vacc) return res.status(404).json({ message: 'Vaccination not found.' });
  Object.assign(vacc, { status:'completed', completedDate:'Today', administeredBy: req.body?.administered_by || 'Staff', batchNo: req.body?.batch_no });
  res.json(vacc);
});

// Schedule vaccination
app.post('/api/vaccinations', authMiddleware, (req, res) => {
  const vacc = { id: Date.now(), ...req.body, status: 'scheduled' };
  VACCINATIONS.push(vacc);
  res.status(201).json(vacc);
});

// Damaged eggs
app.post('/api/damaged-eggs', authMiddleware, (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body, created_at: new Date().toISOString() });
});

// Master data CRUD (feed-types, suppliers)
app.post('/api/master-data/feed-types', authMiddleware, adminOnly, (req, res) => {
  const ft = { id: Date.now(), ...req.body, active: true };
  FEED_TYPES.push(ft);
  res.status(201).json(ft);
});
app.put('/api/master-data/feed-types/:id', authMiddleware, adminOnly, (req, res) => {
  const ft = FEED_TYPES.find(x => x.id === parseInt(req.params.id));
  if (!ft) return res.status(404).end();
  Object.assign(ft, req.body);
  res.json(ft);
});
app.post('/api/master-data/suppliers', authMiddleware, adminOnly, (req, res) => {
  const s = { id: Date.now(), ...req.body, active: true };
  SUPPLIERS.push(s);
  res.status(201).json(s);
});
app.put('/api/master-data/suppliers/:id', authMiddleware, adminOnly, (req, res) => {
  const s = SUPPLIERS.find(x => x.id === parseInt(req.params.id));
  if (!s) return res.status(404).end();
  Object.assign(s, req.body);
  res.json(s);
});


// ── Forgot / Reset Password ────────────────────────────────────────────────────
// In production these trigger email delivery; mock just validates email exists
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = USERS.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: 'No account found with this email address.' });
  }
  // Generate a fake token (in production, store in DB + email it)
  const token = Buffer.from(email + ':' + Date.now()).toString('base64');
  res.json({
    message: 'Password reset link sent.',
    // In demo mode, include token so client can proceed without email
    demo_token: token,
    demo_reset_url: `http://localhost:4200/reset-password?token=${token}&email=${encodeURIComponent(email)}`,
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    return res.status(422).json({ message: 'Token, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(422).json({ message: 'Password must be at least 8 characters.' });
  }
  const user = USERS.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token.' });
  }
  // Update password in mock store
  user.password = password;
  res.json({ message: 'Password updated successfully. You can now log in.' });
});


// ── Notifications (persistent read state per user) ───────────────────────────
// Server-side store: userId → Set of read notification IDs
const readNotifsByUser = {};

const SERVER_NOTIFICATIONS = [
  { id:'n1',  level:'critical', category:'mortality',   icon:'emergency',    title:'Mortality Spike — Alpha-2',          message:'B-2024-005 reported 7 bird deaths (3.0%). Exceeds 2% threshold.',        time:'2h ago',   route:'/flocks',              batch:'B-2024-005', building:'Alpha-2', forRoles:['admin','manager','supervisor'] },
  { id:'n2',  level:'critical', category:'health',      icon:'warning',      title:'FCR Critical — Alpha-2',             message:'B-2024-005 FCR is 1.68, above the 1.6 threshold. Review feed schedule.',  time:'3h ago',   route:'/manager/analytics',   batch:'B-2024-005', building:'Alpha-2', forRoles:['admin','manager'] },
  { id:'n3',  level:'warning',  category:'vaccination', icon:'vaccines',     title:'Vaccination Overdue — Delta-1',      message:"B-2024-004 Marek's Disease Stage 2 is 2 days overdue. Act now.",          time:'1 day ago', route:'/health',              batch:'B-2024-004', building:'Delta-1', forRoles:['admin','manager','supervisor'] },
  { id:'n4',  level:'warning',  category:'feed',        icon:'inventory_2',  title:'Feed Stock Low — Finisher Crumbles', message:'950 kg remaining (19%). Reorder threshold is 1,000 kg.',                 time:'5h ago',   route:'/feed',                                             forRoles:['admin','manager','supervisor'] },
  { id:'n5',  level:'warning',  category:'feed',        icon:'inventory_2',  title:'Feed Stock Low — Starter Mix (B)',   message:'1,800 kg remaining (18%). Estimated 4 days of supply left.',             time:'5h ago',   route:'/feed',                                             forRoles:['admin','manager','supervisor'] },
  { id:'n6',  level:'warning',  category:'health',      icon:'schedule',     title:'Withdrawal Period Active',           message:'B-2024-001 — Tetracycline. Egg withdrawal ends in 7 days. Do not sell.', time:'8:00 AM',  route:'/health',              batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','manager','supervisor','worker'] },
  { id:'n7',  level:'info',     category:'vaccination', icon:'vaccines',     title:'Vaccination Due Tomorrow',           message:'B-2024-001 Newcastle Stage 3 scheduled for tomorrow.',                   time:'6h ago',   route:'/health',              batch:'B-2024-001',                    forRoles:['admin','manager','supervisor'] },
  { id:'n8',  level:'info',     category:'feed',        icon:'grass',        title:'Feed Delivery Received',             message:'2,000 kg Starter Mix (B) received from AgriFeeds Corp.',                time:'Yesterday', route:'/feed',                                            forRoles:['admin','manager','supervisor'] },
  { id:'n9',  level:'success',  category:'production',  icon:'task_alt',     title:'8 Entries Verified',                 message:'Maria Santos verified 8 production entries for today.',                  time:'8h ago',   route:'/eggs',                                            forRoles:['admin','manager','supervisor','worker'] },
  { id:'n10', level:'success',  category:'eggs',        icon:'egg',          title:'Daily Target Met — Beta-2',          message:'B-2024-002 collected 1,480 eggs — exceeds 1,200 target.',                time:'9h ago',   route:'/eggs',                batch:'B-2024-002', building:'Beta-2',  forRoles:['admin','manager','supervisor','worker'] },
  { id:'n11', level:'info',     category:'sales',       icon:'trending_up',  title:'Monthly Revenue Milestone',          message:'Farm reached ₱100,000 in monthly revenue — 3 days ahead of last month.', time:'2d ago',  route:'/sales',                                            forRoles:['admin','manager'] },
  { id:'n12', level:'success',  category:'vaccination', icon:'check_circle', title:'Gumboro Vaccination Complete',       message:'B-2024-002 Gumboro Stage 2 completed for all 15,000 birds.',            time:'Today',    route:'/health',              batch:'B-2024-002', building:'Beta-2',  forRoles:['admin','manager','supervisor'] },
  { id:'n13', level:'info',     category:'eggs',        icon:'egg_alt',      title:'Damaged Egg Report Logged',          message:'Worker logged 12 cracked eggs in Alpha-1. Batch B-2024-001.',            time:'30m ago',  route:'/eggs',                batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','manager','supervisor','worker'] },
  { id:'n14', level:'info',     category:'system',      icon:'settings',     title:'Egg Prices Updated',                 message:'Admin updated egg pricing: Large ₱2.50, Extra Large ₱3.00.',             time:'1d ago',   route:'/admin/settings',                                   forRoles:['admin','manager'] },
  { id:'n15', level:'warning',  category:'health',      icon:'medication',   title:'Medicine Stock Low — Gumboro',       message:'Gumboro vaccine: 50 doses remaining (25%). Reorder recommended.',        time:'12h ago',  route:'/health',                                           forRoles:['admin','manager','supervisor'] },
  { id:'n16', level:'info',     category:'production',  icon:'grass',        title:'Feed Log Submitted',                 message:'Juan dela Cruz submitted feed log for Alpha-1 — 450 kg Starter A.',      time:'6:30 AM',  route:'/feed',                batch:'B-2024-001', building:'Alpha-1', forRoles:['admin','supervisor'] },
  { id:'n17', level:'success',  category:'eggs',        icon:'egg',          title:'Collection Complete — All Houses',   message:'All 5 houses have submitted egg collection for today.',                   time:'8:00 AM',  route:'/eggs',                                            forRoles:['admin','manager','supervisor'] },
];

app.get('/api/notifications', authMiddleware, (req, res) => {
  const userId   = req.user?.id?.toString() ?? '0';
  const userRole = req.user?.role ?? 'worker';
  const readSet  = readNotifsByUser[userId] ?? new Set();

  const notifications = SERVER_NOTIFICATIONS
    .filter(n => n.forRoles.includes(userRole))
    .map(n => ({ ...n, read: readSet.has(n.id) }));

  res.json({ data: notifications, total: notifications.length });
});

// Notifications mark-read
app.post('/api/notifications/read', authMiddleware, (req, res) => {
  const userId = req.user?.id?.toString() ?? '0';
  if (!readNotifsByUser[userId]) readNotifsByUser[userId] = new Set();
  const ids = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
  ids.forEach(id => readNotifsByUser[userId].add(String(id)));
  res.json({ success: true, read_ids: [...readNotifsByUser[userId]] });
});

app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
  const userId   = req.user?.id?.toString() ?? '0';
  const userRole = req.user?.role ?? 'worker';
  if (!readNotifsByUser[userId]) readNotifsByUser[userId] = new Set();
  SERVER_NOTIFICATIONS
    .filter(n => n.forRoles.includes(userRole))
    .forEach(n => readNotifsByUser[userId].add(n.id));
  res.json({ success: true });
});

// Egg inventory movements
app.get('/api/egg-inventory/movements', authMiddleware, (req, res) => {
  const movements = EGG_COLLECTIONS.slice(0, 20).flatMap(c => {
    const movs = [];
    const sizes = ['small', 'medium', 'large', 'extra_large', 'jumbo'];
    sizes.forEach(sz => {
      const qty = c.sizes?.[sz] ?? c[sz] ?? 0;
      if (qty > 0) {
        movs.push({
          id:      c.id * 10 + movs.length,
          date:    c.collected_at ?? c.date ?? new Date().toISOString(),
          type:    'collected',
          size:    sz,
          qty,
          ref:     (c.batchCode ?? c.batch_code ?? 'Batch') + ' · ' + (c.building ?? c.houseName ?? ''),
          balance: qty,
        });
      }
    });
    return movs;
  });
  res.json(movements);
});

// Analytics per-building breakdown
app.get('/api/analytics/buildings', authMiddleware, (req, res) => {
  res.json({
    by_building: [
      { building: 'Alpha-1', eggs: 40320, fcr: 1.42, mortality_pct: 1.2 },
      { building: 'Alpha-2', eggs: 22680, fcr: 1.68, mortality_pct: 3.0 },
      { building: 'Beta-2',  eggs: 46200, fcr: 1.35, mortality_pct: 0.5 },
      { building: 'Delta-1', eggs: 29400, fcr: 1.10, mortality_pct: 0.1 },
      { building: 'Gamma-3', eggs: 27720, fcr: 1.55, mortality_pct: 2.1 },
    ],
  });
});


// ── Farm & Buildings ──────────────────────────────────────────────────────────
const FARM_BUILDINGS = [
  { id:1, name:'Alpha-1', type:'Broiler', capacity:15000, status:'active',   batchCode:'B-2024-001', population:12450, supervisor:'Juan dela Cruz',  fcr:1.42, mortalityPct:1.2 },
  { id:2, name:'Alpha-2', type:'Broiler', capacity:15000, status:'active',   batchCode:'B-2024-005', population:14850, supervisor:'Juan dela Cruz',  fcr:1.68, mortalityPct:3.0 },
  { id:3, name:'Beta-1',  type:'Layer',   capacity:12000, status:'inactive', batchCode:null,          population:0,     supervisor:'Pedro Reyes',     fcr:null, mortalityPct:null },
  { id:4, name:'Beta-2',  type:'Layer',   capacity:12000, status:'active',   batchCode:'B-2024-002', population:15000, supervisor:'Pedro Reyes',     fcr:1.35, mortalityPct:0.5  },
  { id:5, name:'Gamma-3', type:'Broiler', capacity:18000, status:'active',   batchCode:null,          population:0,     supervisor:'Rosa Mendoza',    fcr:null, mortalityPct:null },
  { id:6, name:'Delta-1', type:'Breeder', capacity:10000, status:'active',   batchCode:'B-2024-004', population:10200, supervisor:'Carlos Bautista', fcr:1.10, mortalityPct:0.1  },
];

app.get('/api/farm/buildings', authMiddleware, (req, res) => {
  res.json({
    data:  FARM_BUILDINGS,
    total: FARM_BUILDINGS.length,
    meta: {
      total_capacity:    FARM_BUILDINGS.reduce((s,b) => s + b.capacity, 0),
      total_population:  FARM_BUILDINGS.reduce((s,b) => s + b.population, 0),
      active_count:      FARM_BUILDINGS.filter(b => b.status === 'active').length,
      occupancy_pct:     Math.round(
        FARM_BUILDINGS.reduce((s,b) => s+b.population,0) /
        FARM_BUILDINGS.reduce((s,b) => s+b.capacity,0) * 100
      ),
    },
  });
});

app.put('/api/farm/buildings/:id', authMiddleware, adminOnly, (req, res) => {
  const building = FARM_BUILDINGS.find(b => b.id === parseInt(req.params.id));
  if (!building) return res.status(404).json({ message: 'Building not found.' });
  Object.assign(building, req.body);
  res.json(building);
});


// ════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', environment: 'mock', timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ message: 'Endpoint not found.' }));

app.listen(PORT, () => {
  console.log(`\n🐔 PoultryFarm Pro Mock API — http://localhost:${PORT}`);
  console.log('─'.repeat(50));
  console.log('  admin1@admin.com / admin1');
  console.log('  manager1@manager.com / manager1');
  console.log('  supervisor1@supervisor.com / supervisor1');
  console.log('  worker1@worker.com / worker1');
  console.log('─'.repeat(50));
  console.log('  GET  /api/health           Health check');
  console.log('  POST /api/auth/login       Login');
  console.log('  GET  /api/dashboard/kpis   Dashboard KPIs');
  console.log('─'.repeat(50));
  console.log('  Replace with Laravel API for production.\n');
});

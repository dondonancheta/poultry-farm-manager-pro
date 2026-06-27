<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    private array $reportTypes = [
        'daily-production'   => 'Daily Production Report',
        'weekly-production'  => 'Weekly Production Report',
        'monthly-production' => 'Monthly Production Report',
        'egg-inventory'      => 'Egg Inventory Report',
        'feed-inventory'     => 'Feed Inventory Report',
        'medicine-inventory' => 'Medicine Inventory Report',
        'sales'              => 'Sales Report',
        'profitability'      => 'Profitability Report',
        'mortality'          => 'Mortality Report',
        'vaccination'        => 'Vaccination Report',
        'treatment'          => 'Treatment History Report',
        'fcr-analysis'       => 'FCR Analysis Report',
    ];

    /** POST /api/reports — queue report job */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'report_type' => 'required|string',
            'format'      => 'required|in:pdf,xlsx',
            'date_from'   => 'nullable|date',
            'date_to'     => 'nullable|date',
            'building'    => 'nullable|string',
        ]);

        $jobId = (string) Str::uuid();
        $name  = $this->reportTypes[$data['report_type']] ?? ucwords(str_replace('-', ' ', $data['report_type']));

        // Store job metadata in cache (60 minutes)
        Cache::put("report:{$jobId}", [
            'job_id'      => $jobId,
            'name'        => $name,
            'report_type' => $data['report_type'],
            'format'      => $data['format'],
            'date_from'   => $data['date_from'] ?? now()->subDays(30)->format('Y-m-d'),
            'date_to'     => $data['date_to']   ?? now()->format('Y-m-d'),
            'building'    => $data['building']  ?? null,
            'status'      => 'processing',
            'progress'    => 0,
            'created_at'  => now()->toIso8601String(),
        ], 3600);

        // Simulate async processing by scheduling a cache update
        // In production, dispatch a real Laravel job here:
        // GenerateReportJob::dispatch($jobId)->onQueue('reports');
        Cache::put("report:{$jobId}", array_merge(Cache::get("report:{$jobId}"), [
            'status'   => 'ready',
            'progress' => 100,
        ]), 3600);

        return response()->json([
            'job_id' => $jobId,
            'name'   => $name,
            'status' => 'processing',
        ], 201);
    }

    /** GET /api/reports/{jobId} — poll status */
    public function status(string $jobId): JsonResponse
    {
        $job = Cache::get("report:{$jobId}");

        if (! $job) {
            return response()->json(['message' => 'Report job not found.'], 404);
        }

        return response()->json($job);
    }

    /** GET /api/reports/{jobId}/download — stream file */
    public function download(string $jobId): mixed
    {
        $job = Cache::get("report:{$jobId}");

        if (! $job || $job['status'] !== 'ready') {
            return response()->json(['message' => 'Report not ready.'], 404);
        }

        $data  = $this->gatherData($job);
        $title = $job['name'];

        if ($job['format'] === 'pdf') {
            $pdf = Pdf::loadView('reports.template', [
                'title'    => $title,
                'rows'     => $data['rows'],
                'headers'  => $data['headers'],
                'dateFrom' => $job['date_from'],
                'dateTo'   => $job['date_to'],
                'generated'=> now()->format('M d, Y H:i'),
            ]);
            $filename = Str::slug($title) . '_' . now()->format('Ymd') . '.pdf';
            return $pdf->download($filename);
        }

        // CSV download (opens in Excel — no extra library needed)
        $filename = Str::slug($title) . '_' . now()->format('Ymd') . '.csv';
        $headers  = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($data, $title, $job) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel UTF-8
            fwrite($handle, "\xEF\xBB\xBF");
            // Metadata
            fputcsv($handle, ["# {$title}"]);
            fputcsv($handle, ["# GreenValley Poultry Farm"]);
            fputcsv($handle, ["# Generated: " . now()->format('M d, Y H:i')]);
            fputcsv($handle, ["# Period: {$job['date_from']} to {$job['date_to']}"]);
            fputcsv($handle, []);
            // Headers
            fputcsv($handle, $data['headers']);
            // Rows
            foreach ($data['rows'] as $row) {
                fputcsv($handle, array_values((array) $row));
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    // ── Data Gatherers ────────────────────────────────────────────────────────
    private function gatherData(array $job): array
    {
        $from = $job['date_from'];
        $to   = $job['date_to'];

        return match ($job['report_type']) {
            'daily-production', 'weekly-production', 'monthly-production' => $this->productionData($from, $to),
            'egg-inventory'     => $this->eggInventoryData(),
            'feed-inventory'    => $this->feedInventoryData(),
            'medicine-inventory'=> $this->medicineInventoryData(),
            'sales'             => $this->salesData($from, $to),
            'profitability'     => $this->profitabilityData($from, $to),
            'mortality'         => $this->mortalityData($from, $to),
            'vaccination'       => $this->vaccinationData(),
            'treatment'         => $this->treatmentData($from, $to),
            default             => ['headers' => ['Field', 'Value'], 'rows' => [['Report', $job['name']]]],
        };
    }

    private function productionData(string $from, string $to): array
    {
        $rows = DB::table('egg_collections as ec')
            ->join('flock_batches as fb', 'fb.id', '=', 'ec.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ec.building_id')
            ->whereBetween('ec.collection_date', [$from, $to])
            ->select(['ec.collection_date as Date', 'b.name as Building', 'fb.batch_code as Batch',
                'ec.total_collected as Collected', 'ec.good_eggs as Good', 'ec.cracked as Cracked', 'ec.verified_status as Status'])
            ->orderBy('ec.collection_date')
            ->get();

        return ['headers' => ['Date', 'Building', 'Batch', 'Collected', 'Good', 'Cracked', 'Status'], 'rows' => $rows];
    }

    private function eggInventoryData(): array
    {
        return [
            'headers' => ['Size', 'Min (g)', 'Max (g)', 'Stock', 'Price/Egg', 'Total Value'],
            'rows'    => [
                ['Small', 45, 52, 1100, '₱1.80', '₱1,980'],
                ['Medium', 53, 62, 3200, '₱2.10', '₱6,720'],
                ['Large', 63, 72, 8400, '₱2.50', '₱21,000'],
                ['Extra Large', 73, 84, 620, '₱3.00', '₱1,860'],
                ['Jumbo', 85, 999, 180, '₱3.50', '₱630'],
            ],
        ];
    }

    private function feedInventoryData(): array
    {
        $rows = DB::table('feed_stocks as fs')
            ->join('feed_types as ft', 'ft.id', '=', 'fs.feed_type_id')
            ->leftJoin('suppliers as s', 's.id', '=', 'fs.supplier_id')
            ->select(['ft.name as Feed', 'ft.category as Category', 'fs.quantity_kg as Qty_kg',
                'fs.price_per_kg as Price_kg', 's.name as Supplier', 'fs.expiry_date as Expires'])
            ->get();

        return ['headers' => ['Feed Type', 'Category', 'Quantity (kg)', 'Price/kg (₱)', 'Supplier', 'Expiry'], 'rows' => $rows];
    }

    private function medicineInventoryData(): array
    {
        $rows = DB::table('medicines as m')
            ->leftJoin('medicine_stocks as ms', 'ms.medicine_id', '=', 'm.id')
            ->select(['m.name as Medicine', 'm.type as Type', DB::raw('COALESCE(SUM(ms.quantity), 0) as Stock'),
                'ms.unit as Unit', 'm.withdrawal_days as Withdrawal', 'ms.expiry_date as Expires'])
            ->groupBy('m.name', 'm.type', 'ms.unit', 'm.withdrawal_days', 'ms.expiry_date')
            ->get();

        return ['headers' => ['Medicine', 'Type', 'Stock', 'Unit', 'Withdrawal Days', 'Expiry'], 'rows' => $rows];
    }

    private function salesData(string $from, string $to): array
    {
        $rows = DB::table('sales as s')
            ->join('customers as c', 'c.id', '=', 's.customer_id')
            ->join('sale_items as si', 'si.sale_id', '=', 's.id')
            ->whereBetween('s.sale_date', [$from, $to])
            ->select(['s.invoice_no as Invoice', 'c.name as Customer', 's.sale_date as Date',
                'si.egg_size as Size', 'si.quantity as Qty', 'si.unit_price as Unit_Price',
                'si.subtotal as Subtotal', 's.payment_method as Payment', 's.status as Status'])
            ->orderByDesc('s.sale_date')
            ->get();

        return ['headers' => ['Invoice', 'Customer', 'Date', 'Egg Size', 'Qty', 'Unit Price', 'Subtotal', 'Payment', 'Status'], 'rows' => $rows];
    }

    private function profitabilityData(string $from, string $to): array
    {
        $revenue  = DB::table('sales')->whereBetween('sale_date', [$from, $to])->sum('total');
        $feedCost = DB::table('feed_issuances as fi')->join('feed_stocks as fs', 'fs.id', '=', 'fi.feed_stock_id')
            ->whereBetween('fi.issued_at', [$from, $to])->sum(DB::raw('fi.quantity_kg * fs.price_per_kg'));
        $grossProfit = $revenue - $feedCost;

        return [
            'headers' => ['Metric', 'Amount (₱)'],
            'rows'    => [
                ['Revenue',      number_format($revenue, 2)],
                ['Feed Cost',    number_format($feedCost, 2)],
                ['Gross Profit', number_format($grossProfit, 2)],
                ['Gross Margin', $revenue > 0 ? round($grossProfit/$revenue*100, 1).'%' : '0%'],
            ],
        ];
    }

    private function mortalityData(string $from, string $to): array
    {
        $rows = DB::table('mortality_logs as ml')
            ->join('flock_batches as fb', 'fb.id', '=', 'ml.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ml.building_id')
            ->join('users as u', 'u.id', '=', 'ml.recorded_by')
            ->whereBetween('ml.recorded_at', [$from, $to])
            ->select(['ml.recorded_at as Date', 'fb.batch_code as Batch', 'b.name as Building',
                'ml.count as Count', 'ml.cause as Cause', 'ml.severity as Severity', 'u.name as Recorded_By'])
            ->orderByDesc('ml.recorded_at')
            ->get();

        return ['headers' => ['Date', 'Batch', 'Building', 'Count', 'Cause', 'Severity', 'Recorded By'], 'rows' => $rows];
    }

    private function vaccinationData(): array
    {
        $rows = DB::table('vaccinations as v')
            ->join('flock_batches as fb', 'fb.id', '=', 'v.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->select(['fb.batch_code as Batch', 'b.name as Building', 'v.vaccine_name as Vaccine',
                'v.scheduled_date as Scheduled', 'v.status as Status', 'v.completed_date as Completed',
                'v.administered_by as Admin', 'v.batch_no as LOT'])
            ->orderBy('v.scheduled_date')
            ->get();

        return ['headers' => ['Batch', 'Building', 'Vaccine', 'Scheduled', 'Status', 'Completed', 'Administered By', 'LOT No.'], 'rows' => $rows];
    }

    private function treatmentData(string $from, string $to): array
    {
        $rows = DB::table('treatments as t')
            ->join('medicines as m', 'm.id', '=', 't.medicine_id')
            ->join('flock_batches as fb', 'fb.id', '=', 't.flock_batch_id')
            ->join('users as u', 'u.id', '=', 't.administered_by')
            ->whereBetween('t.administered_at', [$from, $to])
            ->select(['t.administered_at as Date', 'fb.batch_code as Batch', 'm.name as Medicine',
                't.dosage_ml as Dosage_ml', 't.duration_days as Days', 't.birds_treated as Birds',
                't.diagnosis as Diagnosis', 't.withdrawal_end as Withdrawal_Ends', 'u.name as Admin'])
            ->orderByDesc('t.administered_at')
            ->get();

        return ['headers' => ['Date', 'Batch', 'Medicine', 'Dosage (ml)', 'Duration', 'Birds', 'Diagnosis', 'Withdrawal Ends', 'By'], 'rows' => $rows];
    }
}

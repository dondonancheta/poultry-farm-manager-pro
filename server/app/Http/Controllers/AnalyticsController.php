<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function production(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->subDays(30)->format('Y-m-d');
        $to   = $request->date_to   ?? now()->format('Y-m-d');

        $trend = DB::table('egg_collections')
            ->whereBetween('collection_date', [$from, $to])
            ->groupBy('collection_date')
            ->orderBy('collection_date')
            ->select([
                'collection_date as date',
                DB::raw('SUM(total_collected) as eggs'),
                DB::raw('SUM(good_eggs) as good'),
                DB::raw('SUM(cracked) as cracked'),
            ])
            ->get()
            ->map(fn($r) => [
                'date' => $r->date,
                'eggs' => (int) $r->eggs,
                'good' => (int) $r->good,
            ]);

        $total = $trend->sum('eggs');
        $avg   = $trend->count() ? round($total / $trend->count()) : 0;

        return response()->json([
            'trend'   => $trend,
            'total'   => $total,
            'average' => $avg,
            'days'    => $trend->count(),
            'from'    => $from,
            'to'      => $to,
        ]);
    }

    public function fcr(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->subDays(30)->format('Y-m-d');
        $to   = $request->date_to   ?? now()->format('Y-m-d');

        $batches = DB::table('flock_batches as fb')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->leftJoin('feed_issuances as fi', function ($j) use ($from, $to) {
                $j->on('fi.flock_batch_id', '=', 'fb.id')
                  ->whereBetween('fi.issued_at', [$from, $to]);
            })
            ->leftJoin('egg_collections as ec', function ($j) use ($from, $to) {
                $j->on('ec.flock_batch_id', '=', 'fb.id')
                  ->whereBetween('ec.collection_date', [$from, $to]);
            })
            ->where('fb.status', 'Active')
            ->groupBy('fb.id', 'fb.batch_code', 'b.name', 'fb.arrival_date')
            ->select([
                'fb.batch_code as batch',
                'b.name as building',
                'fb.arrival_date',
                DB::raw('COALESCE(SUM(fi.quantity_kg), 0) as feed_kg'),
                DB::raw('COALESCE(SUM(ec.total_collected), 0) as eggs'),
            ])
            ->get()
            ->map(function ($r) {
                $fcr = $r->eggs > 0 ? round($r->feed_kg / $r->eggs, 3) : null;
                return [
                    'batchCode' => $r->batch,
                    'building'  => $r->building,
                    'age'       => Carbon::parse($r->arrival_date)->diffInDays(now()),
                    'feed_kg'   => round($r->feed_kg, 2),
                    'eggs'      => (int) $r->eggs,
                    'fcr'       => $fcr,
                ];
            });

        $avgFcr = $batches->whereNotNull('fcr')->avg('fcr');

        return response()->json([
            'by_batch' => $batches,
            'farm_fcr' => $avgFcr ? round($avgFcr, 3) : null,
        ]);
    }

    public function mortality(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->subDays(30)->format('Y-m-d');
        $to   = $request->date_to   ?? now()->format('Y-m-d');

        $weekly = DB::table('mortality_logs')
            ->whereBetween('recorded_at', [$from, $to])
            ->select([
                DB::raw('DATE_TRUNC(\'week\', recorded_at) as week'),
                DB::raw('SUM(count) as total'),
                DB::raw('AVG(count) as avg_daily'),
            ])
            ->groupBy(DB::raw('DATE_TRUNC(\'week\', recorded_at)'))
            ->orderBy('week')
            ->get()
            ->map(fn($r) => [
                'week'  => Carbon::parse($r->week)->format('M d'),
                'total' => (int) $r->total,
            ]);

        return response()->json([
            'weekly'        => $weekly,
            'total_deaths'  => $weekly->sum(DB::raw('COALESCE(total, total_amount, 0)')),
        ]);
    }

    public function buildings(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->subDays(30)->format('Y-m-d');
        $to   = $request->date_to   ?? now()->format('Y-m-d');

        $data = DB::table('buildings as b')
            ->leftJoin('flock_batches as fb', 'fb.building_id', '=', 'b.id')
            ->leftJoin('egg_collections as ec', function ($j) use ($from, $to) {
                $j->on('ec.building_id', '=', 'b.id')
                  ->whereBetween('ec.collection_date', [$from, $to]);
            })
            ->leftJoin('feed_issuances as fi', function ($j) use ($from, $to) {
                $j->on('fi.building_id', '=', 'b.id')
                  ->whereBetween('fi.issued_at', [$from, $to]);
            })
            ->leftJoin('mortality_logs as ml', function ($j) use ($from, $to) {
                $j->on('ml.building_id', '=', 'b.id')
                  ->whereBetween('ml.recorded_at', [$from, $to]);
            })
            ->groupBy('b.id', 'b.name', 'fb.current_count')
            ->select([
                'b.name as building',
                'fb.current_count as population',
                DB::raw('COALESCE(SUM(ec.total_collected), 0) as eggs'),
                DB::raw('COALESCE(SUM(fi.quantity_kg), 0) as feed_kg'),
                DB::raw('COALESCE(SUM(ml.count), 0) as deaths'),
            ])
            ->get()
            ->map(function ($r) {
                $fcr = $r->eggs > 0 ? round($r->feed_kg / $r->eggs, 3) : null;
                $mortalityPct = $r->population > 0 ? round($r->deaths / $r->population * 100, 2) : 0;
                return [
                    'building'      => $r->building,
                    'eggs'          => (int) $r->eggs,
                    'fcr'           => $fcr,
                    'mortality_pct' => $mortalityPct,
                ];
            });

        return response()->json(['by_building' => $data]);
    }

    public function profitability(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->startOfMonth()->format('Y-m-d');
        $to   = $request->date_to   ?? now()->format('Y-m-d');

        // Revenue from sales
        $revenue = DB::table('sales')
            ->whereBetween('sale_date', [$from, $to])
            ->whereIn('status', ['paid', 'pending'])
            ->sum(DB::raw('COALESCE(total, total_amount, 0)'));

        // Feed costs from issuances
        $feedCost = DB::table('feed_issuances as fi')
            ->join('feed_stocks as fs', 'fs.id', '=', 'fi.feed_stock_id')
            ->whereBetween('fi.issued_at', [$from, $to])
            ->sum(DB::raw('fi.quantity_kg * fs.price_per_kg'));

        // Medicine costs from treatments
        $medicineCost = DB::table('treatments as t')
            ->join('medicine_stocks as ms', 'ms.medicine_id', '=', 't.medicine_id')
            ->whereBetween('t.administered_at', [$from, $to])
            ->sum(DB::raw('t.dosage_ml * ms.unit_cost'));

        $grossProfit    = $revenue - $feedCost - $medicineCost;
        $grossMarginPct = $revenue > 0 ? round($grossProfit / $revenue * 100, 2) : 0;

        // Per-batch breakdown
        $batches = DB::table('flock_batches as fb')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->leftJoin('egg_collections as ec', 'ec.flock_batch_id', '=', 'fb.id')
            ->leftJoin('sale_items as si', function ($j) use ($from, $to) {
                $j->on('si.egg_size', '!=', DB::raw("''"));
            })
            ->groupBy('fb.id', 'fb.batch_code', 'b.name')
            ->select([
                'fb.batch_code',
                'b.name as building',
                DB::raw('COALESCE(SUM(ec.total_collected), 0) as eggs_produced'),
            ])
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'batch'          => $r->batch_code,
                'building'       => $r->building,
                'eggs_produced'  => (int) $r->eggs_produced,
                'revenue'        => round($r->eggs_produced * 2.50, 2),
                'feed_cost'      => round($r->eggs_produced * 0.38, 2),
                'gross_profit'   => round($r->eggs_produced * 2.12, 2),
                'gross_margin_pct' => 84.8,
            ]);

        return response()->json([
            'revenue'          => round($revenue, 2),
            'feed_costs'       => round($feedCost, 2),
            'medicine_costs'   => round($medicineCost, 2),
            'gross_profit'     => round($grossProfit, 2),
            'gross_margin_pct' => $grossMarginPct,
            'cost_per_egg'     => 0,
            'revenue_per_egg'  => 0,
            'margin_per_egg'   => 0,
            'by_batch'         => $batches,
        ]);
    }
}

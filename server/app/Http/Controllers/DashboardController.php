<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function kpis(): JsonResponse
    {
        $today      = today()->toDateString();
        $monthStart = today()->startOfMonth()->toDateString();

        $todayEggs  = DB::table('egg_collections')->whereDate('collection_date', $today)->sum('total_collected');
        $monthEggs  = DB::table('egg_collections')->whereBetween('collection_date', [$monthStart, $today])->sum('total_collected');

        $activeFlocks = DB::table('flock_batches')->where('status', 'Active')->count();
        $totalBirds   = DB::table('flock_batches')->where('status', 'Active')->sum('current_count');

        $todayMortality = DB::table('mortality_logs')->whereDate('recorded_at', $today)->sum('count');

        $feedRemaining = DB::table('feed_stocks')->sum('quantity_kg') / 1000;

        $vaccinationsToday = DB::table('vaccinations')
            ->whereDate('scheduled_date', $today)
            ->where('status', 'scheduled')->count();

        $todayRevenue = DB::table('sales')->whereDate('sale_date', $today)->sum(DB::raw('COALESCE(total, total_amount, 0)'));
        $monthRevenue = DB::table('sales')->whereBetween('sale_date', [$monthStart, $today])->sum(DB::raw('COALESCE(total, total_amount, 0)'));

        $feedCosts = DB::table('feed_issuances as fi')
            ->join('feed_stocks', 'feed_issuances.feed_stock_id', '=', 'feed_stocks.id')
            ->whereBetween('fi.issued_at', [$monthStart, $today])
            ->sum(DB::raw('fi.quantity_kg * feed_stocks.price_per_kg'));

        $grossProfit    = $monthRevenue - $feedCosts;
        $grossMarginPct = $monthRevenue > 0 ? round(($grossProfit / $monthRevenue) * 100, 1) : 0;

        return response()->json([
            'active_flocks'       => (int) $activeFlocks,
            'total_birds'         => (int) $totalBirds,
            'today_eggs'          => (int) $todayEggs,
            'month_eggs'          => (int) $monthEggs,
            'today_mortality'     => (int) $todayMortality,
            'feed_remaining_tons' => round((float) $feedRemaining, 1),
            'vaccinations_today'  => (int) $vaccinationsToday,
            'today_revenue'       => round((float) $todayRevenue, 2),
            'month_revenue'       => round((float) $monthRevenue, 2),
            'gross_profit'        => round((float) $grossProfit, 2),
            'gross_margin_pct'    => $grossMarginPct,
            'generated_at'        => now()->toIso8601String(),
        ]);
    }

    public function activity(): JsonResponse
    {
        $items = collect();

        // Recent egg collections
        DB::table('egg_collections as ec')
            ->join('flock_batches as fb', 'fb.id', '=', 'ec.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ec.building_id')
            ->join('users as u', 'u.id', '=', 'ec.collector_id')
            ->select(['ec.id', 'ec.total_collected', 'b.name as building', 'u.name as collector', 'ec.created_at'])
            ->orderByDesc('ec.created_at')->limit(5)->get()
            ->each(fn($ec) => $items->push([
                'id'       => "egg-{$ec->id}",
                'type'     => 'egg_collection',
                'title'    => "{$ec->total_collected} eggs collected — {$ec->building}",
                'subtitle' => "By {$ec->collector}",
                'time'     => Carbon::parse($ec->created_at)->diffForHumans(),
                'icon'     => 'egg',
            ]));

        // Recent mortality logs
        DB::table('mortality_logs as ml')
            ->join('flock_batches as fb', 'fb.id', '=', 'ml.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ml.building_id')
            ->join('users as u', 'u.id', '=', 'ml.recorded_by')
            ->select(['ml.id', 'ml.count', 'b.name as building', 'ml.cause', 'ml.created_at'])
            ->orderByDesc('ml.created_at')->limit(3)->get()
            ->each(fn($ml) => $items->push([
                'id'       => "mort-{$ml->id}",
                'type'     => 'mortality',
                'title'    => "{$ml->count} birds logged — {$ml->building}",
                'subtitle' => "Cause: {$ml->cause}",
                'time'     => Carbon::parse($ml->created_at)->diffForHumans(),
                'icon'     => 'emergency',
            ]));

        // Recent vaccinations
        DB::table('vaccinations as v')
            ->join('flock_batches as fb', 'fb.id', '=', 'v.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->select(['v.id', 'v.vaccine_name', 'b.name as building', 'v.administered_by', 'v.updated_at'])
            ->where('v.status', 'completed')
            ->orderByDesc('v.updated_at')->limit(3)->get()
            ->each(fn($v) => $items->push([
                'id'       => "vacc-{$v->id}",
                'type'     => 'vaccination',
                'title'    => "{$v->vaccine_name} completed — {$v->building}",
                'subtitle' => $v->administered_by,
                'time'     => Carbon::parse($v->updated_at)->diffForHumans(),
                'icon'     => 'vaccines',
            ]));

        return response()->json($items->sortByDesc('time')->values()->take(10));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\FlockBatch;
use App\Models\EggCollection;
use App\Models\FeedIssuance;
use App\Models\MortalityLog;
use App\Models\Vaccination;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/kpis
     * All KPIs in a single call for the executive dashboard.
     */
    public function kpis(): JsonResponse
    {
        $today    = today()->toDateString();
        $monthStart = today()->startOfMonth()->toDateString();

        // Egg production
        $todayEggs = EggCollection::whereDate('collection_date', $today)
            ->sum('total_collected');

        $monthEggs = EggCollection::whereBetween('collection_date', [$monthStart, $today])
            ->sum('total_collected');

        // Active flocks
        $activeFlocks  = FlockBatch::active()->count();
        $totalBirds    = FlockBatch::active()->sum('current_count');

        // Mortality
        $todayMortality = MortalityLog::whereDate('recorded_at', $today)->sum('count');

        // Feed
        $feedRemaining = \App\Models\FeedStock::sum('quantity_kg') / 1000; // to tons

        // Vaccinations today
        $vaccinationsToday = Vaccination::whereDate('scheduled_date', $today)
            ->where('status', 'scheduled')->count();

        // Sales
        $todayRevenue  = Sale::whereDate('sale_date', $today)->sum('total_amount');
        $monthRevenue  = Sale::whereBetween('sale_date', [$monthStart, $today])->sum('total_amount');

        // Feed costs this month
        $feedCosts = FeedIssuance::whereBetween('issued_at', [$monthStart, $today])
            ->join('feed_stocks', 'feed_issuances.feed_stock_id', '=', 'feed_stocks.id')
            ->sum(\DB::raw('feed_issuances.quantity_kg * feed_stocks.price_per_kg'));

        $grossProfit = $monthRevenue - $feedCosts;
        $grossMarginPct = $monthRevenue > 0
            ? round(($grossProfit / $monthRevenue) * 100, 1) : 0;

        return response()->json([
            'active_flocks'       => $activeFlocks,
            'total_birds'         => (int) $totalBirds,
            'today_eggs'          => (int) $todayEggs,
            'month_eggs'          => (int) $monthEggs,
            'today_mortality'     => (int) $todayMortality,
            'feed_remaining_tons' => round((float) $feedRemaining, 1),
            'vaccinations_today'  => $vaccinationsToday,
            'today_revenue'       => round((float) $todayRevenue, 2),
            'month_revenue'       => round((float) $monthRevenue, 2),
            'gross_profit'        => round((float) $grossProfit, 2),
            'gross_margin_pct'    => $grossMarginPct,
            'generated_at'        => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/dashboard/activity
     * Recent activity feed for the dashboard.
     */
    public function activity(): JsonResponse
    {
        $items = collect();

        // Recent egg collections
        EggCollection::with('flockBatch.building', 'collector')
            ->latest()->limit(5)->get()
            ->each(fn($ec) => $items->push([
                'id'       => "egg-{$ec->id}",
                'type'     => 'egg_collection',
                'title'    => "{$ec->total_collected} eggs collected — {$ec->flockBatch?->building?->name}",
                'subtitle' => "By {$ec->collector?->name}",
                'time'     => $ec->created_at->diffForHumans(),
                'icon'     => 'egg',
            ]));

        // Recent mortality logs
        MortalityLog::with('flockBatch.building', 'recordedBy')
            ->latest()->limit(3)->get()
            ->each(fn($ml) => $items->push([
                'id'       => "mort-{$ml->id}",
                'type'     => 'mortality',
                'title'    => "{$ml->count} birds logged — {$ml->flockBatch?->building?->name}",
                'subtitle' => "Cause: {$ml->cause}",
                'time'     => $ml->created_at->diffForHumans(),
                'icon'     => 'emergency',
            ]));

        // Recent vaccinations
        Vaccination::with('flockBatch.building')
            ->where('status', 'completed')
            ->latest()->limit(3)->get()
            ->each(fn($v) => $items->push([
                'id'       => "vacc-{$v->id}",
                'type'     => 'vaccination',
                'title'    => "{$v->vaccine_name} completed — {$v->flockBatch?->building?->name}",
                'subtitle' => $v->administered_by,
                'time'     => $v->updated_at->diffForHumans(),
                'icon'     => 'vaccines',
            ]));

        return response()->json(
            $items->sortByDesc('time')->values()->take(10)
        );
    }
}

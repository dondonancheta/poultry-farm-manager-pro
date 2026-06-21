<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $feed = DB::table('feed_stocks as fs')
            ->join('feed_types as ft', 'ft.id', '=', 'fs.feed_type_id')
            ->select(['fs.id', 'ft.name', DB::raw("'feed' as category"), 'fs.quantity_kg as current', DB::raw('1000 as threshold'), DB::raw("'kg' as unit")])
            ->get();

        $medicine = DB::table('medicine_stocks as ms')
            ->join('medicines as m', 'm.id', '=', 'ms.medicine_id')
            ->select(['ms.id', 'm.name', DB::raw("'medicine' as category"), 'ms.quantity as current', DB::raw('100 as threshold'), 'ms.unit'])
            ->get();

        return response()->json(['data' => $feed->merge($medicine)]);
    }

    public function alerts(): JsonResponse
    {
        $feedAlerts = DB::table('feed_stocks as fs')
            ->join('feed_types as ft', 'ft.id', '=', 'fs.feed_type_id')
            ->where('fs.quantity_kg', '<', 1000)
            ->select(['fs.id', 'ft.name', DB::raw("'feed' as category"), 'fs.quantity_kg as current', DB::raw('1000 as threshold'), DB::raw("'kg' as unit"),
                DB::raw("CASE WHEN fs.quantity_kg < 500 THEN 'critical' ELSE 'warning' END as level")])
            ->get();

        $medAlerts = DB::table('medicine_stocks as ms')
            ->join('medicines as m', 'm.id', '=', 'ms.medicine_id')
            ->where('ms.quantity', '<', 100)
            ->select(['ms.id', 'm.name', DB::raw("'medicine' as category"), 'ms.quantity as current', DB::raw('100 as threshold'), 'ms.unit',
                DB::raw("CASE WHEN ms.quantity < 50 THEN 'critical' ELSE 'warning' END as level")])
            ->get();

        return response()->json(['data' => $feedAlerts->merge($medAlerts)]);
    }

    public function eggStock(): JsonResponse
    {
        $sizes = ['small', 'medium', 'large', 'extra_large', 'jumbo'];
        $stock = array_fill_keys($sizes, 0);

        $collected = DB::table('egg_collections')
            ->select('sizes')
            ->whereDate('collection_date', '>=', now()->subDays(30))
            ->get();

        foreach ($collected as $row) {
            $s = json_decode($row->sizes, true) ?? [];
            foreach ($sizes as $sz) {
                $stock[$sz] += $s[$sz] ?? 0;
            }
        }

        return response()->json(array_merge($stock, ['updated_at' => now()]));
    }

    public function eggMovements(): JsonResponse
    {
        $collected = DB::table('egg_collections as ec')
            ->join('flock_batches as fb', 'fb.id', '=', 'ec.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ec.building_id')
            ->select(['ec.id', 'ec.collection_date as date', DB::raw("'collected' as type"), 'ec.total_collected as qty', 'fb.batch_code as batch', 'b.name as building'])
            ->orderByDesc('ec.collection_date')
            ->limit(50)->get();

        return response()->json(['data' => $collected]);
    }

    public function reportDamage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'flock_batch_id' => 'nullable|exists:flock_batches,id',
            'building_id'    => 'nullable|exists:buildings,id',
            'count'          => 'required|integer|min:1',
            'damage_type'    => 'required|string',
            'severity'       => 'required|in:minor,moderate,major',
            'cause'          => 'nullable|string',
            'notes'          => 'nullable|string',
        ]);

        $data['reported_by'] = $request->user()->id;
        $data['reported_at'] = now();

        return response()->json(['id' => rand(100, 999), ...$data], 201);
    }

    public function damagedList(): JsonResponse
    {
        return response()->json(['data' => []]);
    }
}

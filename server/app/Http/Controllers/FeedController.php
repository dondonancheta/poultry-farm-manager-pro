<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedController extends Controller
{
    /** GET /api/feed-stock — current stock levels with alert thresholds */
    public function stock(): JsonResponse
    {
        $stocks = DB::table('feed_stocks as fs')
            ->join('feed_types as ft', 'ft.id', '=', 'fs.feed_type_id')
            ->leftJoin('suppliers as s', 's.id', '=', 'fs.supplier_id')
            ->select([
                'fs.id', 'ft.name', 'ft.category', 'fs.quantity_kg',
                'fs.price_per_kg', 'fs.expiry_date', 'fs.received_date',
                's.name as supplier',
            ])
            ->orderBy('ft.category')
            ->get()
            ->map(function ($row) {
                $maxKg      = 10000;
                $stockPct   = min(100, round($row->quantity_kg / $maxKg * 100));
                $level      = $stockPct < 10 ? 'critical' : ($stockPct < 20 ? 'low' : 'normal');
                return [
                    'id'          => $row->id,
                    'name'        => $row->name,
                    'category'    => $row->category,
                    'quantityKg'  => (float) $row->quantity_kg,
                    'pricePerKg'  => (float) $row->price_per_kg,
                    'supplier'    => $row->supplier,
                    'expiryDate'  => $row->expiry_date,
                    'receivedDate'=> $row->received_date,
                    'stockPct'    => $stockPct,
                    'level'       => $level,
                ];
            });

        return response()->json(['data' => $stocks]);
    }

    /** POST /api/feed-issuance — log feed issued to a batch */
    public function issue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'feed_stock_id'   => 'required|exists:feed_stocks,id',
            'flock_batch_id'  => 'required|exists:flock_batches,id',
            'building_id'     => 'required|exists:buildings,id',
            'quantity_kg'     => 'required|numeric|min:0.1',
            'session'         => 'required|in:Morning,Noon,Afternoon',
            'notes'           => 'nullable|string',
        ]);

        $data['issued_by'] = $request->user()->id;
        $data['issued_at'] = now();

        $id = DB::table('feed_issuances')->insertGetId($data + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Deduct from stock
        DB::table('feed_stocks')
            ->where('id', $data['feed_stock_id'])
            ->decrement('quantity_kg', $data['quantity_kg']);

        return response()->json(['id' => $id, ...$data], 201);
    }

    /** POST /api/feed-receiving — record a new delivery */
    public function receive(Request $request): JsonResponse
    {
        $data = $request->validate([
            'feed_type_id'  => 'required|exists:feed_types,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'quantity_kg'   => 'required|numeric|min:1',
            'price_per_kg'  => 'required|numeric|min:0',
            'batch_number'  => 'nullable|string',
            'received_date' => 'required|date',
            'expiry_date'   => 'nullable|date',
            'notes'         => 'nullable|string',
        ]);

        $id = DB::table('feed_stocks')->insertGetId($data + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, ...$data], 201);
    }

    /** GET /api/feed/fcr — FCR per active batch */
    public function fcr(Request $request): JsonResponse
    {
        $rows = DB::table('flock_batches as fb')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->leftJoin('feed_issuances as fi', 'fi.flock_batch_id', '=', 'fb.id')
            ->leftJoin('egg_collections as ec', 'ec.flock_batch_id', '=', 'fb.id')
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
                $ageDays = now()->diffInDays($r->arrival_date);
                $fcr     = $r->eggs > 0 ? round($r->feed_kg / $r->eggs, 3) : null;
                return [
                    'batch'    => $r->batch,
                    'building' => $r->building,
                    'age'      => $ageDays,
                    'feed_kg'  => round($r->feed_kg, 2),
                    'eggs'     => (int) $r->eggs,
                    'fcr'      => $fcr,
                ];
            });

        return response()->json(['by_batch' => $rows]);
    }

    /** GET /api/feed-issuance — list of recent issuances */
    public function issuanceList(Request $request): JsonResponse
    {
        $rows = DB::table('feed_issuances as fi')
            ->join('feed_stocks as fs', 'fs.id', '=', 'fi.feed_stock_id')
            ->join('feed_types as ft', 'ft.id', '=', 'fs.feed_type_id')
            ->join('users as u', 'u.id', '=', 'fi.issued_by')
            ->join('buildings as b', 'b.id', '=', 'fi.building_id')
            ->select([
                'fi.id', 'ft.name as feed_type', 'fi.quantity_kg',
                'fi.session', 'fi.issued_at', 'u.name as issued_by',
                'b.name as building',
            ])
            ->orderByDesc('fi.issued_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $rows]);
    }
}

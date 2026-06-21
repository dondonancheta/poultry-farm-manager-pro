<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MortalityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = DB::table('mortality_logs as ml')
            ->join('flock_batches as fb', 'fb.id', '=', 'ml.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'ml.building_id')
            ->join('users as u', 'u.id', '=', 'ml.recorded_by')
            ->when($request->flock_batch_id, fn($q) => $q->where('ml.flock_batch_id', $request->flock_batch_id))
            ->select([
                'ml.id', 'fb.batch_code', 'b.name as building',
                'ml.count', 'ml.cause', 'ml.severity', 'ml.location',
                'ml.symptoms', 'ml.disposal_method', 'ml.recorded_at',
                'u.name as recorded_by',
            ])
            ->orderByDesc('ml.recorded_at')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'flock_batch_id'  => 'required|exists:flock_batches,id',
            'building_id'     => 'required|exists:buildings,id',
            'count'           => 'required|integer|min:1',
            'cause'           => 'required|string',
            'location'        => 'nullable|string',
            'symptoms'        => 'nullable|string',
            'disposal_method' => 'nullable|string',
            'severity'        => 'nullable|in:normal,elevated,critical',
        ]);

        $data['recorded_by'] = $request->user()->id;
        $data['recorded_at'] = now();
        $data['severity']    = $data['severity'] ?? ($data['count'] < 5 ? 'normal' : ($data['count'] < 20 ? 'elevated' : 'critical'));

        $id = DB::table('mortality_logs')->insertGetId($data + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Decrement current_count on the batch
        DB::table('flock_batches')
            ->where('id', $data['flock_batch_id'])
            ->decrement('current_count', $data['count']);

        return response()->json(['id' => $id, ...$data], 201);
    }
}

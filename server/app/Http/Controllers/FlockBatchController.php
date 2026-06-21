<?php

namespace App\Http\Controllers;

use App\Models\FlockBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FlockBatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $batches = FlockBatch::with(['breed', 'building'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->building_id, fn($q) => $q->where('building_id', $request->building_id))
            ->latest()
            ->get()
            ->map(fn($b) => $this->format($b));

        return response()->json(['data' => $batches, 'total' => $batches->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_code'            => 'required|string|unique:flock_batches',
            'breed_id'              => 'required|exists:breeds,id',
            'building_id'           => 'required|exists:buildings,id',
            'arrival_date'          => 'required|date',
            'initial_count'         => 'required|integer|min:1',
            'source_farm'           => 'nullable|string',
            'purchase_cost_per_hen' => 'nullable|numeric',
            'notes'                 => 'nullable|string',
        ]);

        $data['current_count'] = $data['initial_count'];
        $data['status']        = 'Active';

        $batch = FlockBatch::create($data);
        return response()->json($this->format($batch->load(['breed', 'building'])), 201);
    }

    public function show(int $id): JsonResponse
    {
        $batch = FlockBatch::with(['breed', 'building'])->findOrFail($id);
        return response()->json($this->format($batch));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $batch = FlockBatch::findOrFail($id);
        $data  = $request->validate([
            'status'        => 'sometimes|in:Active,Harvested,Quarantined',
            'current_count' => 'sometimes|integer|min:0',
            'notes'         => 'nullable|string',
            'building_id'   => 'sometimes|exists:buildings,id',
        ]);

        $batch->update($data);
        return response()->json($this->format($batch->fresh(['breed', 'building'])));
    }

    public function destroy(int $id): JsonResponse
    {
        FlockBatch::findOrFail($id)->delete();
        return response()->json(['message' => 'Batch deleted.']);
    }

    public function performance(int $id): JsonResponse
    {
        $batch = FlockBatch::findOrFail($id);

        // Daily weight growth curve (computed from age)
        $ageDays  = $batch->arrival_date->diffInDays(now());
        $ageCurve = [];
        for ($day = 1; $day <= min($ageDays, 42); $day++) {
            // Cobb 500 growth model approximation
            $ageCurve[] = [
                'day'      => $day,
                'weight_g' => (int) (42 * pow($day, 1.8)),
            ];
        }

        // FCR from feed issuances vs eggs / weight gain
        $totalFeedKg = DB::table('feed_issuances')
            ->where('flock_batch_id', $id)
            ->sum('quantity_kg');

        $totalEggs = DB::table('egg_collections')
            ->where('flock_batch_id', $id)
            ->sum('total_collected');

        return response()->json([
            'batch_id'    => $id,
            'batch_code'  => $batch->batch_code,
            'age_days'    => $ageDays,
            'age_curve'   => $ageCurve,
            'total_feed_kg' => round($totalFeedKg, 2),
            'total_eggs'  => $totalEggs,
            'fcr'         => $totalEggs > 0 ? round($totalFeedKg / $totalEggs, 3) : null,
        ]);
    }

    private function format(FlockBatch $b): array
    {
        return [
            'id'                  => $b->id,
            'batchCode'           => $b->batch_code,
            'breed'               => $b->breed?->name,
            'breed_id'            => $b->breed_id,
            'houseName'           => $b->building?->name,
            'building_id'         => $b->building_id,
            'arrivalDate'         => $b->arrival_date?->format('Y-m-d'),
            'sourceFarm'          => $b->source_farm,
            'initialCount'        => $b->initial_count,
            'population'          => $b->current_count,
            'status'              => $b->status,
            'ageDays'             => $b->arrival_date ? $b->arrival_date->diffInDays(now()) : 0,
            'notes'               => $b->notes,
        ];
    }
}

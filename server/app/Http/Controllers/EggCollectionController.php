<?php

namespace App\Http\Controllers;

use App\Models\EggCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EggCollectionController extends Controller
{
    /**
     * GET /api/egg-collections
     * Query params: date, building_id, batch_id, per_page
     */
    public function index(Request $request): JsonResponse
    {
        $query = EggCollection::with(['flockBatch.breed', 'collector'])
            ->when($request->date,        fn($q) => $q->whereDate('collection_date', $request->date))
            ->when($request->building_id, fn($q) => $q->where('building_id', $request->building_id))
            ->when($request->batch_id,    fn($q) => $q->where('flock_batch_id', $request->batch_id))
            ->latest('collection_date');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    /**
     * POST /api/egg-collections
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'flock_batch_id'   => 'required|exists:flock_batches,id',
            'building_id'      => 'required|exists:buildings,id',
            'collection_date'  => 'required|date',
            'collection_time'  => 'required|string',
            'collector_id'     => 'required|exists:users,id',
            'sizes'            => 'required|array',
            'sizes.small'      => 'integer|min:0',
            'sizes.medium'     => 'integer|min:0',
            'sizes.large'      => 'integer|min:0',
            'sizes.extra_large'=> 'integer|min:0',
            'sizes.jumbo'      => 'integer|min:0',
            'cracked'          => 'integer|min:0',
            'dirty'            => 'integer|min:0',
            'spoiled'          => 'integer|min:0',
            'rejected'         => 'integer|min:0',
            'notes'            => 'nullable|string',
        ]);

        // Compute totals
        $totalSized     = array_sum($data['sizes']);
        $totalDefects   = ($data['cracked'] ?? 0) + ($data['dirty'] ?? 0)
                        + ($data['spoiled'] ?? 0) + ($data['rejected'] ?? 0);
        $data['total_collected'] = $totalSized;
        $data['good_eggs']       = max(0, $totalSized - $totalDefects);

        $collection = EggCollection::create($data);

        return response()->json($collection->load('flockBatch', 'collector'), 201);
    }

    /**
     * GET /api/egg-collections/{id}
     */
    public function show(EggCollection $eggCollection): JsonResponse
    {
        return response()->json($eggCollection->load('flockBatch', 'collector'));
    }

    /**
     * PUT /api/egg-collections/{id}
     */
    public function update(Request $request, EggCollection $eggCollection): JsonResponse
    {
        $data = $request->validate([
            'sizes'    => 'array',
            'cracked'  => 'integer|min:0',
            'dirty'    => 'integer|min:0',
            'spoiled'  => 'integer|min:0',
            'rejected' => 'integer|min:0',
            'notes'    => 'nullable|string',
        ]);

        $eggCollection->update($data);
        return response()->json($eggCollection->fresh());
    }

    /**
     * DELETE /api/egg-collections/{id}
     */
    public function destroy(EggCollection $eggCollection): JsonResponse
    {
        $eggCollection->delete();
        return response()->json(null, 204);
    }

    /**
     * GET /api/egg-collections/summary
     * Query params: date_from, date_to, building_id
     */
    public function summary(Request $request): JsonResponse
    {
        $from = $request->date_from ?? today()->toDateString();
        $to   = $request->date_to   ?? today()->toDateString();

        $totals = EggCollection::whereBetween('collection_date', [$from, $to])
            ->when($request->building_id, fn($q) => $q->where('building_id', $request->building_id))
            ->selectRaw('
                COUNT(*)            as entries,
                SUM(total_collected) as total_collected,
                SUM(good_eggs)       as good_eggs,
                SUM(cracked)         as cracked,
                SUM(dirty)           as dirty,
                SUM(spoiled)         as spoiled,
                SUM(rejected)        as rejected,
                SUM(sizes->>"$.small")       as small,
                SUM(sizes->>"$.medium")      as medium,
                SUM(sizes->>"$.large")       as large,
                SUM(sizes->>"$.extra_large") as extra_large,
                SUM(sizes->>"$.jumbo")       as jumbo
            ')
            ->first();

        $totalCollected = $totals->total_collected ?? 0;
        $totalDefects   = ($totals->cracked + $totals->dirty + $totals->spoiled + $totals->rejected);

        return response()->json([
            'period'           => ['from' => $from, 'to' => $to],
            'total_collected'  => (int) $totalCollected,
            'good_eggs'        => (int) ($totals->good_eggs ?? 0),
            'defect_count'     => (int) $totalDefects,
            'spoilage_pct'     => $totalCollected > 0
                                  ? round(($totalDefects / $totalCollected) * 100, 2) : 0,
            'by_size' => [
                'small'       => (int) ($totals->small ?? 0),
                'medium'      => (int) ($totals->medium ?? 0),
                'large'       => (int) ($totals->large ?? 0),
                'extra_large' => (int) ($totals->extra_large ?? 0),
                'jumbo'       => (int) ($totals->jumbo ?? 0),
            ],
        ]);
    }

    /**
     * GET /api/egg-inventory
     * Current stock by size (collected minus sold).
     */
    public function inventory(): JsonResponse
    {
        $collected = EggCollection::selectRaw('
            SUM(sizes->>"$.small")       as small,
            SUM(sizes->>"$.medium")      as medium,
            SUM(sizes->>"$.large")       as large,
            SUM(sizes->>"$.extra_large") as extra_large,
            SUM(sizes->>"$.jumbo")       as jumbo
        ')->first();

        // TODO: subtract sold quantities when Sales module is implemented
        return response()->json([
            'small'       => (int) ($collected->small ?? 0),
            'medium'      => (int) ($collected->medium ?? 0),
            'large'       => (int) ($collected->large ?? 0),
            'extra_large' => (int) ($collected->extra_large ?? 0),
            'jumbo'       => (int) ($collected->jumbo ?? 0),
            'updated_at'  => now()->toIso8601String(),
        ]);
    }
}

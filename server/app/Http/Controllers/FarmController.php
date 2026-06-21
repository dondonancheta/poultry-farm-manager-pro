<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FarmController extends Controller
{
    public function index(): JsonResponse
    {
        $buildings = DB::table('buildings as b')
            ->leftJoin('flock_batches as fb', function ($j) {
                $j->on('fb.building_id', '=', 'b.id')->where('fb.status', 'Active');
            })
            ->leftJoin('users as u', 'u.id', '=', 'b.supervisor_id')
            ->select([
                'b.id', 'b.name', 'b.type', 'b.capacity', 'b.status',
                'fb.batch_code', 'fb.current_count as population',
                'u.name as supervisor',
            ])
            ->orderBy('b.name')
            ->get();

        $totalCapacity   = $buildings->sum('capacity');
        $totalPopulation = $buildings->sum('population');

        return response()->json([
            'data'  => $buildings,
            'total' => $buildings->count(),
            'meta'  => [
                'total_capacity'   => $totalCapacity,
                'total_population' => $totalPopulation,
                'active_count'     => $buildings->where('status', 'active')->count(),
                'occupancy_pct'    => $totalCapacity > 0
                    ? round($totalPopulation / $totalCapacity * 100) : 0,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string',
            'type'          => 'sometimes|in:broiler,layer,breeder,dual',
            'capacity'      => 'sometimes|integer|min:0',
            'status'        => 'sometimes|in:active,inactive,maintenance',
            'supervisor_id' => 'sometimes|nullable|exists:users,id',
        ]);

        DB::table('buildings')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('buildings')->find($id));
    }
}

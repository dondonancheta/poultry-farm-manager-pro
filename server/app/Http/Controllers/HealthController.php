<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    // ── Medicines ────────────────────────────────────────────────────────────
    public function medicines(): JsonResponse
    {
        $data = DB::table('medicines as m')
            ->leftJoin('medicine_stocks as ms', 'ms.medicine_id', '=', 'm.id')
            ->leftJoin('suppliers as s', 's.id', '=', 'm.supplier_id')
            ->groupBy('m.id', 'm.name', 'm.type', 'm.active_ingredient', 'm.withdrawal_days', 'm.storage_temp', 'm.active', 's.name')
            ->select([
                'm.id', 'm.name', 'm.type', 'm.active_ingredient',
                'm.withdrawal_days', 'm.storage_temp', 'm.active',
                's.name as supplier',
                DB::raw('COALESCE(SUM(ms.quantity), 0) as stock'),
                DB::raw('MAX(ms.unit) as unit'),
                DB::raw('MIN(ms.expiry_date) as expiry_date'),
            ])
            ->get();

        return response()->json(['data' => $data]);
    }

    public function addMedicine(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string',
            'type'              => 'required|string',
            'active_ingredient' => 'nullable|string',
            'withdrawal_days'   => 'nullable|integer|min:0',
            'storage_temp'      => 'nullable|string',
            'supplier_id'       => 'nullable|exists:suppliers,id',
        ]);

        $id = DB::table('medicines')->insertGetId($data + ['active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateMedicine(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['name' => 'sometimes|string', 'active' => 'sometimes|boolean']);
        DB::table('medicines')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('medicines')->find($id));
    }

    // ── Treatments ───────────────────────────────────────────────────────────
    public function treatments(): JsonResponse
    {
        $data = DB::table('treatments as t')
            ->join('medicines as m', 'm.id', '=', 't.medicine_id')
            ->join('flock_batches as fb', 'fb.id', '=', 't.flock_batch_id')
            ->join('users as u', 'u.id', '=', 't.administered_by')
            ->select([
                't.id', 'fb.batch_code as batch', 'm.name as medicine',
                'm.withdrawal_days', 't.dosage_ml', 't.duration_days',
                't.birds_treated', 't.symptoms', 't.diagnosis',
                't.withdrawal_end', 't.administered_at', 'u.name as administered_by',
            ])
            ->orderByDesc('t.administered_at')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function logTreatment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'flock_batch_id'  => 'required|exists:flock_batches,id',
            'medicine_id'     => 'required|exists:medicines,id',
            'dosage_ml'       => 'nullable|numeric',
            'duration_days'   => 'nullable|integer',
            'birds_treated'   => 'nullable|integer',
            'symptoms'        => 'nullable|string',
            'diagnosis'       => 'nullable|string',
        ]);

        $medicine = DB::table('medicines')->find($data['medicine_id']);
        $data['administered_by'] = $request->user()->id;
        $data['administered_at'] = now();
        $data['withdrawal_end']  = $medicine && $medicine->withdrawal_days > 0
            ? now()->addDays($medicine->withdrawal_days)->format('Y-m-d')
            : null;

        $id = DB::table('treatments')->insertGetId($data + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data, 'withdrawal_days' => $medicine->withdrawal_days ?? 0], 201);
    }

    public function activeWithdrawals(): JsonResponse
    {
        $data = DB::table('treatments as t')
            ->join('medicines as m', 'm.id', '=', 't.medicine_id')
            ->join('flock_batches as fb', 'fb.id', '=', 't.flock_batch_id')
            ->whereNotNull('t.withdrawal_end')
            ->where('t.withdrawal_end', '>=', now()->format('Y-m-d'))
            ->select(['t.id', 'fb.batch_code', 'm.name as medicine', 't.withdrawal_end'])
            ->get();

        return response()->json(['data' => $data]);
    }

    // ── Vaccinations ─────────────────────────────────────────────────────────
    public function vaccinations(): JsonResponse
    {
        $data = DB::table('vaccinations as v')
            ->join('flock_batches as fb', 'fb.id', '=', 'v.flock_batch_id')
            ->join('buildings as b', 'b.id', '=', 'fb.building_id')
            ->select([
                'v.id', 'fb.batch_code as batch', 'b.name as building',
                'v.vaccine_name', 'v.scheduled_date', 'v.status',
                'v.completed_date', 'v.administered_by', 'v.batch_no', 'v.notes',
            ])
            ->orderBy('v.scheduled_date')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function scheduleVaccination(Request $request): JsonResponse
    {
        $data = $request->validate([
            'flock_batch_id' => 'required|exists:flock_batches,id',
            'vaccine_name'   => 'required|string',
            'scheduled_date' => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        $data['status'] = now()->format('Y-m-d') > $data['scheduled_date'] ? 'overdue' : 'scheduled';
        $id = DB::table('vaccinations')->insertGetId($data + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateVaccination(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'scheduled_date' => 'sometimes|date',
            'status'         => 'sometimes|in:scheduled,completed,overdue',
            'notes'          => 'nullable|string',
        ]);

        DB::table('vaccinations')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('vaccinations')->find($id));
    }

    public function markVaccinationDone(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'administered_by' => 'nullable|string',
            'batch_no'        => 'nullable|string',
            'notes'           => 'nullable|string',
        ]);

        DB::table('vaccinations')->where('id', $id)->update([
            'status'          => 'completed',
            'completed_date'  => now()->format('Y-m-d'),
            'administered_by' => $data['administered_by'] ?? $request->user()->name,
            'batch_no'        => $data['batch_no'] ?? null,
            'notes'           => $data['notes'] ?? null,
            'updated_at'      => now(),
        ]);

        return response()->json(DB::table('vaccinations')->find($id));
    }
}

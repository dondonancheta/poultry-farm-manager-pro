<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterDataController extends Controller
{
    // ── Breeds ───────────────────────────────────────────────────────────────
    public function getBreeds(): JsonResponse
    {
        return response()->json(DB::table('breeds')->orderBy('name')->get());
    }

    public function createBreed(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|unique:breeds',
            'type'          => 'required|in:broiler,layer,dual,breeder',
            'origin'        => 'nullable|string',
            'avg_fcr'       => 'nullable|numeric',
            'peak_prod_age' => 'nullable|integer',
        ]);

        $id = DB::table('breeds')->insertGetId($data + ['active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateBreed(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'sometimes|string',
            'type'    => 'sometimes|string',
            'avg_fcr' => 'sometimes|numeric',
            'active'  => 'sometimes|boolean',
        ]);

        DB::table('breeds')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('breeds')->find($id));
    }

    public function deleteBreed(int $id): JsonResponse
    {
        DB::table('breeds')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Feed Types ────────────────────────────────────────────────────────────
    public function getFeedTypes(): JsonResponse
    {
        return response()->json(DB::table('feed_types')->orderBy('category')->get());
    }

    public function createFeedType(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|unique:feed_types',
            'category'     => 'required|in:starter,grower,finisher,layer',
            'age_from'     => 'nullable|integer|min:0',
            'age_to'       => 'nullable|integer',
            'price_per_kg' => 'nullable|numeric|min:0',
        ]);

        $id = DB::table('feed_types')->insertGetId($data + ['active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateFeedType(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['name' => 'sometimes|string', 'price_per_kg' => 'sometimes|numeric', 'active' => 'sometimes|boolean']);
        DB::table('feed_types')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('feed_types')->find($id));
    }

    public function deleteFeedType(int $id): JsonResponse
    {
        DB::table('feed_types')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Suppliers ─────────────────────────────────────────────────────────────
    public function getSuppliers(): JsonResponse
    {
        return response()->json(DB::table('suppliers')->orderBy('name')->get());
    }

    public function createSupplier(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'category' => 'required|string',
            'contact'  => 'nullable|string',
            'phone'    => 'nullable|string',
            'email'    => 'nullable|email',
            'address'  => 'nullable|string',
            'rating'   => 'nullable|integer|between:1,5',
        ]);

        $id = DB::table('suppliers')->insertGetId($data + ['active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateSupplier(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['name' => 'sometimes|string', 'contact' => 'sometimes|string', 'rating' => 'sometimes|integer', 'active' => 'sometimes|boolean']);
        DB::table('suppliers')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('suppliers')->find($id));
    }

    public function deleteSupplier(int $id): JsonResponse
    {
        DB::table('suppliers')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Customers ─────────────────────────────────────────────────────────────
    public function getCustomers(): JsonResponse
    {
        return response()->json(DB::table('customers')->orderBy('name')->get());
    }

    public function getMedicines(): JsonResponse
    {
        return response()->json(DB::table('medicines')->orderBy('name')->get());
    }
}

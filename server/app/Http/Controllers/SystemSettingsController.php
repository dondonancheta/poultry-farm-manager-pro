<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemSettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = DB::table('system_settings')
            ->get()
            ->groupBy('group')
            ->map(fn($group) => $group->pluck('value', 'key'));

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            DB::table('system_settings')
                ->updateOrInsert(
                    ['key' => $key],
                    ['value' => $value, 'updated_at' => now()]
                );
        }

        return response()->json(['message' => 'Settings updated.']);
    }
}

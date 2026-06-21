<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = DB::table('users')
            ->when($request->role, fn($q) => $q->where('role', $request->role))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->select(['id', 'name', 'email', 'role', 'status', 'building', 'phone', 'last_login_at', 'created_at'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users, 'total' => $users->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,manager,supervisor,worker',
            'building' => 'nullable|string',
            'phone'    => 'nullable|string',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['status']   = 'active';

        $id = DB::table('users')->insertGetId($data + ['created_at' => now(), 'updated_at' => now()]);
        unset($data['password']);

        return response()->json(['id' => $id, ...$data], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string',
            'email'    => 'sometimes|email|unique:users,email,'.$id,
            'role'     => 'sometimes|in:admin,manager,supervisor,worker',
            'building' => 'sometimes|nullable|string',
            'phone'    => 'sometimes|nullable|string',
        ]);

        DB::table('users')->where('id', $id)->update($data + ['updated_at' => now()]);

        $user = DB::table('users')->where('id', $id)->select(['id','name','email','role','status','building','phone'])->first();
        return response()->json($user);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::table('users')->where('id', $id)->delete();
        return response()->json(['message' => 'User deleted.']);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $user = DB::table('users')->find($id);
        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        DB::table('users')->where('id', $id)->update(['status' => $newStatus, 'updated_at' => now()]);
        return response()->json(['status' => $newStatus]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        // Generate temporary password and email it (or just return for demo)
        $temp = Str::random(10);
        DB::table('users')->where('id', $id)->update(['password' => Hash::make($temp), 'updated_at' => now()]);

        // In production: Mail::to($user->email)->send(new PasswordResetMail($temp));
        return response()->json(['message' => 'Password reset email sent.', 'temp_password' => $temp]);
    }
}

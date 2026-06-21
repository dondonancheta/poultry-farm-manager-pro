<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Returns JWT token + user object with role/permissions.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials. Please check your email and password.',
            ], 401);
        }

        return $this->tokenResponse($token);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): JsonResponse
    {
        auth('api')->logout();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     * Returns the authenticated user with role and permissions.
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user()->load('roles', 'permissions');

        return response()->json([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->getRoleNames()->first(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'building'    => $user->building,
            'phone'       => $user->phone,
            'avatar'      => $user->avatar,
            'created_at'  => $user->created_at,
        ]);
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return $this->tokenResponse($token);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token expired or invalid.'], 401);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function tokenResponse(string $token): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role'     => $user->getRoleNames()->first(),
                'building' => $user->building,
                'phone'    => $user->phone,
            ],
        ]);
    }
}

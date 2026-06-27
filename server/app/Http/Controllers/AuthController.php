<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (isset($user->status) && $user->status === 'inactive') {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        $token = JWTAuth::fromUser($user);

        // Update last login
        $user->update(['last_login_at' => now()]);

        return $this->tokenResponse($token, $user);
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            // Token already invalid
        }

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            $user  = JWTAuth::setToken($token)->toUser();
            return $this->tokenResponse($token, $user);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token refresh failed.'], 401);
        }
    }

    public function me(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'role'          => $user->role,
            'status'        => $user->status ?? 'active',
            'building'      => $user->building ?? null,
            'phone'         => $user->phone ?? null,
            'last_login_at' => $user->last_login_at,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        return response()->json(['message' => __($status)]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successfully.']);
        }

        return response()->json(['message' => __($status)], 400);
    }

    private function tokenResponse(string $token, User $user): JsonResponse
    {
        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl', 60) * 60,
            'user'       => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role'     => $user->role,
                'status'   => $user->status ?? 'active',
                'building' => $user->building ?? null,
                'phone'    => $user->phone ?? null,
            ],
        ]);
    }
}

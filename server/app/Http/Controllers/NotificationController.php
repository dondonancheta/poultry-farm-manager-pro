<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    private array $roleMap = [
        'admin'      => ['admin', 'manager', 'supervisor', 'worker'],
        'manager'    => ['admin', 'manager'],
        'supervisor' => ['admin', 'manager', 'supervisor'],
        'worker'     => ['admin', 'manager', 'supervisor', 'worker'],
    ];

    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $userRole  = $user->role;

        $notifications = DB::table('notifications as n')
            ->leftJoin('notification_reads as nr', function ($j) use ($user) {
                $j->on('nr.notification_id', '=', 'n.id')->where('nr.user_id', $user->id);
            })
            ->whereJsonContains('n.for_roles', $userRole)
            ->select(['n.*', DB::raw('nr.id IS NOT NULL as read')])
            ->orderByDesc('n.created_at')
            ->limit(50)
            ->get()
            ->map(fn($n) => array_merge((array)$n, [
                'read'     => (bool) $n->read,
                'forRoles' => json_decode($n->for_roles, true),
            ]));

        return response()->json(['data' => $notifications, 'total' => $notifications->count()]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $data = $request->validate(['id' => 'required']);
        $ids  = is_array($data['id']) ? $data['id'] : [$data['id']];
        $userId = $request->user()->id;

        foreach ($ids as $notifId) {
            DB::table('notification_reads')->updateOrInsert(
                ['notification_id' => $notifId, 'user_id' => $userId],
                ['read_at' => now(), 'created_at' => now(), 'updated_at' => now()]
            );
        }

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user     = $request->user();
        $notifIds = DB::table('notifications')
            ->whereJsonContains('for_roles', $user->role)
            ->pluck('id');

        foreach ($notifIds as $id) {
            DB::table('notification_reads')->updateOrInsert(
                ['notification_id' => $id, 'user_id' => $user->id],
                ['read_at' => now(), 'created_at' => now(), 'updated_at' => now()]
            );
        }

        return response()->json(['success' => true]);
    }
}

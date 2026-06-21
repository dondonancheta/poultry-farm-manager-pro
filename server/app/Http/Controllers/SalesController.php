<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = DB::table('sales as s')
            ->leftJoin('customers as c', 'c.id', '=', 's.customer_id')
            ->select(['s.*', 'c.name as customer_name', 'c.type as customer_type'])
            ->orderByDesc('s.sale_date')
            ->get()
            ->map(function ($s) {
                $s->items = DB::table('sale_items')->where('sale_id', $s->id)->get();
                return $s;
            });

        return response()->json(['data' => $sales]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id'     => 'required|exists:customers,id',
            'sale_date'       => 'required|date',
            'payment_method'  => 'required|in:cash,bank_transfer,credit,gcash',
            'items'           => 'required|array|min:1',
            'items.*.egg_size'=> 'required|in:small,medium,large,extra_large,jumbo',
            'items.*.quantity'=> 'required|integer|min:1',
            'items.*.unit_price'=>'required|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
        ]);

        $subtotal = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
        $discount = $data['discount'] ?? 0;

        $saleId = DB::table('sales')->insertGetId([
            'customer_id'    => $data['customer_id'],
            'invoice_no'     => 'INV-' . str_pad(DB::table('sales')->count() + 1043, 4, '0', STR_PAD_LEFT),
            'sale_date'      => $data['sale_date'],
            'payment_method' => $data['payment_method'],
            'status'         => 'pending',
            'subtotal'       => $subtotal,
            'discount'       => $discount,
            'total'          => $subtotal - $discount,
            'notes'          => $data['notes'] ?? null,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        foreach ($data['items'] as $item) {
            DB::table('sale_items')->insert([
                'sale_id'    => $saleId,
                'egg_size'   => $item['egg_size'],
                'quantity'   => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal'   => $item['quantity'] * $item['unit_price'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['id' => $saleId, 'invoice_no' => "INV-{$saleId}"], 201);
    }

    public function markPaid(Request $request, int $id): JsonResponse
    {
        DB::table('sales')->where('id', $id)->update(['status' => 'paid', 'updated_at' => now()]);
        return response()->json(['message' => 'Marked as paid.']);
    }

    public function invoice(int $id): JsonResponse
    {
        $sale = DB::table('sales as s')
            ->join('customers as c', 'c.id', '=', 's.customer_id')
            ->where('s.id', $id)
            ->select(['s.*', 'c.name as customer_name', 'c.phone', 'c.email', 'c.address'])
            ->first();

        if (! $sale) {
            return response()->json(['message' => 'Sale not found.'], 404);
        }

        $sale->items = DB::table('sale_items')->where('sale_id', $id)->get();

        return response()->json($sale);
    }

    // Customers
    public function customers(): JsonResponse
    {
        return response()->json(['data' => DB::table('customers')->orderBy('name')->get()]);
    }

    public function storeCustomer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string',
            'type'         => 'required|in:wholesale,retail,restaurant',
            'contact'      => 'nullable|string',
            'phone'        => 'nullable|string',
            'email'        => 'nullable|email',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $id = DB::table('customers')->insertGetId($data + ['balance' => 0, 'active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['id' => $id, ...$data], 201);
    }

    public function updateCustomer(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string',
            'type'         => 'sometimes|in:wholesale,retail,restaurant',
            'credit_limit' => 'sometimes|numeric|min:0',
            'active'       => 'sometimes|boolean',
        ]);

        DB::table('customers')->where('id', $id)->update($data + ['updated_at' => now()]);
        return response()->json(DB::table('customers')->find($id));
    }
}

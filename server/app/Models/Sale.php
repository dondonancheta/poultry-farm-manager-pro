<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id','invoice_no','sale_date',
        'payment_method','status','subtotal','discount','total','notes',
    ];
    protected $casts = ['sale_date' => 'date'];
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function items():    HasMany   { return $this->hasMany(SaleItem::class); }
}

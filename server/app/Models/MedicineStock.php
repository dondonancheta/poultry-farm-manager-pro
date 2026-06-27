<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicineStock extends Model
{
    protected $fillable = [
        'medicine_id','batch_number','quantity',
        'unit','expiry_date','received_date','unit_cost',
    ];
    protected $casts = [
        'expiry_date'   => 'date',
        'received_date' => 'date',
    ];
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}

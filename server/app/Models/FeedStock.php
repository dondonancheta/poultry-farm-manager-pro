<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeedStock extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'feed_type_id','supplier_id','batch_number',
        'quantity_kg','price_per_kg','received_date','expiry_date','notes',
    ];
    protected $casts = ['received_date' => 'date', 'expiry_date' => 'date'];
}

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FeedStock extends Model
{
    protected $fillable = [
        'feed_type_id','supplier_id','batch_number',
        'quantity_kg','price_per_kg','received_date','expiry_date','notes',
    ];
    protected $casts = ['received_date' => 'date', 'expiry_date' => 'date'];
}

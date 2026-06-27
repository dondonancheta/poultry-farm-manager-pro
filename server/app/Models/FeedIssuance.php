<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedIssuance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'feed_stock_id','flock_batch_id','building_id',
        'issued_by','quantity_kg','session','issued_at','notes',
    ];
    protected $casts = ['issued_at' => 'datetime'];
    public function stock():  BelongsTo { return $this->belongsTo(FeedStock::class, 'feed_stock_id'); }
    public function batch():  BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function issuer(): BelongsTo { return $this->belongsTo(User::class, 'issued_by'); }
}

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MortalityLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'flock_batch_id','building_id','recorded_by',
        'count','cause','location','symptoms','disposal_method','severity','recorded_at',
    ];
    protected $casts = ['recorded_at' => 'datetime'];

    public function flockBatch(): BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function building():   BelongsTo { return $this->belongsTo(Building::class); }
    public function recordedBy(): BelongsTo { return $this->belongsTo(User::class, 'recorded_by'); }
    public function recorder():   BelongsTo { return $this->belongsTo(User::class, 'recorded_by'); }
}

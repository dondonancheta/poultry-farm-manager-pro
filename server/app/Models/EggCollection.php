<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EggCollection extends Model
{
    protected $fillable = [
        'flock_batch_id','building_id','collector_id',
        'collection_date','collection_time','session',
        'total_collected','good_eggs','cracked','dirty','spoiled','rejected',
        'sizes','verified_status','verified_by','verified_at','notes','flag_reason',
    ];
    protected $casts = [
        'collection_date' => 'date',
        'sizes'           => 'array',
        'verified_at'     => 'datetime',
    ];

    // Relations used by DashboardController and EggCollectionController
    public function flockBatch(): BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function batch():      BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function building():   BelongsTo { return $this->belongsTo(Building::class); }
    public function collector():  BelongsTo { return $this->belongsTo(User::class, 'collector_id'); }
}

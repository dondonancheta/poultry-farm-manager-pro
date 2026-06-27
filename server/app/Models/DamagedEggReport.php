<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamagedEggReport extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'flock_batch_id','building_id','reported_by',
        'date','quantity','cause','notes',
    ];
    protected $casts = ['date' => 'date'];
    public function batch():    BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function building(): BelongsTo { return $this->belongsTo(Building::class); }
    public function reporter(): BelongsTo { return $this->belongsTo(User::class, 'reported_by'); }
}

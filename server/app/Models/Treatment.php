<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Treatment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'flock_batch_id','medicine_id','administered_by',
        'dosage_ml','birds_treated','duration_days',
        'administered_at','withdrawal_days','withdrawal_end',
        'symptoms','diagnosis','notes',
    ];
    protected $casts = ['administered_at' => 'datetime', 'withdrawal_end' => 'date'];
    public function batch():    BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
    public function medicine(): BelongsTo { return $this->belongsTo(Medicine::class); }
}

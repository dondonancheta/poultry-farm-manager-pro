<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vaccination extends Model
{
    protected $fillable = [
        'flock_batch_id','vaccine_name','scheduled_date',
        'completed_date','status','administered_by','batch_no','notes',
    ];
    protected $casts = ['scheduled_date' => 'date', 'completed_date' => 'date'];
    public function batch(): BelongsTo { return $this->belongsTo(FlockBatch::class, 'flock_batch_id'); }
}

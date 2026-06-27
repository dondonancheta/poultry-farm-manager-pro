<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlockBatch extends Model
{
    protected $fillable = [
        'batch_code','breed_id','building_id','arrival_date','source_farm',
        'initial_count','current_count','purchase_cost_per_hen','status','notes',
    ];
    protected $casts = ['arrival_date' => 'date'];

    // Scope used in DashboardController
    public function scopeActive($query) { return $query->where('status', 'Active'); }

    public function breed():    BelongsTo { return $this->belongsTo(Breed::class); }
    public function building(): BelongsTo { return $this->belongsTo(Building::class); }
}

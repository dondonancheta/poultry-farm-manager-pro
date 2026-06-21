<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_code', 'breed_id', 'building_id', 'arrival_date',
        'source_farm', 'initial_count', 'current_count',
        'purchase_cost_per_hen', 'status', 'notes',
    ];

    protected $casts = [
        'arrival_date'          => 'date',
        'purchase_cost_per_hen' => 'decimal:2',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function breed()    { return $this->belongsTo(Breed::class); }
    public function building() { return $this->belongsTo(Building::class); }

    public function eggCollections()  { return $this->hasMany(EggCollection::class); }
    public function feedIssuances()   { return $this->hasMany(FeedIssuance::class); }
    public function mortalityLogs()   { return $this->hasMany(MortalityLog::class); }
    public function treatments()      { return $this->hasMany(Treatment::class); }
    public function vaccinations()    { return $this->hasMany(Vaccination::class); }

    // ── Computed ──────────────────────────────────────────────────────────────

    public function getAgeDaysAttribute(): int
    {
        return $this->arrival_date->diffInDays(now());
    }

    public function getMortalityPctAttribute(): float
    {
        if (!$this->initial_count) return 0;
        $dead = $this->initial_count - $this->current_count;
        return round(($dead / $this->initial_count) * 100, 2);
    }

    public function getFcrAttribute(): ?float
    {
        $feedKg  = $this->feedIssuances()->sum('quantity_kg');
        $eggCount = $this->eggCollections()->sum('total_collected');
        return $eggCount > 0 ? round($feedKg / $eggCount, 2) : null;
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)  { return $query->where('status', 'Active'); }
    public function scopeByBuilding($query, int $buildingId) { return $query->where('building_id', $buildingId); }
}

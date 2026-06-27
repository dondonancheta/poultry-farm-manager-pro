<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeedType extends Model
{
    use SoftDeletes;

    protected $fillable = ['name','category','age_from','age_to','price_per_kg','active'];
}

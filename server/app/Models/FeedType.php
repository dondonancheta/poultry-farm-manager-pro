<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FeedType extends Model
{
    protected $fillable = ['name','category','age_from','age_to','price_per_kg','active'];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Breed extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'type', 'origin', 'avg_fcr', 'peak_prod_age', 'active'];
}

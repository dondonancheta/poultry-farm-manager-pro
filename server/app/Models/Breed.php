<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Breed extends Model
{
    protected $fillable = ['name', 'type', 'origin', 'avg_fcr', 'peak_prod_age', 'active'];
}

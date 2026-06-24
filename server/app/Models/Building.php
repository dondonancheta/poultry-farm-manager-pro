<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    protected $fillable = ['name', 'type', 'capacity', 'status', 'supervisor_id'];
}

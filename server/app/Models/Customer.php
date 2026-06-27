<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name','type','contact','phone','email',
        'credit_limit','balance','active','notes',
    ];
}

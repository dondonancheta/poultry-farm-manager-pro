<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'name','type','active_ingredient','withdrawal_days',
        'storage_temp','supplier_id','stock','unit','expiry_date','active',
    ];
    protected $casts = ['expiry_date' => 'date', 'active' => 'boolean'];
}

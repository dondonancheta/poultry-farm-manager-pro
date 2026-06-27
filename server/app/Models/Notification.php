<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use SoftDeletes;

    protected $fillable = ['title','message','type','category','for_roles','link'];
    protected $casts    = ['for_roles' => 'array'];
}

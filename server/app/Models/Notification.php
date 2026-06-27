<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['title','message','type','category','for_roles','link'];
    protected $casts    = ['for_roles' => 'array'];
}

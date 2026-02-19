<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaybillArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'waybill_id',
        'article_type',
        'no_of_articles',
        'rate',
        'total',
        'handling_rate',
        'handling_total',
        'freight',
        'actual_weight',
        'charged_weight',
        'amount',
    ];

    public function waybill()
    {
        return $this->belongsTo(Waybill::class);
    }
}

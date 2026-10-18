<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Filme extends Model
{
    protected $fillable = ['api_id', 'titulo', 'ano', 'genero', 'sinopse', 'poster', 'nota', 'comentario'];

    protected function casts(): array
    {
        return ['nota' => 'float'];
    }
}

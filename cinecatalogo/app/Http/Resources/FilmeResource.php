<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FilmeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'api_id' => $this->api_id,
            'titulo' => $this->titulo,
            'ano' => $this->ano,
            'genero' => $this->genero,
            'sinopse' => $this->sinopse,
            'poster' => $this->poster,
            'nota' => $this->nota,
            'comentario' => $this->comentario,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

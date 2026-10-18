<?php

namespace App\Http\Controllers;

use App\Http\Resources\FilmeResource;
use App\Models\Filme;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FilmeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FilmeResource::collection(Filme::latest('id')->get());
    }

    public function store(Request $request): FilmeResource
    {
        $dados = $this->validar($request);

        return new FilmeResource(Filme::create($dados));
    }

    public function show(Filme $filme): FilmeResource
    {
        return new FilmeResource($filme);
    }

    public function update(Request $request, Filme $filme): FilmeResource
    {
        $dados = $this->validar($request, $filme);
        $filme->update($dados);

        return new FilmeResource($filme->refresh());
    }

    public function destroy(Filme $filme): Response
    {
        $filme->delete();

        return response()->noContent();
    }

    private function validar(Request $request, ?Filme $filme = null): array
    {
        $obrigatorio = $request->isMethod('POST') ? 'required' : 'sometimes';

        return $request->validate([
            'api_id' => [$obrigatorio, 'required', 'string', 'max:100', Rule::unique('filmes')->ignore($filme?->id)],
            'titulo' => [$obrigatorio, 'required', 'string', 'max:255'],
            'ano' => [$obrigatorio, 'required', 'string', 'max:20'],
            'genero' => ['nullable', 'string', 'max:255'],
            'sinopse' => ['nullable', 'string', 'max:20000'],
            'poster' => ['nullable', 'url:http,https', 'max:2048'],
            'nota' => ['nullable', 'numeric', 'between:0,10', 'decimal:0,1'],
            'comentario' => ['nullable', 'string', 'max:5000'],
        ], [
            'required' => 'O campo :attribute é obrigatório.',
            'string' => 'O campo :attribute deve ser um texto.',
            'max' => 'O campo :attribute excede o tamanho permitido (:max).',
            'api_id.unique' => 'Este filme já está nos favoritos.',
            'nota.numeric' => 'A nota deve ser numérica.',
            'nota.between' => 'A nota deve estar entre 0 e 10.',
            'nota.decimal' => 'A nota deve ter no máximo uma casa decimal.',
            'poster.url' => 'O pôster deve ser uma URL HTTP ou HTTPS válida.',
        ]);
    }
}

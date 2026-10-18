<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CatalogoController extends Controller
{
    public function listar(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'titulo' => 'nullable|string|min:2|max:200',
            'pagina' => 'sometimes|integer|min:1|max:100',
        ], ['titulo.min' => 'Digite pelo menos 2 caracteres.']);

        $resultado = Cache::remember('catalogo_ghibli', now()->addMinutes(30), function () {
            $filmes = $this->consultar('/films');
            // Só guarda no cache depois de conferir os dados da API.
            if (!array_is_list($filmes)) {
                abort(502, 'A API de filmes retornou uma resposta inválida.');
            }
            foreach ($filmes as $filme) {
                $this->normalizar($filme);
            }

            return $filmes;
        });

        $titulo = Str::lower(trim($dados['titulo'] ?? ''));
        $filmes = [];

        foreach ($resultado as $filme) {
            $normalizado = $this->normalizar($filme);
            $nomes = $filme['title'].' '.($filme['original_title'] ?? '').' '.($filme['original_title_romanised'] ?? '');

            if ($titulo === '' || Str::contains(Str::lower($nomes), $titulo)) {
                $filmes[] = $normalizado;
            }
        }

        $pagina = (int) ($dados['pagina'] ?? 1);

        return response()->json([
            'data' => array_slice($filmes, ($pagina - 1) * 10, 10),
            'meta' => ['total' => count($filmes), 'pagina' => $pagina],
        ]);
    }

    public function detalhes(Request $request): JsonResponse
    {
        $dados = $request->validate(['api_id' => 'required|uuid'], [
            'api_id.required' => 'Informe o identificador do filme.',
            'api_id.uuid' => 'O identificador do filme é inválido.',
        ]);

        $filme = $this->consultar('/films/'.$dados['api_id']);

        return response()->json(['data' => $this->normalizar($filme)]);
    }

    private function consultar(string $caminho): array
    {
        try {
            $resposta = Http::acceptJson()->connectTimeout(5)->timeout(20)
                ->get(config('filmes.url').$caminho);
        } catch (ConnectionException $erro) {
            abort(502, 'Não foi possível conectar à API de filmes. Verifique a internet e tente novamente.');
        }

        if ($resposta->status() === 404) {
            abort(404, 'Filme não encontrado no catálogo.');
        }
        if (!$resposta->successful()) {
            abort(502, 'A API de filmes está indisponível. Tente novamente mais tarde.');
        }

        $dados = $resposta->json();
        if (!is_array($dados)) {
            abort(502, 'A API de filmes retornou uma resposta inválida.');
        }

        return $dados;
    }

    private function normalizar(mixed $filme): array
    {
        if (!is_array($filme) || !isset($filme['id'], $filme['title'], $filme['release_date'])
            || !is_string($filme['id']) || !is_string($filme['title']) || !is_string($filme['release_date'])) {
            abort(502, 'A API de filmes retornou uma resposta inválida.');
        }

        return [
            'api_id' => $filme['id'],
            'titulo' => $filme['title'],
            'ano' => $filme['release_date'],
            // O catálogo Ghibli não fornece o gênero.
            'genero' => null,
            'sinopse' => $filme['description'] ?? null,
            'poster' => $filme['image'] ?? null,
        ];
    }
}

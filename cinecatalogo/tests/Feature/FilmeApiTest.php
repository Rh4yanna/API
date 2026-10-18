<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FilmeApiTest extends TestCase
{
    use RefreshDatabase;

    private function dados(): array
    {
        return ['api_id' => '2baf70d1-42bb-4437-b551-e5fed5a87abe', 'titulo' => 'Castle in the Sky', 'ano' => '1986', 'nota' => 0, 'comentario' => 'Comentário de teste'];
    }

    public function test_ciclo_completo_de_favoritos(): void
    {
        $this->getJson('/api/filmes')->assertOk()->assertExactJson(['data' => []]);
        $resposta = $this->postJson('/api/filmes', $this->dados())->assertCreated()
            ->assertJsonPath('data.nota', 0)->assertJsonStructure(['data' => ['id', 'api_id', 'titulo', 'created_at']]);
        $id = $resposta->json('data.id');
        $this->getJson("/api/filmes/$id")->assertOk()->assertJsonPath('data.titulo', 'Castle in the Sky');
        $this->putJson("/api/filmes/$id", ['nota' => 9.5, 'comentario' => 'Excelente!'])
            ->assertOk()->assertJsonPath('data.nota', 9.5)->assertJsonPath('data.comentario', 'Excelente!');
        $this->assertDatabaseHas('filmes', ['id' => $id, 'nota' => 9.5]);
        $this->putJson("/api/filmes/$id", ['nota' => null, 'comentario' => null])->assertOk()->assertJsonPath('data.nota', null);
        $this->deleteJson("/api/filmes/$id")->assertNoContent();
        $this->assertDatabaseMissing('filmes', ['id' => $id]);
        $this->getJson("/api/filmes/$id")->assertNotFound();
    }

    public function test_validacao_e_duplicidade(): void
    {
        $this->postJson('/api/filmes', [])->assertUnprocessable()->assertJsonValidationErrors(['api_id', 'titulo', 'ano']);
        $this->postJson('/api/filmes', $this->dados())->assertCreated();
        $this->postJson('/api/filmes', $this->dados())->assertUnprocessable()->assertJsonValidationErrors('api_id');
        foreach ([-1, 11, 5.55] as $nota) {
            $this->postJson('/api/filmes', [...$this->dados(), 'api_id' => 'tt0111161', 'nota' => $nota])
                ->assertUnprocessable()->assertJsonValidationErrors('nota');
        }
        $this->postJson('/api/filmes', [...$this->dados(), 'api_id' => str_repeat('x', 101), 'poster' => 'javascript:alert(1)'])
            ->assertUnprocessable()->assertJsonValidationErrors(['api_id', 'poster']);
    }

    public function test_nota_dez_e_atualizacao_sem_alterar_identificador(): void
    {
        $id = $this->postJson('/api/filmes', [...$this->dados(), 'nota' => 10])->assertCreated()->json('data.id');
        $this->putJson("/api/filmes/$id", $this->dados())->assertOk();
    }

    public function test_recurso_inexistente_e_cors(): void
    {
        $this->putJson('/api/filmes/999', ['nota' => 8])->assertNotFound();
        $this->deleteJson('/api/filmes/999')->assertNotFound();
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Access-Control-Request-Method' => 'POST', 'Access-Control-Request-Headers' => 'content-type'])
            ->options('/api/filmes')->assertNoContent()->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
}

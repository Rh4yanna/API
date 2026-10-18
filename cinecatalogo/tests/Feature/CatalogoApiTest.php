<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CatalogoApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    private function filme(): array
    {
        return [
            'id' => '58611129-2dbc-4a81-a72f-77ddfc1b1b49',
            'title' => 'My Neighbor Totoro',
            'original_title_romanised' => 'Tonari no Totoro',
            'release_date' => '1988',
            'description' => 'Sinopse de teste.',
            'image' => 'https://example.com/totoro.jpg',
        ];
    }

    public function test_lista_inicial_sem_chave(): void
    {
        Http::fake(['*' => Http::response([$this->filme()])]);
        $this->getJson('/api/catalogo')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titulo', 'My Neighbor Totoro')
            ->assertJsonPath('data.0.genero', null)->assertJsonPath('meta.total', 1);
        Http::assertSent(fn ($requisicao) => $requisicao->url() === config('filmes.url').'/films'
            && !isset($requisicao['apikey']));
    }

    public function test_pesquisa_por_titulo_e_nome_original(): void
    {
        Http::fake(['*' => Http::response([$this->filme()])]);
        $this->getJson('/api/pesquisar-filmes?titulo=TOTORO')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/catalogo?titulo=tonari')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/catalogo?titulo=inexistente')->assertOk()->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 0);
    }

    public function test_paginacao(): void
    {
        Http::fake(['*' => Http::response(array_fill(0, 12, $this->filme()))]);
        $this->getJson('/api/catalogo?pagina=1')->assertOk()->assertJsonCount(10, 'data');
        $this->getJson('/api/catalogo?pagina=2')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 12)->assertJsonPath('meta.pagina', 2);
    }

    public function test_detalhes(): void
    {
        Http::fake(['*' => Http::response($this->filme())]);
        $id = $this->filme()['id'];
        $this->getJson('/api/detalhes-filme?api_id='.$id)->assertOk()
            ->assertJsonPath('data.api_id', $id)->assertJsonPath('data.ano', '1988')
            ->assertJsonPath('data.sinopse', 'Sinopse de teste.');
        Http::assertSent(fn ($requisicao) => $requisicao->url() === config('filmes.url').'/films/'.$id);
    }

    public function test_parametros_invalidos(): void
    {
        $this->getJson('/api/catalogo?titulo=a')->assertUnprocessable();
        $this->getJson('/api/catalogo?pagina=101')->assertUnprocessable();
        $this->getJson('/api/detalhes-filme?api_id=abc')->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_filme_nao_encontrado(): void
    {
        Http::fake(['*' => Http::response([], 404)]);
        $this->getJson('/api/detalhes-filme?api_id='.$this->filme()['id'])->assertNotFound();
    }

    public function test_falha_http(): void
    {
        Http::fake(['*' => Http::response([], 500)]);
        $this->getJson('/api/catalogo')->assertStatus(502);
    }

    public function test_respostas_invalidas(): void
    {
        foreach (['resposta inválida', ['erro' => 'indisponível'], [['id' => 'incompleto']]] as $resposta) {
            Http::fake(['*' => Http::response($resposta)]);
            $this->getJson('/api/catalogo')->assertStatus(502);
        }
    }

    public function test_falha_de_conexao(): void
    {
        Http::fake(['*' => Http::failedConnection()]);
        $this->getJson('/api/catalogo')->assertStatus(502)
            ->assertJsonPath('message', 'Não foi possível conectar à API de filmes. Verifique a internet e tente novamente.');
    }
}

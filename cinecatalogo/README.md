## CineCatálogo


## O que é o projeto?
O CineCatálogo é um catálogo de filmes. A ideia é simples: abrir a lista, procurar um filme, ver os detalhes e salvar nos favoritos. Também dá para deixar uma nota de 0 a 10 e escrever um comentário.

Usei **Laravel** para criar a minha API, **React** para a tela e **SQLite** para guardar os favoritos. No projeto, existem duas APIs com funções diferentes:



## A API gratuita que consumi
 é a [Studio Ghibli API](https://ghibliapi.vercel.app/). Ela já existia e fornece os dados dos filmes do estúdio, como My Neighbor Totoro, Spirited Away e Ponyo. Dela vêm o título, o ano, a sinopse e o pôster. 

Essa consulta foi colocada no `app/Http/Controllers/CatalogoController.php`, usando o HTTP Client do Laravel. O endereço da API externa fica no `config/filmes.php`. Quando a tela pede o catálogo ou os detalhes de um filme, o Laravel busca essas informações na API gratuita e devolve em JSON.



## A minha API foi criada em Laravel.
Ela permite cadastrar, listar, consultar, atualizar e excluir os filmes favoritos, além de salvar as notas e os comentários no SQLite. As rotas estão no `routes/api.php`, e essas operações ficam no `app/Http/Controllers/FilmeController.php`.

Usei `Route::apiResource` para definir as rotas RESTful e o `app/Http/Resources/FilmeResource.php` para organizar os campos das respostas em JSON. Por exemplo, `GET /api/filmes` lista os favoritos, `POST /api/filmes` cadastra, `PUT /api/filmes/{id}` atualiza e `DELETE /api/filmes/{id}` exclui.

**A tela em React utiliza a minha API pelo Axios.** As chamadas estão no `src/App.jsx`, e a configuração do Axios fica no `src/api.js`. O React não acessa o banco nem a Studio Ghibli API diretamente: ele faz os pedidos para o Laravel, que cuida dessas duas partes.

Com o projeto ligado, dá para ver os favoritos em **http://localhost:8000/api/filmes** e o catálogo em **http://localhost:8000/api/catalogo**. Esses endereços retornam JSON; a tela que utiliza os dados fica em **http://localhost:8000**.



## Como rodar em outras máquinas
Precisa de **PHP 8.2+ com SQLite habilitado, Composer 2 e Node.js 20.16+ com npm**.

Clone o repositório e entre na pasta do projeto:

```powershell
git clone https://github.com/Rh4yanna/API.git
cd API/cinecatalogo
```

Na primeira execução, rode:

```powershell
composer install
npm.cmd install
Copy-Item .env.example .env
php artisan key:generate
if (!(Test-Path database/database.sqlite)) { New-Item database/database.sqlite -ItemType File }
php artisan migrate
npm.cmd start
```

Acesse **http://localhost:8000**. Nas próximas vezes, basta executar `npm.cmd start`.



## Endereço base
Todas usam o endereço base `http://localhost:8000/api`.



## Testes no Postman
Com o projeto ligado, importe `postman/CineCatalogo.postman_collection.json` no Postman e execute os itens de 00 a 09 na ordem. A coleção testa o catálogo, a pesquisa, os detalhes, o cadastro, a listagem, a atualização e a exclusão de um favorito, além da validação de nota inválida.

A variável `base_url` já vem como `http://localhost:8000/api`. Use na variável `api_id` um filme que ainda não esteja nos favoritos. O teste salva o ID criado e depois exclui apenas esse registro. Os exemplos de resposta e as verificações automáticas já estão na coleção.




import { useEffect, useState } from 'react';
import { api, mensagemErro } from './api';

function Poster({ filme }) {
  const [erro, setErro] = useState(false);

  if (!filme.poster || erro) {
    return (
      <div className="sem-poster">
        <span>▧</span>
        Pôster indisponível
      </div>
    );
  }

  return (
    <img
      src={filme.poster}
      alt={`Pôster de ${filme.titulo}`}
      loading="lazy"
      onError={() => setErro(true)}
    />
  );
}

function CartaoFilme({ filme, abrir, carregando }) {
  return (
    <article className="filme">
      <div className="poster">
        <Poster filme={filme} />
        {filme.id && <span className="selo-favorito">♥ Favorito</span>}
        {filme.nota != null && <span className="selo-nota">★ {filme.nota.toFixed(1)}</span>}
      </div>
      <div className="filme-info">
        <p className="ano">{filme.ano} <span>FILME</span></p>
        <h3>{filme.titulo}</h3>
        <button className="secundario" onClick={() => abrir(filme)} disabled={carregando}>
          {filme.id ? 'Ver e avaliar' : 'Ver detalhes'}
        </button>
      </div>
    </article>
  );
}

function TabelaFilmes({ filmes, abrir }) {
  return (
    <div className="tabela-container">
      <table>
        <caption className="sr-only">Filmes da página atual</caption>
        <thead>
          <tr>
            <th scope="col">Filme</th>
            <th scope="col">Ano</th>
            <th scope="col">Minha nota</th>
            <th scope="col">Na coleção</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>
        <tbody>
          {filmes.map(filme => (
            <tr key={filme.api_id}>
              <td>
                <div className="titulo-tabela">
                  <div className="mini-poster">
                    <Poster filme={filme} />
                  </div>
                  <strong>{filme.titulo}</strong>
                </div>
              </td>
              <td>{filme.ano}</td>
              <td>{filme.nota != null ? `★ ${filme.nota.toFixed(1)}` : 'Não avaliado'}</td>
              <td>{filme.id ? '♥ Salvo' : 'Ainda não'}</td>
              <td>
                <button className="secundario" onClick={() => abrir(filme)}>
                  Ver detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [aba, setAba] = useState('catalogo');
  const [visualizacao, setVisualizacao] = useState('grade');
  const [titulo, setTitulo] = useState('');
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [ordem, setOrdem] = useState('original');
  const [selecionado, setSelecionado] = useState(null);
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [mensagem, setMensagem] = useState(null);
  const [erroCatalogo, setErroCatalogo] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const controle = new AbortController();

    async function carregarInicio() {
      const [respostaFavoritos, respostaCatalogo] = await Promise.allSettled([
        api.get('/filmes', { signal: controle.signal }),
        api.get('/catalogo', { signal: controle.signal }),
      ]);

      if (controle.signal.aborted) return;

      if (respostaFavoritos.status === 'fulfilled') {
        setFavoritos(respostaFavoritos.value.data.data);
      } else {
        setMensagem({ tipo: 'erro', texto: mensagemErro(respostaFavoritos.reason) });
      }

      if (respostaCatalogo.status === 'fulfilled') {
        setResultados(respostaCatalogo.value.data.data);
        setTotal(respostaCatalogo.value.data.meta.total);
      } else {
        setErroCatalogo(mensagemErro(respostaCatalogo.reason));
      }

      setCarregando(false);
    }

    carregarInicio();
    return () => controle.abort();
  }, []);

  useEffect(() => {
    if (selecionado) {
      const painel = document.getElementById('titulo-detalhes');
      painel?.focus({ preventScroll: true });
      painel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selecionado]);

  async function pesquisarFilmes(busca, novaPagina = 1) {
    setCarregando(true);
    setMensagem(null);
    setErroCatalogo('');
    setConsulta(busca);
    setAba('catalogo');
    setFiltro('');

    try {
      const resposta = await api.get('/catalogo', {
        params: { titulo: busca || undefined, pagina: novaPagina },
      });
      setResultados(resposta.data.data);
      setTotal(resposta.data.meta.total);
      setPagina(novaPagina);
    } catch (erro) {
      setResultados([]);
      setTotal(0);
      setErroCatalogo(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  function enviarPesquisa(evento) {
    evento.preventDefault();
    const busca = titulo.trim();

    if (busca.length < 2) {
      setMensagem({ tipo: 'erro', texto: 'Digite pelo menos 2 caracteres.' });
      return;
    }

    pesquisarFilmes(busca);
  }

  function trocarAba(novaAba) {
    setAba(novaAba);
    setFiltro('');
    setSelecionado(null);
  }

  async function abrirFilme(filme) {
    setCarregando(true);
    setMensagem(null);

    try {
      const favorito = favoritos.find(item => item.api_id === filme.api_id);
      let resposta;

      if (favorito) {
        resposta = await api.get(`/filmes/${favorito.id}`);
      } else {
        resposta = await api.get('/detalhes-filme', { params: { api_id: filme.api_id } });
      }

      const detalhes = resposta.data.data;
      setSelecionado(detalhes);
      setNota(detalhes.nota ?? '');
      setComentario(detalhes.comentario ?? '');
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemErro(erro) });
    } finally {
      setCarregando(false);
    }
  }

  async function salvarFilme(evento) {
    evento.preventDefault();
    setCarregando(true);
    setMensagem(null);

    const dados = {
      ...selecionado,
      nota: nota === '' ? null : Number(nota),
      comentario: comentario.trim() || null,
    };

    try {
      if (selecionado.id) {
        const resposta = await api.put(`/filmes/${selecionado.id}`, dados);
        setFavoritos(favoritos.map(filme => (
          filme.id === selecionado.id ? resposta.data.data : filme
        )));
        setMensagem({ tipo: 'sucesso', texto: 'Avaliação salva.' });
      } else {
        const resposta = await api.post('/filmes', dados);
        setFavoritos([resposta.data.data, ...favoritos]);
        setMensagem({ tipo: 'sucesso', texto: 'Filme adicionado aos favoritos.' });
      }

      setSelecionado(null);
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemErro(erro) });
    } finally {
      setCarregando(false);
    }
  }

  async function removerFilme() {
    if (!window.confirm('Remover este filme e sua avaliação dos favoritos?')) return;

    setCarregando(true);
    setMensagem(null);

    try {
      await api.delete(`/filmes/${selecionado.id}`);
      setFavoritos(favoritos.filter(filme => filme.id !== selecionado.id));
      setSelecionado(null);
      setMensagem({ tipo: 'sucesso', texto: 'Filme removido dos favoritos.' });
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemErro(erro) });
    } finally {
      setCarregando(false);
    }
  }

  const lista = aba === 'favoritos' ? favoritos : resultados.map(filme => (
    favoritos.find(favorito => favorito.api_id === filme.api_id) || filme
  ));
  const filmesVisiveis = lista.filter(filme => (
    filme.titulo.toLowerCase().includes(filtro.toLowerCase())
  ));

  if (ordem === 'titulo') {
    filmesVisiveis.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }
  if (ordem === 'ano') {
    filmesVisiveis.sort((a, b) => parseInt(b.ano) - parseInt(a.ano));
  }
  if (ordem === 'nota') {
    filmesVisiveis.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));
  }

  let resumoLista = `${total} filmes do Studio Ghibli`;
  if (consulta) resumoLista = `${total} resultados para “${consulta}”`;
  if (aba === 'favoritos') resumoLista = `${favoritos.length} filmes salvos`;

  let tituloVazio = 'Nenhum filme encontrado';
  let textoVazio = 'Tente pesquisar por outro nome.';
  if (aba === 'favoritos') {
    tituloVazio = 'Nenhum favorito salvo';
    textoVazio = 'Abra um filme do catálogo para adicioná-lo aos favoritos.';
  }
  if (filtro) {
    tituloVazio = 'Nenhum filme com esse filtro';
    textoVazio = 'Tente outro título ou limpe o filtro.';
  }

  const ultimaPagina = Math.min(100, Math.ceil(total / 10));

  return (
    <>
      <header className="cabecalho">
        <a className="marca" href="#inicio"><span className="logo">C</span>Cine<span>Catálogo</span></a>
        <nav aria-label="Navegação principal">
          <button className={aba === 'catalogo' ? 'ativo' : ''} onClick={() => trocarAba('catalogo')}>Catálogo</button>
          <button className={aba === 'favoritos' ? 'ativo' : ''} onClick={() => trocarAba('favoritos')}>Meus favoritos <span>{favoritos.length}</span></button>
        </nav>
      </header>

      <main id="inicio">
        <section className="apresentacao">
          <div className="texto-apresentacao">
            <h1>O próximo filme da sua lista<br />começa <em>por aqui.</em></h1>
            <form className="pesquisa" onSubmit={enviarPesquisa}>
              <label className="sr-only" htmlFor="titulo">Pesquisar filme pelo nome</label>
              <span aria-hidden="true">⌕</span>
              <input
                id="titulo"
                value={titulo}
                onChange={evento => setTitulo(evento.target.value)}
                placeholder="Ex.: Totoro, Spirited Away, Ponyo..."
                minLength={2}
                maxLength={200}
                required
              />
              <button disabled={carregando}>Buscar filme</button>
            </form>
            <div className="temas" aria-label="Sugestões de pesquisa">
              <span>Explore:</span>
              <button className={consulta === '' ? 'ativo' : ''} onClick={() => pesquisarFilmes('')} disabled={carregando}>Todos os filmes</button>
              {['Totoro', 'Spirited Away', 'Ponyo', 'Kiki'].map(tema => (
                <button
                  key={tema}
                  className={consulta.toLowerCase() === tema.toLowerCase() ? 'ativo' : ''}
                  onClick={() => pesquisarFilmes(tema)}
                  disabled={carregando}
                >
                  {tema}
                </button>
              ))}
            </div>
          </div>
        </section>

        {mensagem && (
          <div className={`mensagem ${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
            <span>{mensagem.texto}</span>
            <button onClick={() => setMensagem(null)} aria-label="Fechar mensagem">×</button>
          </div>
        )}

        {selecionado && (
          <section className="detalhes" aria-labelledby="titulo-detalhes">
            <div className="poster-detalhes"><Poster key={selecionado.api_id} filme={selecionado} /></div>
            <div>
              <p className="sobretitulo">{selecionado.id ? 'Filme favorito' : 'Detalhes do filme'}</p>
              <h2 id="titulo-detalhes" tabIndex={-1}>{selecionado.titulo}</h2>
              <p className="metadados">{selecionado.ano} · {selecionado.genero || 'Gênero não informado'}</p>
              <p className="sinopse">{selecionado.sinopse || 'Sinopse não disponível.'}</p>
              <form onSubmit={salvarFilme}>
                <label htmlFor="nota">Sua nota <small>de 0 a 10 · opcional</small></label>
                <input
                  id="nota"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={nota}
                  onChange={evento => setNota(evento.target.value)}
                  disabled={carregando}
                  placeholder="Ainda não avaliado"
                />
                <label htmlFor="comentario">O que você achou do filme?</label>
                <textarea
                  id="comentario"
                  rows={3}
                  maxLength={5000}
                  value={comentario}
                  onChange={evento => setComentario(evento.target.value)}
                  disabled={carregando}
                  placeholder="Seu comentário sobre o filme"
                />
                <div className="acoes">
                  <button disabled={carregando}>{selecionado.id ? 'Salvar avaliação' : '♡ Adicionar aos favoritos'}</button>
                  {selecionado.id && (
                    <button type="button" className="remover" onClick={removerFilme} disabled={carregando}>
                      Remover favorito
                    </button>
                  )}
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => setSelecionado(null)}
                    disabled={carregando}
                  >
                    Fechar detalhes
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="catalogo" aria-labelledby="titulo-lista" aria-busy={carregando}>
          <div className="titulo-secao">
            <h2 id="titulo-lista">
              {aba === 'catalogo' ? 'Explore o catálogo' : 'Minha lista de filmes'}
            </h2>
            <span className="quantidade">{resumoLista}</span>
          </div>

          <div className="barra-lista">
            <div className="abas" aria-label="Lista de filmes">
              <button className={aba === 'catalogo' ? 'ativo' : ''} onClick={() => trocarAba('catalogo')}>Catálogo</button>
              <button className={aba === 'favoritos' ? 'ativo' : ''} onClick={() => trocarAba('favoritos')}>Favoritos <span>{favoritos.length}</span></button>
            </div>
            <div className="controles">
              <label className="sr-only" htmlFor="filtro">Filtrar os filmes desta página pelo título</label>
              <input
                id="filtro"
                value={filtro}
                onChange={evento => setFiltro(evento.target.value)}
                placeholder="Filtrar esta lista..."
              />
              <label className="sr-only" htmlFor="ordem">Ordenar filmes desta página</label>
              <select id="ordem" value={ordem} onChange={evento => setOrdem(evento.target.value)}>
                <option value="original">Ordem original</option>
                <option value="titulo">Título: A–Z</option>
                <option value="ano">Ano: mais recentes</option>
                <option value="nota">Minha nota: maior</option>
              </select>
              <div className="modo-lista" aria-label="Modo de exibição">
                <button aria-label="Exibir em grade" aria-pressed={visualizacao === 'grade'} onClick={() => setVisualizacao('grade')}>▦</button>
                <button aria-label="Exibir em lista" aria-pressed={visualizacao === 'lista'} onClick={() => setVisualizacao('lista')}>☰</button>
              </div>
            </div>
          </div>

          {aba === 'catalogo' && erroCatalogo && !carregando && (
            <div className="aviso-configuracao" role="alert">
              <span className="icone-aviso" aria-hidden="true">!</span>
              <div>
                <h3>Não foi possível carregar o catálogo</h3>
                <p>{erroCatalogo} Seus favoritos salvos continuam disponíveis.</p>
                <button className="secundario" onClick={() => pesquisarFilmes(consulta)}>
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {carregando ? (
            <div className="carregamento" role="status">
              <span /> Carregando filmes...
            </div>
          ) : (
            <>
              {filmesVisiveis.length === 0 && !(aba === 'catalogo' && erroCatalogo) && (
                <div className="vazio">
                  <span aria-hidden="true">{aba === 'favoritos' ? '♡' : '⌕'}</span>
                  <h3>{tituloVazio}</h3>
                  <p>{textoVazio}</p>
                  {aba === 'favoritos' && !filtro && (
                    <button onClick={() => trocarAba('catalogo')}>Explorar filmes</button>
                  )}
                </div>
              )}

              {visualizacao === 'grade' ? (
                <div className="grade">
                  {filmesVisiveis.map(filme => (
                    <CartaoFilme
                      key={filme.api_id}
                      filme={filme}
                      abrir={abrirFilme}
                      carregando={carregando}
                    />
                  ))}
                </div>
              ) : filmesVisiveis.length > 0 && (
                <TabelaFilmes filmes={filmesVisiveis} abrir={abrirFilme} />
              )}

              {aba === 'catalogo' && total > 10 && (
                <div className="paginacao">
                  <div className="acoes">
                    <button
                      className="secundario"
                      disabled={pagina <= 1}
                      onClick={() => pesquisarFilmes(consulta, pagina - 1)}
                    >
                      Anterior
                    </button>
                    <span>Página {pagina} de {ultimaPagina}</span>
                    <button
                      className="secundario"
                      disabled={pagina >= ultimaPagina}
                      onClick={() => pesquisarFilmes(consulta, pagina + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <footer><a className="marca" href="#inicio">Cine<span>Catálogo</span></a></footer>
    </>
  );
}

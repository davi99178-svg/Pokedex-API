import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, test } from 'node:test';

const fetchReal = globalThis.fetch;
const requisicoes = [];
const sprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

globalThis.fetch = async (url, opcoes) => {
  const termo = new URL(url).pathname.split('/').filter(Boolean).at(-1);
  requisicoes.push(termo);
  if (termo === 'naoexiste') return new Response(null, { status: 404 });
  if (termo === 'falha') return new Response(null, { status: 502 });
  if (termo === 'sem-conexao') throw new TypeError('Falha de rede simulada');
  if (termo === 'json-invalido') return new Response('{');
  if (termo === 'lento') {
    // Simula cabeçalhos recebidos, mas com o corpo ainda parado.
    const corpo = new ReadableStream({
      start(controller) {
        opcoes.signal.addEventListener('abort', () => controller.error(opcoes.signal.reason), { once: true });
      },
    });
    return new Response(corpo);
  }

  return Response.json({
    id: 25,
    name: 'pikachu',
    types: [{ type: { name: 'electric' } }],
    sprites: { front_default: sprite },
    campoIgnorado: 'não deve sair na nossa API',
  });
};

process.env.PORT = '0';
const { servidor } = await import('../dist/server.js');
if (!servidor.listening) await once(servidor, 'listening');
const base = `http://127.0.0.1:${servidor.address().port}`;
after(() => {
  globalThis.fetch = fetchReal;
  return new Promise((resolve) => servidor.close(resolve));
});

async function consultar(caminho, status) {
  const resposta = await fetchReal(base + caminho);
  assert.equal(resposta.status, status);
  assert.match(resposta.headers.get('content-type'), /application\/json/);
  return resposta.json();
}

test('busca por número, normaliza o nome e reaproveita o cache nas duas chaves', async () => {
  const antes = requisicoes.length;
  const esperado = { numero: 25, nome: 'pikachu', tipos: ['electric'], imagem: sprite };
  for (const termo of ['25', '025', 'pikachu', '%20Pikachu%20']) {
    assert.deepEqual(await consultar('/api/pokemons/' + termo, 200), esperado);
  }
  assert.deepEqual(requisicoes.slice(antes), ['25']);
});

test('rejeita entradas inválidas com 400 antes de consultar a PokéAPI', async () => {
  const antes = requisicoes.length;
  for (const termo of ['pika%20chu', '%20', '%2F', '%FF', '0', '-1', 'x'.repeat(41)]) {
    const erro = await consultar('/api/pokemons/' + termo, 400);
    assert.equal(typeof erro.erro, 'string');
  }
  assert.equal(requisicoes.length, antes);
});

test('devolve 404 em JSON para Pokémon e rotas inexistentes', async () => {
  assert.match((await consultar('/api/pokemons/naoexiste', 404)).erro, /não encontrado/);
  assert.deepEqual(await consultar('/api/xyz', 404), { erro: 'Rota não encontrada.' });
});

test('trata rede, resposta HTTP ruim e JSON inválido como 503', async () => {
  for (const termo of ['sem-conexao', 'falha', 'json-invalido']) {
    assert.match((await consultar('/api/pokemons/' + termo, 503)).erro, /PokéAPI/);
  }
});

test('devolve 503 após o timeout mesmo quando só o corpo da resposta fica pendente', async () => {
  const inicio = Date.now();
  assert.match((await consultar('/api/pokemons/lento', 503)).erro, /demorou demais/);
  const duracao = Date.now() - inicio;
  assert.ok(duracao >= 4800 && duracao < 8000, `Tempo medido: ${duracao} ms`);
});

test('entrega a página e os arquivos estáticos no mesmo endereço da API', async () => {
  const pagina = await fetchReal(base + '/');
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /Terminal de pesquisa/);
  for (const arquivo of ['/app.js', '/style.css']) {
    const resposta = await fetchReal(base + arquivo);
    assert.equal(resposta.status, 200);
    await resposta.text();
  }
});

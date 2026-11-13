const $ = (id) => document.getElementById(id);
const campo = $('termo');
const imagem = $('imagem');

const tiposEmPortugues = new Map(Object.entries({
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso',
  ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada',
}));

let numeroAtual = 0;
let carregando = false;

async function pedirPokemon(termo) {
  let resposta;
  try {
    resposta = await fetch(`/api/pokemons/${encodeURIComponent(termo)}`);
  } catch {
    throw new Error('Sem conexão com o servidor. Ele está rodando?');
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(dados?.erro ?? `Erro HTTP ${resposta.status}.`);
  if (!dados) throw new Error('O servidor não devolveu uma ficha válida.');
  return dados;
}

function mostrarAviso(mensagem, erro = false) {
  $('aviso').textContent = mensagem;
  $('aviso').classList.toggle('erro', erro);
}

function mostrarPokemon(pokemon) {
  numeroAtual = pokemon.numero;
  $('numero').textContent = `#${String(numeroAtual).padStart(3, '0')}`;
  $('nome').textContent = pokemon.nome;
  $('tipos').replaceChildren(...pokemon.tipos.map((tipo) => {
    const item = document.createElement('li');
    item.className = 'tipo';
    item.textContent = tiposEmPortugues.get(tipo) ?? tipo;
    return item;
  }));

  imagem.hidden = !pokemon.imagem;
  $('sem-imagem').hidden = Boolean(pokemon.imagem);
  $('sem-imagem').textContent = 'Imagem indisponível';
  if (pokemon.imagem) {
    imagem.alt = `Imagem de ${pokemon.nome}`;
    imagem.src = pokemon.imagem;
  } else {
    imagem.removeAttribute('src');
    imagem.alt = '';
  }
}

function atualizarBotoes() {
  $('buscar').disabled = carregando;
  $('aleatorio').disabled = carregando;
  $('anterior').disabled = carregando || numeroAtual <= 1;
  $('proximo').disabled = carregando || numeroAtual === 0;
}

async function buscar(termo) {
  if (carregando) return;
  if (!termo) {
    mostrarAviso('Digite o nome ou o número de um Pokémon.', true);
    return;
  }

  carregando = true;
  atualizarBotoes();
  mostrarAviso('Buscando Pokémon…');

  try {
    const pokemon = await pedirPokemon(termo);
    mostrarPokemon(pokemon);
    mostrarAviso(`Pokémon encontrado: ${pokemon.nome}.`);
  } catch (erro) {
    mostrarAviso(erro.message, true);
  } finally {
    carregando = false;
    atualizarBotoes();
  }
}

$('busca').addEventListener('submit', (evento) => {
  evento.preventDefault();
  buscar(campo.value.trim());
});
$('anterior').addEventListener('click', () => buscar(String(numeroAtual - 1)));
$('proximo').addEventListener('click', () => buscar(String(numeroAtual + 1)));
$('aleatorio').addEventListener('click', () => {
  buscar(String(1 + Math.floor(Math.random() * 151)));
});
imagem.addEventListener('error', () => {
  imagem.hidden = true;
  $('sem-imagem').hidden = false;
});

buscar('1');

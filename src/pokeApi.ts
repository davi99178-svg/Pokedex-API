const URL_BASE = 'https://pokeapi.co/api/v2';
const TEMPO_LIMITE_MS = 5000;
const TERMO_VALIDO = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export interface Pokemon {
  numero: number;
  nome: string;
  tipos: string[];
  imagem: string | null;
}

interface RespostaPokeApi {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: { front_default: string | null };
}

const cache = new Map<string, Pokemon>();

export class ErroDaApi extends Error {
  constructor(public readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

function normalizar(entrada: string): string {
  const termo = entrada.trim().toLowerCase();
  const apenasDigitos = /^\d+$/.test(termo);
  if (termo.length > 40 || !TERMO_VALIDO.test(termo) ||
      (apenasDigitos && (!Number.isSafeInteger(Number(termo)) || Number(termo) < 1))) {
    throw new ErroDaApi(400, 'Use um nome (ex.: pikachu) ou um número positivo (ex.: 25).');
  }
  return apenasDigitos ? String(Number(termo)) : termo;
}

function resumir(dados: RespostaPokeApi): Pokemon {
  if (!Number.isSafeInteger(dados.id) || dados.id < 1 ||
      typeof dados.name !== 'string' || !Array.isArray(dados.types) ||
      !dados.types.every((item) => typeof item?.type?.name === 'string') ||
      !(dados.sprites?.front_default === null || typeof dados.sprites?.front_default === 'string')) {
    throw new Error('Resposta inválida da PokéAPI');
  }

  return {
    numero: dados.id,
    nome: dados.name,
    tipos: dados.types.map((item) => item.type.name),
    imagem: dados.sprites.front_default,
  };
}

export async function buscarPokemon(entrada: string): Promise<Pokemon> {
  const termo = normalizar(entrada);
  const guardado = cache.get(termo);
  if (guardado) return guardado;

  // O sinal continua valendo durante a leitura do JSON, além do recebimento dos cabeçalhos.
  try {
    const resposta = await fetch(`${URL_BASE}/pokemon/${termo}/`, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });

    if (resposta.status === 404) {
      throw new ErroDaApi(404, `Pokémon "${termo}" não encontrado.`);
    }
    if (!resposta.ok) throw new Error(`PokéAPI respondeu ${resposta.status}`);

    const pokemon = resumir((await resposta.json()) as RespostaPokeApi);
    cache.set(termo, pokemon);
    cache.set(pokemon.nome, pokemon);
    cache.set(String(pokemon.numero), pokemon);
    return pokemon;
  } catch (erro) {
    if (erro instanceof ErroDaApi) throw erro;
    throw new ErroDaApi(503, 'A PokéAPI está indisponível ou demorou demais. Tente novamente.');
  }
}

import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import { buscarPokemon, ErroDaApi } from './pokeApi.js';

const porta = Number(process.env.PORT ?? 3000);
const app = express();
app.disable('x-powered-by');

app.get('/api/pokemons/:termo', async (req, res) => {
  res.json(await buscarPokemon(req.params.termo));
});

app.use('/api', (_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use(express.static(path.join(import.meta.dirname, '..', 'public')));

const tratarErro: ErrorRequestHandler = (erro: unknown, _req, res, next) => {
  if (res.headersSent) return next(erro);

  if (erro instanceof ErroDaApi) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }
  if (erro instanceof URIError) {
    res.status(400).json({ erro: 'O termo da busca tem uma codificação inválida.' });
    return;
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
};

app.use(tratarErro);

export const servidor = app.listen(porta, () => {
  const endereco = servidor.address();
  if (endereco && typeof endereco !== 'string') {
    console.log(`Pokédex em http://localhost:${endereco.port}`);
  }
});

# Pokédex UC33

Busque Pokémon por nome ou número. A página é feita com HTML, CSS e JavaScript puro. O servidor usa Node.js, Express 5 e TypeScript.

## Como rodar

1. Instale o Node.js 22 ou mais recente. Confira com `node -v`.
2. Extraia o ZIP e abra a pasta `pokedex-uc33` no VS Code. No terminal, confirme que está na mesma pasta que o `package.json`.
3. Rode:

```bash
npm install
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000). Não use o Live Server nem abra o HTML diretamente, pois a página precisa do servidor Express.

Se o PowerShell bloquear o `npm.ps1`, use `npm.cmd install` e `npm.cmd run dev`.

Para testar a versão compilada, pare o servidor de desenvolvimento com Ctrl+C e rode:

```bash
npm run build
npm start
```

## API

`GET /api/pokemons/:termo`

Exemplo com `/api/pokemons/25`:

```json
{
  "numero": 25,
  "nome": "pikachu",
  "tipos": ["electric"],
  "imagem": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
}
```

| Status | Quando aparece |
| --- | --- |
| 200 | A ficha contém apenas número, nome, tipos e imagem. |
| 400 | O termo é inválido, como `pika%20chu` ou `0`. |
| 404 | O Pokémon não existe, como em `/api/pokemons/naoexiste`, ou a rota da API não existe. |
| 503 | A PokéAPI falhou, respondeu com dados inválidos ou não concluiu a resposta em 5 segundos. |

Os erros têm o formato `{"erro":"mensagem"}`. O cache vive na memória do servidor e é limpo quando ele reinicia. A ficha salva pode ser reutilizada tanto pelo nome quanto pelo número. A imagem é carregada pelo navegador a partir do endereço devolvido no JSON. A consulta de dados à PokéAPI é feita só pelo servidor.

## Desafios feitos

- **1. Tipos em português.** A tela traduz os 18 tipos, mas a API mantém os valores em inglês.
- **4. Botão Aleatório.** Sorteia um número de 1 a 151 e usa a mesma rota das outras buscas.
- **5. Visual próprio.** A tela tem tema escuro com detalhes verdes e se adapta ao celular.

## Como testar

Rode `npm test` para compilar e executar os testes automatizados. Eles usam respostas simuladas da PokéAPI para verificar o cache, os erros em JSON e o timeout, sem depender da internet.

Na tela, teste o seguinte com a internet ligada:

1. Ao abrir, aparece o Bulbasaur (#001) e o botão Anterior fica desativado.
2. Clique em Próximo para ir ao Ivysaur (#002).
3. Digite `Pikachu` e aperte Enter. A ficha mostra #025 e o tipo Elétrico.
4. Clique em Anterior. Aparece Arbok (#024).
5. Busque `naoexiste` e depois `pika chu`. Os avisos mudam, mas a ficha anterior continua na tela.
6. Clique em Aleatório. Aparece um Pokémon entre #001 e #151.
7. Com a página aberta, pare o servidor. Tente buscar e confira o aviso de falta de conexão.

## Para a apresentação

> No vídeo, a página consulta a PokéAPI direto. Na nossa versão, a página pede os dados ao nosso servidor Express. Ele valida a busca, consulta a PokéAPI quando precisa e devolve só os quatro campos da ficha. Se a gente já buscou o Pikachu, buscar pelo número 25 reutiliza o que está na memória. E se a PokéAPI demorar mais de cinco segundos, o servidor devolve um aviso de erro. Na tela, usamos textContent para mostrar os dados como texto, sem interpretar HTML.

Para demonstrar, busque **Pikachu**, depois **25**, depois **pika chu**. Termine clicando em **Aleatório**.

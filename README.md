# Master Ibi Aram 2026 · Simulador de chaveamento

Site estático (Vite + React) que lê a classificação do ranking (xlsx) e monta as chaves das
Categorias A e B conforme o regulamento (`docs/regulamento.md`) e a imagem oficial
(`docs/Masters_2026_Chaves.png`). Visual segue a marca Max Stack (tokens de `site-maxstack`).

## O que dá para simular
- **Trocas de posição**: na aba Ranking, toque num jogador e depois em outro até 5 posições acima.
- **Desistências**: botão "Desiste" na linha. Todos abaixo sobem uma posição; o 9º vira A, o 17º entra na B (regra 4).
- **Resultados**: na aba Chaveamento, toque no vencedor; ele avança até a final. Vaga vazia = W.O.
- Tudo fica salvo no navegador (localStorage) e o botão "Limpar simulação" zera.

## Publicação em maxstack.com.br/ranking
O nginx do site (`deploy/nginx.conf`) serve qualquer arquivo de `web/public` com `try_files`, então o build
copiado para `site-maxstack/web/public/ranking/` responde em `https://maxstack.com.br/ranking/` no deploy
normal, sem mudanças em Caddy, DNS ou containers. Um subdomínio exigiria registro na Cloudflare, bloco
novo no Caddy da VPS e outro container, sem ganho para SEO.

## Comandos
```bash
npm install
npm run dev                 # desenvolvimento
npm test                    # regras (vitest)
npm run e2e                 # telas e regras no navegador, desktop + mobile (playwright)
npm run update -- caminho/da/classificacao.xlsx --label "Classificação de 1º/dez"
npm run build               # dist/ para qualquer host estático
npm run build:site          # build com base /ranking/ e copia para ../site-maxstack/web/public/ranking
```

## Receber uma classificação nova
1. `npm run update -- nova-planilha.xlsx --label "Classificação de 1º/dez"`
   - copia a planilha para `data/ranking.xlsx`
   - grava `public/data/ranking.json` (versão atual) e `public/data/history/<data-hora>.json`
   - atualiza `public/data/index.json`; cada versão aparece no seletor do site
2. `npm run build:site`, commit em `site-maxstack` e deploy normal do site.
   A URL fica `https://maxstack.com.br/ranking/`.

Planilha esperada: primeira aba com cabeçalho contendo `COLOCAÇÃO`, `JOGADOR`, `SITUAÇÃO`
(só "Ativo" entra na chave) e, opcionalmente, `JOGOS`, `VITÓRIAS`, `DERROTAS`, `APROVEITAMENTO (%)`.

## Estrutura
- `src/lib/schedule.js` — confrontos, horários e quadras (dados da imagem oficial)
- `src/lib/bracket.js` — regras: trocas, desistências, vagas, avanço de vencedores
- `src/lib/parseRanking.js` — leitura do xlsx (SheetJS)
- `src/components/` — Header, Bracket, Match, RankingTable, SimulationBar, ThemeToggle
- `scripts/update-ranking.mjs` e `scripts/publish-to-site.mjs`
- `test/e2e.spec.js` — validação de regras e telas

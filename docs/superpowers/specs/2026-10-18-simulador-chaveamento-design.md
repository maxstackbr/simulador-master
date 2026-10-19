# Simulador de Chaveamento — Master Ibi Aram 2026

> Atualizada em 18/10/2026 à noite: a fonte de dados passou a ser o Letzplay (ver
> [sync e notificações](2026-10-18-sync-letzplay-notificacoes-design.md)); a planilha virou plano B.

## Objetivo
Site estático em `https://maxstack.com.br/ranking/` que mostra a classificação atual do
6º Ranking Ibi Aram e monta as chaves das Categorias A e B conforme o regulamento e a imagem
oficial, permitindo simular desistências (regra 4), trocas de posição e resultados de partidas.

## Entradas
- **Classificação publicada** em `public/data/` deste repositório (JSON gerado pelo sync do
  Letzplay ou, no plano B, por `npm run update -- planilha.xlsx`):
  - `ranking.json` — versão atual: `{ id, label, generatedAt, source, players[] }`;
  - `history/<id>.json` — uma por versão; `index.json` — lista de versões para o seletor.
  - `players[]`: `rank, name, status, games, wins, losses, pct` (+ saldo, sets, games, tiebreaks
    quando a origem é o Letzplay). Só `status === 'Ativo'` entra na chave.
- Regras (regulamento.md §3 e §4) e chaveamento fixo (Masters_2026_Chaves.png).

## Regras implementadas
1. Lista elegível = jogadores "Ativo" não marcados como desistentes, em ordem de colocação.
   As 16 primeiras posições dessa lista ocupam as vagas 1..16 ("posição na chave").
2. Categoria A = vagas 1..8; Categoria B = vagas 9..16.
3. Confrontos (seed x seed, horário, quadra):
   - A: 08:00 1x8 Tucano · 08:00 4x5 Beija-Flor · 11:00 2x7 Tucano · 11:00 3x6 Beija-Flor
     · 14:00 SF1 (1x8 vs 4x5) Tucano · 15:30 SF2 (2x7 vs 3x6) Tucano · Dom 10:00 Final Tucano
   - B: 09:30 9x16 Tucano · 09:30 12x13 Beija-Flor · 12:30 10x15 Tucano · 12:30 11x14 Beija-Flor
     · 14:00 SF1 Beija-Flor · 15:30 SF2 Beija-Flor · Dom 08:00 Final Tucano
4. Desistência: jogador removido da lista elegível; todos abaixo sobem uma posição
   (o 9º sobe para a A, o 17º entra na B).
5. Troca de posições: um jogador pode trocar de lugar com outro até 5 posições acima
   (`MAX_SWAP_DISTANCE`); a troca reflete na chave na mesma tela.
6. Resultado (opcional): tocar num jogador de uma partida o marca vencedor e ele avança até a
   final; o campeão aparece em destaque.
7. Desistências, trocas e resultados são estado de simulação no navegador (`localStorage`),
   sobrevivem ao recarregar e têm botão de reiniciar. Não alteram os dados publicados.

## Interface
- Ranking e chave na mesma tela (mobile-first, sem rolagem horizontal da página; a chave rola
  na horizontal por conta própria no celular, da esquerda para a direita).
- Cabeçalho com a data da última atualização em destaque e seletor de versão (histórico).
- Barra de simulação com contagem de desistências, trocas e resultados, e reinício.
- Tema claro por padrão, alternância para escuro lembrada no navegador; alvos de toque ≥ 44px.
- Marca Max Stack (logos em `public/brand/`, tokens do site-maxstack).

## Arquitetura
- Vite + React (JS), CSS puro. Sem backend: o site é estático e só lê JSON.
- **Dados em produção vêm do GitHub**: o build do site injeta `VITE_DATA_URL =
  https://raw.githubusercontent.com/maxstackbr/simulador-master/main/public/data/`, com
  `cache: 'no-cache'`; em desenvolvimento lê `public/data/` local. Assim uma classificação nova
  (commit na `main`) aparece no site sem deploy. O repositório é público para isso.
- `src/lib/parseRanking.js` — xlsx → `Player[]` (SheetJS), usado só pelo plano B.
- `src/lib/schedule.js` — definição fixa dos confrontos, quadras e horários (dados, não código).
- `src/lib/bracket.js` — `applySwaps`, `seedPlayers`, `buildBracket(players, { withdrawn,
  winners, swaps })` → categorias/partidas. Puro, testado (Vitest).
- `src/components/` — Header, RankingTable, Bracket, Match, SimulationBar, ThemeToggle, JumpButton.
- `scripts/lib/version.js` — grava uma versão (atual + histórico + índice); compartilhado pelo
  sync e pelo plano B (`scripts/update-ranking.mjs`).
- `scripts/publish-to-site.mjs` — build com base `/ranking/` e `VITE_DATA_URL`, copia para
  `site-maxstack/web/public/ranking` (deploy normal do site). Só necessário quando o código muda.
- Testes: `npm test` (Vitest: regras da chave, parser do Letzplay, push) e `npm run e2e`
  (Playwright, desktop + mobile, só `test/*.spec.js`).

## Fora de escopo
Autenticação, edição dos dados pelo site, placar por set, upload de planilha no navegador
(removido: a classificação vem do Letzplay).

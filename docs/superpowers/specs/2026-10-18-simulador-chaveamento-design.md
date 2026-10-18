# Simulador de Chaveamento — Master Ibi Aram 2026

## Objetivo
Site estático que lê a classificação do ranking (planilha xlsx) e monta as chaves
das Categorias A e B conforme o regulamento e a imagem oficial, permitindo simular
desistências (regra 4) e resultados de partidas.

## Entradas
- `data/ranking.xlsx` — colunas: COLOCAÇÃO, JOGADOR, SITUAÇÃO, JOGOS, SALDO,
  VITÓRIAS, DERROTAS, ... APROVEITAMENTO (%). Ordenada por COLOCAÇÃO.
- Regras (regulamento.md §3 e §4) e chaveamento fixo (Masters_2026_Chaves.png).

## Regras implementadas
1. Lista elegível = jogadores com SITUAÇÃO "Ativo" e não marcados como desistentes,
   em ordem de colocação. As 16 primeiras posições dessa lista ocupam as vagas
   1..16 ("posição na chave").
2. Categoria A = vagas 1..8; Categoria B = vagas 9..16.
3. Confrontos (seed x seed, horário, quadra):
   - A: 08:00 1x8 Tucano · 08:00 4x5 Beija-Flor · 11:00 2x7 Tucano · 11:00 3x6 Beija-Flor
     · 14:00 SF1 (1x8 vs 4x5) Tucano · 15:30 SF2 (2x7 vs 3x6) Tucano · Dom 10:00 Final Tucano
   - B: 09:30 9x16 Tucano · 09:30 12x13 Beija-Flor · 12:30 10x15 Tucano · 12:30 11x14 Beija-Flor
     · 14:00 SF1 Beija-Flor · 15:30 SF2 Beija-Flor · Dom 08:00 Final Tucano
4. Desistência: jogador removido da lista elegível; todos abaixo sobem uma posição.
   Desistências são estado de simulação no navegador (não alteram a planilha).
5. Resultado (opcional): tocar num jogador de uma partida o marca vencedor e ele
   avança para a próxima fase. Estado local, reinicializável.

## Arquitetura
- Vite + React (JS), CSS puro mobile-first. Sem backend.
- `src/lib/parseRanking.js` — xlsx/ArrayBuffer → `Player[]` (SheetJS).
- `src/lib/schedule.js` — definição fixa dos confrontos (dados, não código).
- `src/lib/bracket.js` — `buildBracket(players, { withdrawn, winners })` → categorias/partidas. Puro, testado.
- `src/components/*` — Header, RankingTable, Bracket, Match, VersionPicker.
- `scripts/update-ranking.mjs <planilha.xlsx>` — copia a planilha para `data/`,
  gera `public/data/ranking.json` (versão atual) e `public/data/history/<ISO>.json`,
  e atualiza `public/data/index.json` com a lista de versões. Cada nova classificação
  recebida = nova versão selecionável no site.
- Upload no navegador: o usuário pode arrastar uma planilha e simular sem publicar.

## Fora de escopo
Autenticação, persistência remota, edição da planilha, placar por set.

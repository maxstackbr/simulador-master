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

## Atualização automática (Letzplay → GitHub → site)
O workflow `.github/workflows/sync-ranking.yml` roda de 2 em 2 horas e no botão "Run workflow". Ele:
1. lê a classificação e os jogos no domínio de embed do Letzplay (`embed.letzplay.me/ibiaram/rankings/47608`,
   feito para sites de terceiros; sem API oficial, o parser em `scripts/lib/letzplay.js` tem testes com uma captura real);
2. compara com `public/data/ranking.json` e `public/data/matches.json`: jogos novos (placar aprovado) e mudanças de posição;
3. se mudou, grava nova versão em `public/data` (atual, histórico e índice) e faz commit na `main`;
4. **só quando algo mudou ou a leitura falhou**, notifica com o resumo pronto para o WhatsApp:
   - push via [ntfy](https://ntfy.sh), com o botão "Abrir no WhatsApp" (abre o app com o texto
     preenchido; falta só escolher o grupo e enviar) e "Copiar texto";
   - e-mail para `contato@maxstack.com.br` (Resend) com o mesmo texto.
   Sem mudança, nenhuma notificação.

Para receber o push: instale o app ntfy (Android/iPhone) e assine o tópico definido no secret
`NTFY_TOPIC`. No ntfy.sh o nome do tópico é a única proteção, por isso ele é um secret (mascarado no
log público do workflow) e deve ser aleatório; para trocar, atualize o secret e assine o novo nome.

O site publicado lê os JSON direto deste repositório (`raw.githubusercontent.com/.../public/data/`), então
**não precisa de deploy do site a cada atualização**. O repositório precisa ser público para isso.

Configuração no GitHub (Settings → Secrets and variables → Actions):
- secret `NTFY_TOPIC` (tópico do push; sem ele o push é pulado)
- secret `RESEND_API_KEY` (chave do Resend; sem ele o e-mail é pulado)
- vars opcionais `EMAIL_TO` (padrão `contato@maxstack.com.br`) e `EMAIL_FROM` (padrão `Ranking Ibi Aram <site@maxstack.com.br>`)

Local: `npm run sync:dry` mostra o resumo sem gravar; `npm run sync` grava.

## Atualização manual (plano B)
1. `npm run update -- nova-planilha.xlsx --label "Classificação de 1º/dez"` grava a versão em `public/data`.
2. Commit e push na `main`: o site lê os JSON do GitHub.
`npm run build:site` só é necessário quando o código do simulador muda (copia o build para
`site-maxstack/web/public/ranking`, publicado no deploy normal do site).

Planilha esperada: primeira aba com cabeçalho contendo `COLOCAÇÃO`, `JOGADOR`, `SITUAÇÃO`
(só "Ativo" entra na chave) e, opcionalmente, `JOGOS`, `VITÓRIAS`, `DERROTAS`, `APROVEITAMENTO (%)`.

## Estrutura
- `src/lib/schedule.js` — confrontos, horários e quadras (dados da imagem oficial)
- `src/lib/bracket.js` — regras: trocas, desistências, vagas, avanço de vencedores
- `src/lib/parseRanking.js` — leitura do xlsx (SheetJS)
- `src/components/` — Header, Bracket, Match, RankingTable, SimulationBar, ThemeToggle
- `scripts/sync-letzplay.mjs`, `scripts/send-push.mjs`, `scripts/send-email.mjs`, `scripts/update-ranking.mjs`, `scripts/publish-to-site.mjs`
- `scripts/lib/letzplay.js` — parser do embed, diff de posições e texto para WhatsApp
- `test/e2e.spec.js` — validação de regras e telas · `test/letzplay.test.js` — parser com HTML real (anonimizado)

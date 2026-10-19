# Sincronização com o Letzplay e notificações

Complementa [simulador de chaveamento](2026-10-18-simulador-chaveamento-design.md).
Escrita em 18/10/2026, depois da implementação, registrando o que foi construído e por quê.

## Objetivo
Manter a classificação do site atualizada sem trabalho manual e avisar o Max, com um texto
pronto para o grupo do WhatsApp, sempre que houver jogo novo, mudança de posição ou falha.

## Fonte de dados
- Domínio de embed do Letzplay, feito para sites de terceiros:
  `https://embed.letzplay.me/ibiaram/rankings/47608/table` (classificação) e `.../matches`
  (jogos; só os 21 mais recentes). Não há API oficial: o HTML pode mudar, por isso o parser
  (`scripts/lib/letzplay.js`) tem testes com capturas reais em `test/fixtures/`.
- Um placar só entra na classificação depois que o administrador (o Max) aprova; o parser considera
  um jogo "jogado" quando aparece o ícone "Venceu". W.O. aparece como "Perdeu por W.O.", conta
  como jogado e sai como "W.O." no resumo. Um W.O. aprovado pode mudar a ordem sem alterar
  jogos/vitórias/derrotas (o Letzplay ordena por pontuação própria que o embed não mostra).

## Fluxo (`.github/workflows/sync-ranking.yml`, de 2 em 2 horas e sob demanda)
Sob demanda, a opção `test_notify` roda a leitura e dispara as notificações com status `test`
(título "🧪 Teste de notificação"), sem gravar nem commitar: serve para validar os canais sem criar
versão espúria. `--force` existe só na linha de comando, para regravar localmente após corrigir o parser.
1. `scripts/sync-letzplay.mjs` lê as duas páginas, compara com `public/data/ranking.json` e
   `public/data/matches.json` e calcula: jogos novos (ids jogados ainda não vistos), mudanças de
   posição (`diffRanking`: subiu/desceu/entrou/saiu) e se as estatísticas mudaram.
2. Se algo mudou, grava nova versão via `scripts/lib/version.js` (com `newMatches` e `changes` dentro
   da versão) e atualiza `matches.json` (acumula os jogos já vistos, pois a página só traz 21). O
   workflow commita em `public/data` na `main` como `ranking-bot`, com `git pull --rebase` e até 3
   tentativas de push (a `main` pode ter andado por um plano B ou revert); o site lê daí.
3. Escreve `sync/summary.txt` (texto para WhatsApp) e `sync/result.json`, e expõe `status`
   (`changed` | `unchanged` | `error`) e `changed` em `$GITHUB_OUTPUT`. `sync/` é ignorado pelo git
   e guarda também o HTML lido, para diagnóstico.
4. Notificações, **só quando `status != unchanged` e a publicação não falhou** (mudança publicada,
   falha de leitura ou teste), independentes entre si (`!cancelled()`): a falha de uma não cancela a
   outra, e o job falha para sinalizar. Se o push do bot falhar, ninguém recebe "atualizado": o
   próximo ciclo recomputa o mesmo diff e publica.
   - Push via ntfy (`scripts/send-push.mjs`, `scripts/lib/push.js`): título por status, texto do
     resumo, botões "Abrir no WhatsApp" (`whatsapp://send?text=…`) e "Copiar texto"; em falha,
     prioridade alta e link para a execução.
   - E-mail via Resend (`scripts/send-email.mjs`) para `contato@maxstack.com.br`, mesmo texto.
5. Se a leitura falhou, o job termina com erro depois de notificar; o site segue com a última
   versão publicada. Plano B manual: `npm run update -- planilha.xlsx` e push na `main`.

## Decisões e motivos
- **Leitura com Chromium (Playwright), não curl/fetch.** A Cloudflare do Letzplay devolve 403 com
  desafio ("Just a moment…" / "Um momento…") para clientes sem impressão digital de navegador em
  IP de datacenter (runner do GitHub, VPS). Um Chromium real recebe a página direto. Custa ~1 min
  de instalação por run. Localmente (IP residencial) o curl passa, o que mascara o problema: testar
  sempre no runner.
- **Só o documento é baixado.** Carregar imagens/scripts da tabela estourava o limite de taxa do
  Letzplay e a página seguinte voltava 429 + desafio; o sync bloqueia tudo que não é documento
  (exceto `challenges.cloudflare.com`), valida cada resposta por status, cabeçalho `cf-mitigated`
  e marcador de conteúdo, tenta de novo até 3 vezes com 30 s, e falha se tabela ou jogos vierem
  vazios, em vez de publicar "nenhum jogo" em silêncio.
- **Site lê os JSON do GitHub** (`raw.githubusercontent.com`, CORS `*`, cache de até 5 min) em vez
  de rebuild/deploy a cada atualização. Exige repositório público.
- **WhatsApp sem API.** A API oficial não posta em grupos e o Max não quer Evolution nem robô de
  tela; o último toque (escolher o grupo e enviar) é humano, por isso o push abre o WhatsApp com o
  texto preenchido.
- **Tópico do ntfy é secret e aleatório.** No ntfy.sh o nome do tópico é a única proteção e o log
  do workflow é público; `NTFY_TOPIC` fica em `secrets`, sem padrão no código e fora do log.
- **Silêncio quando nada muda.** Com cadência de 2 h, notificar sempre daria 12 avisos/dia.
- **Cron em UTC** (`0 */2 * * *`): em Brasília cai nas horas ímpares.
- **Sem `force` no botão.** Um run forçado gravava versão duplicada e notificava "atualizado" sem
  mudança, exigindo revert manual; `test_notify` cobre o único uso real (testar os canais).
- **E2E roda contra um snapshot fixo** (`test/fixtures/e2e-ranking.json` e `e2e-index.json`,
  interceptando `data/*.json` na página): os dados de `public/data` mudam sozinhos a cada ciclo do
  bot e quebravam cenários que esperam nomes em posições fixas.

## Configuração (GitHub → Settings → Secrets and variables → Actions)
- secrets `NTFY_TOPIC` (sem ele o push é pulado) e `RESEND_API_KEY` (sem ela o e-mail é pulado);
- vars opcionais `EMAIL_TO` e `EMAIL_FROM`;
- no celular: app ntfy assinando o tópico do secret.

## Validação feita em 18/10/2026
- Testes: parser com HTML real (tabela, jogos, W.O.), diff, texto do WhatsApp, payload do push.
- Runs reais no GitHub: leitura via Chromium, detecção do W.O. aprovado como jogo novo, commit do
  bot, push + e-mail no mesmo run, e run sem mudança pulando as notificações.
- Site em produção lendo a versão nova do GitHub, validado em Chromium contra `maxstack.com.br`.

## Fora de escopo
Postar no WhatsApp sem toque humano, histórico de jogos além dos vistos pelo sync, dashboard de
execuções (o log do Actions e o e-mail de falha bastam), qualquer escrita no Letzplay.

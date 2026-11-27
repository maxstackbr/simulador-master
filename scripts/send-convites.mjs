#!/usr/bin/env node
// Envia ao grupo do Telegram uma mensagem por classificado para o Master (Categorias A e B), cada uma com
// o botão "Abrir no WhatsApp": o texto já vem preenchido, falta só escolher o atleta e enviar.
// Usa a classificação atual de public/data/ranking.json.
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID; EXCLUIR e APENAS (nomes separados por vírgula, opcionais).
// --dry-run: só imprime as mensagens, sem enviar.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConvites, parseNames } from './lib/convite.js'
import { buildTelegram, cleanToken } from './lib/telegram.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ranking = JSON.parse(readFileSync(resolve(root, 'public/data/ranking.json'), 'utf8'))
const convites = buildConvites(ranking.players, {
  exclude: parseNames(process.env.EXCLUIR),
  only: parseNames(process.env.APENAS),
})
console.log(`Classificação: ${ranking.label} · ${convites.length} convite(s)`)

if (process.argv.includes('--dry-run')) {
  for (const c of convites) console.log(`\n===== ${c.player.rank}º ${c.player.name} (${c.category}) =====\n${c.text}`)
  process.exit(0)
}

const token = cleanToken(process.env.TELEGRAM_BOT_TOKEN)
const chatId = (process.env.TELEGRAM_CHAT_ID ?? '').trim()
if (!token || !chatId) {
  console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definido.')
  process.exit(1)
}

const send = async (body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json().catch(() => ({ ok: false, error_code: r.status, description: 'resposta não é JSON' }))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let failed = 0
for (const c of convites) {
  const msg = buildTelegram({
    status: 'convite',
    summary: c.text,
    chatId,
    title: `${c.player.name} · ${c.player.rank}º · Categoria ${c.category}`,
  })
  let d = await send(msg)
  // Grupo limita a ~20 mensagens por minuto: em 429, espera o que a API pedir e tenta de novo.
  if (!d.ok && d.error_code === 429) {
    await sleep(((d.parameters?.retry_after ?? 30) + 1) * 1000)
    d = await send(msg)
  }
  if (d.ok) console.log(`✔ ${c.player.rank}º ${c.player.name}`)
  else {
    failed++
    console.error(`✖ ${c.player.rank}º ${c.player.name}: ${d.error_code} ${d.description}`)
  }
  await sleep(3500)
}
if (failed) process.exit(1)

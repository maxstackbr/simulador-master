#!/usr/bin/env node
// Envia o resumo da sincronização para um chat do Telegram (privado, grupo ou canal) pelo bot.
// Env: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID (sem eles o envio é pulado),
//      SYNC_STATUS (changed|test|error|stalled), RUN_URL (execução no GitHub, opcional)
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTelegram, cleanToken } from './lib/telegram.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const token = cleanToken(process.env.TELEGRAM_BOT_TOKEN)
const chatId = (process.env.TELEGRAM_CHAT_ID ?? '').trim()
if (!token || !chatId) {
  console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definido; Telegram não enviado.')
  process.exit(0)
}
const status = process.env.SYNC_STATUS || 'error'
const summaryPath = resolve(root, 'sync/summary.txt')
const summary = existsSync(summaryPath)
  ? readFileSync(summaryPath, 'utf8')
  : '❌ *Ranking Ibi Aram*: a sincronização terminou sem produzir resumo. Veja a execução no GitHub.'

const message = buildTelegram({ status, summary, chatId, runUrl: process.env.RUN_URL || null })
const send = async (body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json().catch(() => ({ ok: false, error_code: r.status, description: 'resposta não é JSON' }))
}

let d = await send(message)
// Um botão rejeitado (ex.: URL longa demais) não deve impedir o aviso: reenvia só o texto.
if (!d.ok && d.error_code === 400 && /button|reply markup|url/i.test(d.description ?? '')) {
  console.warn(`::warning::Telegram recusou o botão (${d.description}); enviando sem ele`)
  const { reply_markup, ...plain } = message
  d = await send(plain)
}
if (!d.ok) {
  // Grupo que virou supergrupo ganha ID novo (-100...); o antigo passa a responder 400 com o novo ID.
  const migrated = d.parameters?.migrate_to_chat_id
  console.error(migrated
    ? `O grupo virou supergrupo: atualize o secret TELEGRAM_CHAT_ID para ${migrated}`
    : `Telegram respondeu ${d.error_code}: ${d.description}`)
  process.exit(1)
}
console.log(`✔ Telegram enviado para ${d.result.chat.title ?? 'chat privado'}: ${status}`)

#!/usr/bin/env node
// Envia o resumo da sincronização como push via ntfy (https://ntfy.sh), para abrir no WhatsApp com um toque.
// Env: NTFY_TOPIC (padrão ranking-letzplay), NTFY_SERVER (padrão https://ntfy.sh),
//      SYNC_STATUS (changed|error), RUN_URL (link da execução no GitHub, opcional)
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPush } from './lib/push.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const topic = process.env.NTFY_TOPIC || 'ranking-letzplay'
const server = (process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '')
const status = process.env.SYNC_STATUS || 'error'
const summaryPath = resolve(root, 'sync/summary.txt')
const summary = existsSync(summaryPath)
  ? readFileSync(summaryPath, 'utf8')
  : `❌ *Ranking Ibi Aram*: a sincronização terminou sem produzir resumo. Veja a execução no GitHub.`

const payload = buildPush({ status, summary, topic, runUrl: process.env.RUN_URL || null })
const r = await fetch(server, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
if (!r.ok) {
  console.error(`ntfy respondeu ${r.status}: ${await r.text()}`)
  process.exit(1)
}
console.log(`✔ Push enviado para ${server}/${topic}: ${payload.title}`)

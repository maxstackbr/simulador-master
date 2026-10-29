#!/usr/bin/env node
// Vigia do sync: cancela execuções de sync-ranking.yml ativas há mais de MAX_MINUTES e escreve o aviso
// em sync/summary.txt para o workflow enviar por e-mail e Telegram (SYNC_STATUS=stalled).
// Env: GH_TOKEN (permissão actions: write), GITHUB_REPOSITORY, MAX_MINUTES (padrão 60)
// Saídas em $GITHUB_OUTPUT: stalled (true|false) e run_url (a execução presa mais antiga).
import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStalled, formatStalled } from './lib/watchdog.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = process.env.GITHUB_REPOSITORY
const maxMinutes = Number(process.env.MAX_MINUTES || 60)
const api = (path, method = 'GET') =>
  fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  })
const ghOutput = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`)

const r = await api('/actions/workflows/sync-ranking.yml/runs?per_page=30')
if (!r.ok) {
  console.error(`GitHub respondeu ${r.status}: ${await r.text()}`)
  process.exit(1)
}
const now = new Date()
const stalled = findStalled((await r.json()).workflow_runs, now, maxMinutes).sort((a, b) => a.id - b.id)
if (!stalled.length) {
  console.log(`Nenhuma execução do sync ativa há mais de ${maxMinutes} min.`)
  ghOutput('stalled', 'false')
  process.exit(0)
}

const cancelled = []
for (const run of stalled) {
  // Job preso na fila às vezes não aceita o cancelamento normal (409); o force-cancel resolve.
  const ok = (await api(`/actions/runs/${run.id}/cancel`, 'POST')).ok || (await api(`/actions/runs/${run.id}/force-cancel`, 'POST')).ok
  console.log(`${ok ? '✔ cancelada' : '✘ não cancelada'}: ${run.html_url} (${run.status} desde ${run.run_started_at})`)
  if (ok) cancelled.push(run.id)
}
mkdirSync(resolve(root, 'sync'), { recursive: true })
const summary = formatStalled({ stalled, now, cancelled })
writeFileSync(resolve(root, 'sync/summary.txt'), summary)
console.log(summary)
ghOutput('stalled', 'true')
ghOutput('run_url', stalled[0].html_url)

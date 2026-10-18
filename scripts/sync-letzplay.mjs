#!/usr/bin/env node
// Lê o ranking no embed do Letzplay, detecta jogos novos e mudanças de posição,
// grava nova versão em public/data quando algo mudou e escreve um resumo para e-mail.
// Saídas: sync/result.json, sync/summary.txt (texto pronto para WhatsApp) e, no GitHub
// Actions, as variáveis changed/status em $GITHUB_OUTPUT.
// Uso: node scripts/sync-letzplay.mjs [--dry-run] [--force]
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { URLS, parseTable, parseMatches, diffRanking, formatWhatsApp } from './lib/letzplay.js'
import { readCurrent, writeVersion } from './lib/version.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')
const outDir = resolve(root, 'sync')
mkdirSync(outDir, { recursive: true })

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// A Cloudflare do Letzplay devolve 403 + desafio ("Just a moment...") para clientes sem impressão
// digital de navegador (curl, fetch do Node) em IP de datacenter, como o runner do GitHub Actions.
// Um Chromium real recebe a página direto, então as leituras passam pelo Playwright.
async function fetchPages(urls) {
  const browser = await chromium.launch()
  try {
    const page = await (await browser.newContext({ locale: 'pt-BR', userAgent: UA })).newPage()
    const pages = []
    for (const [i, url] of urls.entries()) {
      if (i > 0) await page.waitForTimeout(5000) // o Letzplay devolve 429 para rajadas
      pages.push(await fetchHtml(page, url))
    }
    return pages
  } finally {
    await browser.close()
  }
}

async function fetchHtml(page, url) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if (resp.status() === 200 && !resp.headers()['cf-mitigated']) return resp.text()
  // Caiu no desafio: dá tempo para a Cloudflare liberar e a página de verdade carregar.
  const released = await page
    .waitForFunction(() => !document.title.startsWith('Just a moment'), null, { timeout: 60_000 })
    .then(() => true, () => false)
  if (!released) throw new Error(`${url} respondeu ${resp.status()} e o desafio da Cloudflare não liberou`)
  return page.content()
}

function ghOutput(k, v) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`)
}

function finish({ status, changed, summary, result }) {
  writeFileSync(resolve(outDir, 'summary.txt'), summary)
  writeFileSync(resolve(outDir, 'result.json'), JSON.stringify(result, null, 2))
  ghOutput('status', status)
  ghOutput('changed', String(changed))
  console.log(summary)
  process.exit(status === 'error' ? 1 : 0)
}

const now = new Date()
try {
  const [tableHtml, matchesHtml] = await fetchPages([URLS.table, URLS.matches])

  const players = parseTable(tableHtml)
  const matches = parseMatches(matchesHtml)
  const played = matches.filter((m) => m.played)

  const prev = readCurrent(root)
  const matchesPath = resolve(root, 'public/data/matches.json')
  const prevMatches = existsSync(matchesPath) ? JSON.parse(readFileSync(matchesPath, 'utf8')) : null
  const knownIds = new Set((prevMatches?.matches ?? []).filter((m) => m.played).map((m) => m.id))
  // Sem histórico de jogos, a primeira leitura só estabelece a base (não há "jogos novos").
  const newMatches = prevMatches ? played.filter((m) => !knownIds.has(m.id)) : []
  const changes = prev ? diffRanking(prev.players, players) : []

  const sameStats = prev && JSON.stringify(prev.players.map((p) => [p.rank, p.name, p.games, p.wins, p.losses])) === JSON.stringify(players.map((p) => [p.rank, p.name, p.games, p.wins, p.losses]))
  const changed = force || !prev || !sameStats || newMatches.length > 0 || !prevMatches

  if (changed && !dryRun) {
    const label = `Letzplay ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' })} ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`
    writeVersion(root, { players, label, source: URLS.table, now, extra: { newMatches: newMatches.map((m) => m.id), changes } })
    // mantém os jogos já vistos (a página só traz os 21 mais recentes)
    const merged = new Map((prevMatches?.matches ?? []).map((m) => [m.id, m]))
    for (const m of matches) merged.set(m.id, m)
    writeFileSync(matchesPath, JSON.stringify({ updatedAt: now.toISOString(), matches: [...merged.values()].sort((a, b) => b.id - a.id) }, null, 2))
  }

  const summary = formatWhatsApp({ now, players, newMatches, changes })
  finish({
    status: changed ? 'changed' : 'unchanged',
    changed,
    summary,
    result: { status: changed ? 'changed' : 'unchanged', generatedAt: now.toISOString(), players: players.length, newMatches, changes, dryRun },
  })
} catch (e) {
  const summary = `❌ *Ranking Ibi Aram*: a leitura automática do Letzplay falhou em ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.\n\nMotivo: ${e.message}\n\nO site continua com a última classificação publicada. Se persistir, exporte a planilha e rode: npm run update -- planilha.xlsx`
  finish({ status: 'error', changed: false, summary, result: { status: 'error', error: e.message, generatedAt: now.toISOString() } })
}

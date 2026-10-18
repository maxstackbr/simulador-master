#!/usr/bin/env node
// Uso: npm run update -- caminho/para/classificacao.xlsx [--label "Ranking 01/dez"]
// Copia a planilha para data/ranking.xlsx, gera public/data/ranking.json (versão atual),
// grava um snapshot em public/data/history/ e atualiza public/data/index.json.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWorkbook } from '../src/lib/parseRanking.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const labelIdx = args.indexOf('--label')
const label = labelIdx >= 0 ? args[labelIdx + 1] : null
const input = args.find((a, i) => !a.startsWith('--') && i !== labelIdx + 1) ?? resolve(root, 'data/ranking.xlsx')

if (!existsSync(input)) {
  console.error(`Arquivo não encontrado: ${input}`)
  process.exit(1)
}

const players = parseWorkbook(new Uint8Array(readFileSync(input)))
if (players.length === 0) {
  console.error('Nenhum jogador encontrado na planilha.')
  process.exit(1)
}

const now = new Date()
const id = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
const version = {
  id,
  label: label ?? `Classificação de ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
  generatedAt: now.toISOString(),
  source: input.split('/').pop(),
  players,
}

const dataDir = resolve(root, 'public/data')
const histDir = resolve(dataDir, 'history')
mkdirSync(histDir, { recursive: true })

const target = resolve(root, 'data/ranking.xlsx')
if (resolve(input) !== target) copyFileSync(input, target)

writeFileSync(resolve(histDir, `${id}.json`), JSON.stringify(version, null, 2))
writeFileSync(resolve(dataDir, 'ranking.json'), JSON.stringify(version, null, 2))

const indexPath = resolve(dataDir, 'index.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : { versions: [] }
index.versions = [
  { id, label: version.label, generatedAt: version.generatedAt, players: players.length },
  ...index.versions.filter((v) => v.id !== id),
]
writeFileSync(indexPath, JSON.stringify(index, null, 2))

console.log(`✔ ${players.length} jogadores lidos de ${version.source}`)
console.log(`✔ Versão ${id} gravada (${index.versions.length} versão(ões) no histórico)`)
console.log('  Agora faça o build/deploy: npm run build')

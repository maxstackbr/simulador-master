#!/usr/bin/env node
// Atualização manual a partir de uma planilha exportada do Letzplay.
// Uso: npm run update -- caminho/para/classificacao.xlsx [--label "Ranking 01/dez"]
import { readFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWorkbook } from '../src/lib/parseRanking.js'
import { writeVersion } from './lib/version.js'

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
const target = resolve(root, 'data/ranking.xlsx')
if (resolve(input) !== target) copyFileSync(input, target)
const { version, count } = writeVersion(root, { players, label, source: input.split('/').pop() })
console.log(`✔ ${players.length} jogadores lidos de ${version.source}`)
console.log(`✔ Versão ${version.id} gravada (${count} versão(ões) no histórico)`)

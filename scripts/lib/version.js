// Grava uma versão da classificação em public/data (atual + histórico + índice).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function readCurrent(root) {
  const p = resolve(root, 'public/data/ranking.json')
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null
}

export function writeVersion(root, { players, label, source, now = new Date(), extra = {} }) {
  const id = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const version = {
    id,
    label:
      label ??
      `Classificação de ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`,
    generatedAt: now.toISOString(),
    source,
    ...extra,
    players,
  }
  const dataDir = resolve(root, 'public/data')
  const histDir = resolve(dataDir, 'history')
  mkdirSync(histDir, { recursive: true })
  writeFileSync(resolve(histDir, `${id}.json`), JSON.stringify(version, null, 2))
  writeFileSync(resolve(dataDir, 'ranking.json'), JSON.stringify(version, null, 2))
  const indexPath = resolve(dataDir, 'index.json')
  const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : { versions: [] }
  index.versions = [{ id, label: version.label, generatedAt: version.generatedAt, players: players.length }, ...index.versions.filter((v) => v.id !== id)]
  writeFileSync(indexPath, JSON.stringify(index, null, 2))
  return { version, count: index.versions.length }
}

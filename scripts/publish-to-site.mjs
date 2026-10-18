#!/usr/bin/env node
// Gera o build com base /ranking/ e copia para o site Max Stack (web/public/ranking),
// que o nginx já serve como página estática. Depois: commit + PR no site-maxstack e o deploy publica.
// Uso: npm run build:site [-- --dest ../site-maxstack/web/public/ranking]
import { execSync } from 'node:child_process'
import { rmSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const destIdx = args.indexOf('--dest')
const dest = resolve(root, destIdx >= 0 ? args[destIdx + 1] : '../site-maxstack/web/public/ranking')
const base = `/${dest.split('/').pop()}/`

const dataUrl = process.env.VITE_DATA_URL ?? 'https://raw.githubusercontent.com/maxstackbr/simulador-master/main/public/data/'
execSync('npx vite build', { cwd: root, stdio: 'inherit', env: { ...process.env, BASE_PATH: base, VITE_DATA_URL: dataUrl } })
if (!existsSync(dirname(dest))) {
  console.error(`Pasta de destino não existe: ${dirname(dest)}`)
  process.exit(1)
}
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(resolve(root, 'dist'), dest, { recursive: true })
console.log(`✔ Publicado em ${dest} (base ${base}, dados de ${dataUrl})`)
console.log('  Próximo passo: commit no site-maxstack e deploy. URL: https://maxstack.com.br' + base)

#!/usr/bin/env node
// Envia o resumo da sincronização por e-mail via Resend (mesmo provedor do site Max Stack).
// Env: RESEND_API_KEY (obrigatório), EMAIL_TO (padrão contato@maxstack.com.br),
//      EMAIL_FROM (padrão "Ranking Ibi Aram <site@maxstack.com.br>"), SYNC_STATUS (changed|unchanged|error)
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const key = process.env.RESEND_API_KEY
if (!key) {
  console.error('RESEND_API_KEY não definido; e-mail não enviado.')
  process.exit(0)
}
const to = process.env.EMAIL_TO || 'contato@maxstack.com.br'
const from = process.env.EMAIL_FROM || 'Ranking Ibi Aram <site@maxstack.com.br>'
const status = process.env.SYNC_STATUS || 'error'
const summaryPath = resolve(root, 'sync/summary.txt')
const summary = existsSync(summaryPath)
  ? readFileSync(summaryPath, 'utf8')
  : '❌ *Ranking Ibi Aram*: a sincronização terminou sem produzir resumo. Veja a execução no GitHub.'

const titles = { changed: '✅ Ranking atualizado', test: '🧪 Teste de notificação', error: '❌ Falha na leitura do ranking' }
const subject = `${titles[status] ?? titles.error} · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const html = `<p style="color:#4a5d78;font-family:system-ui">Copie o bloco abaixo e cole no grupo do WhatsApp:</p>
<pre style="white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;background:#f4f7fa;border:1px solid #d2dce7;border-radius:4px;padding:16px;max-width:640px">${esc(summary)}</pre>
<p style="color:#4a5d78;font-family:system-ui;font-size:12px">Enviado automaticamente pelo sincronizador do simulador (GitHub Actions).</p>`

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from, to: [to], subject, text: summary, html }),
})
if (!r.ok) {
  console.error(`Resend respondeu ${r.status}: ${await r.text()}`)
  process.exit(1)
}
console.log(`✔ E-mail enviado para ${to}: ${subject}`)

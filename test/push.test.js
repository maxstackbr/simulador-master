import { describe, it, expect } from 'vitest'
import { buildPush } from '../scripts/lib/push.js'

const summary = '🎾 *Ranking Ibi Aram 2026* — atualização 18/10 às 21:09\n\n*Jogos novos (1):*\n✅ Marcos Nogueira venceu Sergio Trevisan: W.O. (18/10/26)'

describe('buildPush', () => {
  it('mudança: título, texto e botão que abre o WhatsApp com o texto preenchido', () => {
    const p = buildPush({ status: 'changed', summary, topic: 'ranking-letzplay' })
    expect(p.topic).toBe('ranking-letzplay')
    expect(p.title).toBe('✅ Ranking atualizado')
    expect(p.message).toBe(summary)
    expect(p.priority).toBe(3)
    const [wa, copy] = p.actions
    expect(wa).toMatchObject({ action: 'view', label: 'Abrir no WhatsApp', clear: true })
    expect(wa.url.startsWith('whatsapp://send?text=')).toBe(true)
    expect(decodeURIComponent(wa.url.slice('whatsapp://send?text='.length))).toBe(summary)
    expect(copy).toEqual({ action: 'copy', label: 'Copiar texto', value: summary })
    expect(p.click).toBe(wa.url)
  })
  it('erro: prioridade alta, sem botão do WhatsApp, link para a execução', () => {
    const p = buildPush({ status: 'error', summary: 'falhou', topic: 't', runUrl: 'https://github.com/x/y/actions/runs/1' })
    expect(p.title).toBe('❌ Falha na leitura do ranking')
    expect(p.priority).toBe(4)
    expect(p.actions).toEqual([{ action: 'view', label: 'Ver execução', url: 'https://github.com/x/y/actions/runs/1', clear: true }])
    expect(p.click).toBe('https://github.com/x/y/actions/runs/1')
  })
  it('status desconhecido é tratado como erro', () => {
    expect(buildPush({ status: '', summary: 'x', topic: 't' }).title).toBe('❌ Falha na leitura do ranking')
  })
  it('mensagem cabe no limite de 4.096 bytes do ntfy com um resumo real', () => {
    const p = buildPush({ status: 'changed', summary: summary.repeat(4), topic: 't' })
    expect(Buffer.byteLength(p.message, 'utf8')).toBeLessThan(4096)
  })
})

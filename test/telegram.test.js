import { describe, it, expect } from 'vitest'
import { buildTelegram, toTelegramHtml, cleanToken } from '../scripts/lib/telegram.js'

const summary = '🎾 *Ranking Ibi Aram 2026* — atualização 18/10 às 21:09\n\n*Jogos novos (1):*\n✅ Marcos Nogueira venceu Sergio Trevisan: W.O. (18/10/26)\n\nSimule desistências e a chave: https://maxstack.com.br/ranking/'

describe('toTelegramHtml', () => {
  it('converte o *negrito* do WhatsApp em <b> e escapa &, < e >', () => {
    expect(toTelegramHtml('*A & B* <x> fim')).toBe('<b>A &amp; B</b> &lt;x&gt; fim')
  })
  it('não junta asteriscos de linhas diferentes nem deixa tag aberta', () => {
    expect(toTelegramHtml('5 * 3\n*ok*')).toBe('5 * 3\n<b>ok</b>')
  })
})

describe('buildTelegram', () => {
  it('mudança: título em negrito, resumo em HTML e botão que abre o WhatsApp com o texto', () => {
    const m = buildTelegram({ status: 'changed', summary, chatId: '-5532452503' })
    expect(m.chat_id).toBe('-5532452503')
    expect(m.parse_mode).toBe('HTML')
    expect(m.text.startsWith('<b>✅ Ranking atualizado</b>\n\n🎾 <b>Ranking Ibi Aram 2026</b>')).toBe(true)
    expect(m.link_preview_options).toEqual({ is_disabled: true })
    const [[wa]] = m.reply_markup.inline_keyboard
    expect(wa.text).toBe('Abrir no WhatsApp')
    expect(decodeURIComponent(wa.url.slice('https://wa.me/?text='.length))).toBe(summary)
  })
  it('erro: sem botão do WhatsApp, link para a execução', () => {
    const m = buildTelegram({ status: 'error', summary: 'falhou', chatId: '1', runUrl: 'https://github.com/x/y/actions/runs/1' })
    expect(m.text).toBe('<b>❌ Falha na leitura do ranking</b>\n\nfalhou')
    expect(m.reply_markup.inline_keyboard).toEqual([[{ text: 'Ver execução', url: 'https://github.com/x/y/actions/runs/1' }]])
  })
  it('teste: título próprio, com o botão do WhatsApp para testar o fluxo', () => {
    const m = buildTelegram({ status: 'test', summary, chatId: '1' })
    expect(m.text.startsWith('<b>🧪 Teste de notificação</b>')).toBe(true)
    expect(m.reply_markup.inline_keyboard[0][0].text).toBe('Abrir no WhatsApp')
  })
  it('status desconhecido é tratado como erro', () => {
    expect(buildTelegram({ status: '', summary: 'x', chatId: '1' }).text.startsWith('<b>❌')).toBe(true)
  })
  it('texto cabe no limite de 4.096 caracteres do Telegram com um resumo real', () => {
    expect(buildTelegram({ status: 'changed', summary: summary.repeat(4), chatId: '1' }).text.length).toBeLessThan(4096)
  })
})

describe('cleanToken', () => {
  it('remove espaços e \\r colados junto com o token', () => {
    expect(cleanToken(' 123:abc\r\n')).toBe('123:abc')
  })
})

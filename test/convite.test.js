import { describe, it, expect } from 'vitest'
import { buildConvites, formatConvite, fmtHour, parseNames, slotFor } from '../scripts/lib/convite.js'
import { buildTelegram } from '../scripts/lib/telegram.js'

const names = ['Ueslen Silva', 'João Andrade', 'Roberto Vilas', 'André Di Celio', 'Marinho Schramm', 'Leonardo Belchior',
  'Fabrício Costa', "Max D'angelo", 'Thiago Atilio', 'Marcos Nogueira', 'Douglas Kuada', 'Henrique Carelli',
  'Marco Tempesta', 'Sergio Trevisan', 'Lucas Claudio', 'Franco Gonçales', 'Alexandre Scarpato', 'Andre Santana']
const players = names.map((name, i) => ({ rank: i + 1, name, status: 'Ativo' }))

describe('convites do Master', () => {
  it('um por classificado (16), A do 1º ao 8º e B do 9º ao 16º', () => {
    const c = buildConvites(players)
    expect(c).toHaveLength(16)
    expect(c.filter((x) => x.category === 'A').map((x) => x.player.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(c.at(-1).player.name).toBe('Franco Gonçales')
  })
  it('exclui por nome sem diferenciar acento ou maiúscula, e "apenas" filtra', () => {
    expect(buildConvites(players, { exclude: ["max d'angelo"] }).map((x) => x.player.name)).not.toContain("Max D'angelo")
    expect(buildConvites(players, { only: ['fabricio costa'] }).map((x) => x.player.name)).toEqual(['Fabrício Costa'])
  })
  it('inativo não conta: quem está abaixo sobe e o 17º entra', () => {
    const p = players.map((x) => (x.rank === 2 ? { ...x, status: 'Inativo' } : x))
    const c = buildConvites(p)
    expect(c.map((x) => x.player.name)).not.toContain('João Andrade')
    expect(c.at(-1).player).toMatchObject({ name: 'Alexandre Scarpato', rank: 16 })
  })
  it('primeiro jogo e final conforme a chave oficial', () => {
    expect(slotFor(1)).toMatchObject({ category: 'A', time: '08:00', court: 'Quadra Tucano', finalTime: '10:00' })
    expect(slotFor(14)).toMatchObject({ category: 'B', time: '12:30', court: 'Quadra Beija-Flor', finalTime: '08:00' })
    expect(slotFor(17)).toBeNull()
  })
  it('texto pessoal: primeiro nome, sem emoji, sem saudação de horário', () => {
    const t = formatConvite({ rank: 9, name: 'Thiago Atilio' })
    expect(t.startsWith('Fala, Thiago!')).toBe(true)
    expect(t).toContain('12 e 13 de dezembro')
    // sem posição, categoria, horário ou quadra: a chave ainda pode ser ajustada
    expect(t).not.toMatch(/9º|Categoria|\d+h|quadra|Tucano|Beija/i)
    expect(t).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(t).not.toMatch(/bom dia|boa tarde|boa noite/i)
  })
  it('helpers', () => {
    expect(fmtHour('08:00')).toBe('8h')
    expect(fmtHour('12:30')).toBe('12h30')
    expect(parseNames("Max D'angelo, João Andrade\n ")).toEqual(["Max D'angelo", 'João Andrade'])
  })
  it('mensagem do Telegram com o nome no título e o texto no botão do WhatsApp', () => {
    const [c] = buildConvites(players)
    const m = buildTelegram({ status: 'convite', summary: c.text, chatId: '1', title: 'Ueslen Silva · 1º · Categoria A' })
    expect(m.text.startsWith('<b>Ueslen Silva · 1º · Categoria A</b>\n\nFala, Ueslen!')).toBe(true)
    const [[wa]] = m.reply_markup.inline_keyboard
    expect(wa.text).toBe('Abrir no WhatsApp')
    expect(decodeURIComponent(wa.url.slice('https://wa.me/?text='.length))).toBe(c.text)
  })
})

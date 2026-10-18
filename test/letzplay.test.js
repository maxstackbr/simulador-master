import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseTable, parseMatches, scoreText, diffRanking, formatWhatsApp } from '../scripts/lib/letzplay.js'
import { parseWorkbook } from '../src/lib/parseRanking.js'

const table = readFileSync('test/fixtures/letzplay-table.html', 'utf8')
const matchesHtml = readFileSync('test/fixtures/letzplay-matches.html', 'utf8')

describe('parseTable', () => {
  const players = parseTable(table)
  it('lê os 33 jogadores em ordem', () => {
    expect(players.length).toBe(33)
    expect(players[0]).toMatchObject({ rank: 1, name: 'Ueslen Silva', games: 13, wins: 13, losses: 0, pct: 100, balance: 13 })
    expect(players[0].sets).toEqual({ balance: 16, won: 18, lost: 2 })
    expect(players[0].gamesStat).toEqual({ balance: 64, won: 107, lost: 43 })
    expect(players[0].tiebreaks).toEqual({ balance: 1, won: 2, lost: 1 })
    expect(players[32]).toMatchObject({ rank: 33, name: 'Flávio Malta', games: 7, wins: 0, losses: 4 })
  })
  it('bate com a planilha exportada do Letzplay', () => {
    const xlsx = parseWorkbook(new Uint8Array(readFileSync('data/ranking.xlsx')))
    expect(players.map((p) => [p.rank, p.name, p.games, p.wins, p.losses, p.pct])).toEqual(
      xlsx.map((p) => [p.rank, p.name, p.games, p.wins, p.losses, p.pct]),
    )
  })
  it('falha de forma clara se o HTML mudar', () => {
    expect(() => parseTable('<html></html>')).toThrow(/não encontrada/)
  })
})

describe('parseMatches', () => {
  const matches = parseMatches(matchesHtml)
  it('lê 21 jogos com id, rodada, data e jogadores', () => {
    expect(matches.length).toBe(21)
    const m = matches[1]
    expect(m).toMatchObject({ id: 10633582, round: 9, date: '10/10/26', played: true })
    expect(m.players.map((p) => p.name)).toEqual(['Thiago Atilio', 'Roberto Vilas'])
    expect(m.players[1].won).toBe(true)
    expect(m.players[0].sets).toEqual([{ games: 6, tb: 4 }, { games: 6, tb: null }, { games: 6, tb: null }])
    expect(m.players[1].sets).toEqual([{ games: 7, tb: null }, { games: 2, tb: null }, { games: 10, tb: null }])
    expect(scoreText(m)).toBe('7-6(4) 2-6 10-6')
  })
  it('jogos sem placar aprovado ficam como não jogados', () => {
    const pending = matches.find((m) => m.players.every((p) => !p.won && !p.lost))
    expect(pending).toBeTruthy()
    expect(pending.played).toBe(false)
  })
  it('placar simples', () => {
    expect(scoreText(matches[0])).toBe('6-0 6-3')
  })
})

describe('diffRanking e formatWhatsApp', () => {
  const mk = (names) => names.map((name, i) => ({ rank: i + 1, name }))
  it('detecta subidas, descidas, entradas e saídas', () => {
    const d = diffRanking(mk(['A', 'B', 'C']), mk(['B', 'A', 'D']))
    expect(d).toEqual([
      { name: 'B', from: 2, to: 1 },
      { name: 'A', from: 1, to: 2 },
      { name: 'D', from: null, to: 3 },
      { name: 'C', from: 3, to: null },
    ])
  })
  it('monta mensagem para WhatsApp', () => {
    const players = parseTable(table)
    const matches = parseMatches(matchesHtml).filter((m) => m.played).slice(0, 2)
    const txt = formatWhatsApp({ now: new Date('2026-10-18T18:30:00Z'), players, newMatches: matches, changes: [{ name: 'Douglas Kuada', from: 10, to: 9 }] })
    expect(txt).toContain('*Ranking Ibi Aram 2026* — atualização 18/10 às 15:30')
    expect(txt).toContain('*Jogos novos (2):*')
    expect(txt).toContain('✅ Ueslen Silva venceu Max D\'angelo: 6-0 6-3 (17/10/26)')
    expect(txt).toContain('🔼 Douglas Kuada: 10º → 9º')
    expect(txt).toContain('🅰️ 1. Ueslen Silva')
    expect(txt).toContain('🅱️ 9. Douglas Kuada')
    expect(txt).toContain('⏳ Na fila: 17. Caio Anjos · 18. Henrique Carelli')
  })
})

import { describe, it, expect } from 'vitest'
import { buildBracket, seedPlayers } from './bracket.js'

const mk = (n) =>
  Array.from({ length: n }, (_, i) => ({ rank: i + 1, name: `P${i + 1}`, status: 'Ativo' }))

describe('seedPlayers', () => {
  it('atribui vagas 1..16 aos 16 primeiros ativos', () => {
    const seeds = seedPlayers(mk(20), new Set())
    expect(seeds.length).toBe(16)
    expect(seeds[0].name).toBe('P1')
    expect(seeds[15].name).toBe('P16')
    expect(seeds[15].seed).toBe(16)
  })

  it('desistência: todos abaixo sobem e o 17º entra', () => {
    const seeds = seedPlayers(mk(20), new Set(['P3']))
    expect(seeds.map((s) => s.name)).toEqual([
      'P1','P2','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P17',
    ])
    expect(seeds[2].seed).toBe(3)
    expect(seeds[2].rank).toBe(4)
  })

  it('ignora jogadores com situação diferente de Ativo', () => {
    const players = mk(20)
    players[0].status = 'Inativo'
    const seeds = seedPlayers(players, new Set())
    expect(seeds[0].name).toBe('P2')
  })

  it('com menos de 16 elegíveis deixa vagas vazias', () => {
    const seeds = seedPlayers(mk(10), new Set())
    expect(seeds.length).toBe(10)
  })
})

describe('buildBracket', () => {
  it('monta A com 1x8 e B com 9x16', () => {
    const b = buildBracket(mk(20), { withdrawn: new Set(), winners: {} })
    const A1 = b.categories[0].rounds[0].matches[0]
    expect(A1.slots.map((s) => s.player.name)).toEqual(['P1', 'P8'])
    const B1 = b.categories[1].rounds[0].matches[0]
    expect(B1.slots.map((s) => s.player.name)).toEqual(['P9', 'P16'])
  })

  it('vencedor avança para a semifinal e final', () => {
    const b = buildBracket(mk(20), {
      withdrawn: new Set(),
      winners: { A1: 'P8', A2: 'P4', A5: 'P8' },
    })
    const [qf, sf, fin] = b.categories[0].rounds
    expect(sf.matches[0].slots.map((s) => s.player?.name)).toEqual(['P8', 'P4'])
    expect(fin.matches[0].slots[0].player?.name).toBe('P8')
    expect(fin.matches[0].slots[1].player).toBeNull()
    expect(fin.matches[0].slots[1].label).toBe('Vencedor SF2')
    expect(qf.matches[0].winner).toBe('P8')
  })

  it('vencedor inválido (jogador saiu da chave) é ignorado', () => {
    const b = buildBracket(mk(20), {
      withdrawn: new Set(['P8']),
      winners: { A1: 'P8' },
    })
    const A1 = b.categories[0].rounds[0].matches[0]
    expect(A1.winner).toBeNull()
    expect(A1.slots[1].player.name).toBe('P9')
  })

  it('vaga vazia vira W.O. e o adversário avança automaticamente', () => {
    const b = buildBracket(mk(15), { withdrawn: new Set(), winners: {} })
    const B1 = b.categories[1].rounds[0].matches[0] // 9 x 16
    expect(B1.slots[1].player).toBeNull()
    expect(B1.winner).toBe('P9')
    expect(B1.walkover).toBe(true)
  })
})

import { applySwaps, swapTargets } from './bracket.js'

describe('applySwaps', () => {
  it('quem sobe assume a posição do de cima, que cai só uma posição', () => {
    const out = applySwaps(mk(20), [['P7', 'P3']])
    expect(out.map((p) => p.name).slice(0, 8)).toEqual(['P1', 'P2', 'P7', 'P3', 'P4', 'P5', 'P6', 'P8'])
    expect(out[2].rank).toBe(3)
    expect(out[2].originalRank).toBe(7)
    expect(out[3].name).toBe('P3')
    expect(out[3].rank).toBe(4)
    expect(out[3].originalRank).toBe(3)
    expect(out[0].originalRank).toBe(1)
  })

  it('a ordem do clique não importa: sempre sobe o de posição mais baixa', () => {
    expect(applySwaps(mk(20), [['P3', 'P7']]).map((p) => p.name)).toEqual(applySwaps(mk(20), [['P7', 'P3']]).map((p) => p.name))
  })

  it('jogadores vizinhos simplesmente trocam de lugar', () => {
    const out = applySwaps(mk(20), [['P5', 'P4']])
    expect(out.map((p) => p.name).slice(2, 6)).toEqual(['P3', 'P5', 'P4', 'P6'])
  })

  it('aplica trocas em sequência sobre a ordem já alterada', () => {
    const out = applySwaps(mk(20), [['P7', 'P3'], ['P7', 'P1'], ['P10', 'P7']])
    expect(out.map((p) => p.name).slice(0, 10)).toEqual(['P10', 'P7', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P8', 'P9'])
  })

  it('ignora troca com nome inexistente', () => {
    const out = applySwaps(mk(20), [['P7', 'Zé']])
    expect(out[6].name).toBe('P7')
  })

  it('troca reflete no chaveamento', () => {
    const b = buildBracket(mk(20), { swaps: [['P17', 'P16']] })
    const B1 = b.categories[1].rounds[0].matches[0]
    expect(B1.slots[1].player.name).toBe('P17')
    expect(b.players[15].name).toBe('P17')
  })
})

describe('swapTargets', () => {
  it('devolve todos os outros jogadores, acima e abaixo, sem limite de distância', () => {
    const t = swapTargets(mk(20), 'P9')
    expect(t).toHaveLength(19)
    expect(t.map((p) => p.name)).toContain('P1')
    expect(t.map((p) => p.name)).toContain('P20')
    expect(t.map((p) => p.name)).not.toContain('P9')
  })
  it('o 1º também pode trocar (com quem está abaixo)', () => {
    expect(swapTargets(mk(20), 'P1')).toHaveLength(19)
  })
  it('exclui inativos e desistentes', () => {
    const players = mk(5).map((p) => (p.name === 'P2' ? { ...p, status: 'Inativo' } : p))
    expect(swapTargets(players, 'P1', new Set(['P4'])).map((p) => p.name)).toEqual(['P3', 'P5'])
  })
  it('nome inexistente não tem alvos', () => {
    expect(swapTargets(mk(5), 'Zé')).toEqual([])
  })
})

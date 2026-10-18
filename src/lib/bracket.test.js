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

import { applySwaps, swapTargets, MAX_SWAP_DISTANCE } from './bracket.js'

describe('applySwaps', () => {
  it('troca as posições de dois jogadores e guarda a colocação original', () => {
    const out = applySwaps(mk(20), [['P7', 'P3']])
    expect(out[2].name).toBe('P7')
    expect(out[2].rank).toBe(3)
    expect(out[2].originalRank).toBe(7)
    expect(out[6].name).toBe('P3')
    expect(out[6].rank).toBe(7)
    expect(out[6].originalRank).toBe(3)
    expect(out[0].originalRank).toBe(1)
  })

  it('aplica trocas em sequência sobre a ordem já alterada', () => {
    const out = applySwaps(mk(20), [['P7', 'P3'], ['P7', 'P1']])
    expect(out.map((p) => p.name).slice(0, 7)).toEqual(['P7', 'P2', 'P1', 'P4', 'P5', 'P6', 'P3'])
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
  it('devolve até 5 jogadores acima do selecionado', () => {
    const t = swapTargets(mk(20), 'P9')
    expect(t.map((p) => p.name)).toEqual(['P4', 'P5', 'P6', 'P7', 'P8'])
    expect(MAX_SWAP_DISTANCE).toBe(5)
  })
  it('no topo não há alvos', () => {
    expect(swapTargets(mk(20), 'P1')).toEqual([])
    expect(swapTargets(mk(20), 'P3').map((p) => p.name)).toEqual(['P1', 'P2'])
  })
})

import { CATEGORIES, COURTS } from './schedule.js'

export const TOTAL_SLOTS = 16

/**
 * Aplica trocas de posição simuladas ([nomeA, nomeB], em ordem) à lista ordenada
 * por colocação. Em cada troca, o jogador de posição mais baixa assume a posição do
 * de posição mais alta, e este (com quem estava entre os dois) cai uma posição.
 * Devolve jogadores com rank = posição simulada e originalRank.
 */
export function applySwaps(players, swaps = []) {
  const list = [...players].sort((a, b) => a.rank - b.rank).map((p) => ({ ...p, originalRank: p.originalRank ?? p.rank }))
  for (const [a, b] of swaps) {
    const i = list.findIndex((p) => p.name === a)
    const j = list.findIndex((p) => p.name === b)
    if (i < 0 || j < 0 || i === j) continue
    const [top, bottom] = i < j ? [i, j] : [j, i]
    const [climber] = list.splice(bottom, 1)
    list.splice(top, 0, climber)
  }
  return list.map((p, i) => ({ ...p, rank: i + 1 }))
}

const isActive = (p) => !p.status || /^ativ/i.test(String(p.status).trim())

/** Jogadores com quem `name` pode trocar: qualquer outro jogador ativo e não desistente. */
export function swapTargets(orderedPlayers, name, withdrawn = new Set()) {
  if (!orderedPlayers.some((p) => p.name === name)) return []
  return orderedPlayers.filter((p) => p.name !== name && isActive(p) && !withdrawn.has(p.name))
}

/**
 * Lista elegível em ordem de colocação, descartando inativos e desistentes,
 * e atribui as vagas 1..16 (seed). Regra 3 e 4 do regulamento.
 */
export function seedPlayers(players, withdrawn = new Set()) {
  return [...players]
    .sort((a, b) => a.rank - b.rank)
    .filter((p) => isActive(p) && !withdrawn.has(p.name))
    .slice(0, TOTAL_SLOTS)
    .map((p, i) => ({ ...p, seed: i + 1 }))
}

/**
 * Monta as categorias/partidas a partir do ranking e do estado de simulação.
 * winners: { [matchId]: playerName }
 */
export function buildBracket(players, { withdrawn = new Set(), winners = {}, swaps = [] } = {}) {
  const ordered = applySwaps(players, swaps)
  const seeds = seedPlayers(ordered, withdrawn)
  const bySeed = new Map(seeds.map((s) => [s.seed, s]))
  const resolved = {} // matchId -> match já calculada

  const categories = CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    subtitle: cat.subtitle,
    players: cat.seeds.map((s) => bySeed.get(s) ?? null),
    rounds: cat.rounds.map((round, roundIdx) => ({
      name: round.name,
      day: round.day,
      matches: round.matches.map((m, mIdx) => {
        const slots = m.seeds
          ? m.seeds.map((seed) => ({
              seed,
              player: bySeed.get(seed) ?? null,
              label: `${seed}º colocado`,
            }))
          : m.from.map((srcId, i) => {
              const src = resolved[srcId]
              const srcLabel = roundIdx === 1 ? `QF${(mIdx * 2) + i + 1}` : `SF${i + 1}`
              const player = src?.winner ? src.slots.find((s) => s.player?.name === src.winner)?.player : null
              return { seed: player?.seed ?? null, player: player ?? null, label: `Vencedor ${srcLabel}`, from: srcId }
            })

        const present = slots.filter((s) => s.player)
        let winner = null
        let walkover = false
        if (m.seeds && present.length === 1) {
          winner = present[0].player.name
          walkover = true
        } else if (present.length === 2 && present.some((s) => s.player.name === winners[m.id])) {
          winner = winners[m.id]
        }

        const match = {
          id: m.id,
          time: m.time,
          court: COURTS[m.court],
          roundName: round.name,
          day: round.day,
          slots,
          winner,
          walkover,
          playable: present.length === 2,
        }
        resolved[m.id] = match
        return match
      }),
    })),
  }))

  return { seeds, categories, players: ordered, withdrawn: [...withdrawn], swaps }
}

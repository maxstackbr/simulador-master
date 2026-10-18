import { CATEGORIES, COURTS } from './schedule.js'

export const TOTAL_SLOTS = 16
export const MAX_SWAP_DISTANCE = 5

/**
 * Aplica trocas de posição simuladas ([nomeA, nomeB], em ordem) à lista ordenada
 * por colocação. Devolve jogadores com rank = posição simulada e originalRank.
 */
export function applySwaps(players, swaps = []) {
  const list = [...players].sort((a, b) => a.rank - b.rank).map((p) => ({ ...p, originalRank: p.originalRank ?? p.rank }))
  for (const [a, b] of swaps) {
    const i = list.findIndex((p) => p.name === a)
    const j = list.findIndex((p) => p.name === b)
    if (i < 0 || j < 0 || i === j) continue
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list.map((p, i) => ({ ...p, rank: i + 1 }))
}

/** Jogadores com quem `name` pode trocar: até MAX_SWAP_DISTANCE posições acima. */
export function swapTargets(orderedPlayers, name) {
  const i = orderedPlayers.findIndex((p) => p.name === name)
  if (i < 0) return []
  return orderedPlayers.slice(Math.max(0, i - MAX_SWAP_DISTANCE), i)
}

const isActive = (p) => !p.status || /^ativ/i.test(String(p.status).trim())

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

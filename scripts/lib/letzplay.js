// Leitura do ranking no Letzplay pelo domínio de embed (feito para sites de terceiros).
// Sem API oficial: o HTML pode mudar; os testes em test/letzplay.test.js usam uma captura real.
import { decode } from './html.js'

export const RANKING_ID = 47608
export const PROFILE = 'ibiaram'
export const EMBED = `https://embed.letzplay.me/${PROFILE}/rankings/${RANKING_ID}`
export const URLS = { table: `${EMBED}/table`, matches: `${EMBED}/matches` }

const squash = (s) => s.replace(/\s+/g, ' ')
const strip = (s) => decode(squash(s.replace(/<[^>]+>/g, ' '))).trim()

/** Tabela de classificação → Player[] no mesmo formato de parseRanking.js (planilha). */
export function parseTable(html) {
  const s = squash(html)
  const start = s.indexOf('class="table-ranking"')
  if (start < 0) throw new Error('Tabela de classificação não encontrada no HTML.')
  const body = s.slice(start)
  const blocks = body.split(/(?=<div class="row"> <div class="col-md-6 col-xs-12"> <div class="row"> <div class="col-xs-1 table-field)/).slice(1)
  const players = blocks.map((b) => {
    const rank = Number(strip(b.match(/<div class="col-xs-1 table-field[^"]*">([^<]*)<\/div>/)?.[1] ?? ''))
    const name = strip(b.match(/class="btn-link-default"[^>]*>([^<]+)<\/a>/)?.[1] ?? '')
    const tips = [...b.matchAll(/data-original-title="([^"]+)"[^>]*>\s*([-\d.,]+)/g)].map((m) => [m[1], Number(m[2].replace(',', '.'))])
    const val = (label, nth = 0) => tips.filter((t) => t[0] === label)[nth]?.[1] ?? null
    const games = val('Jogos')
    const wins = val('Vitórias', 0)
    const losses = val('Derrotas', 0)
    return {
      rank,
      name,
      status: 'Ativo',
      games,
      wins,
      losses,
      pct: games ? Math.round((wins / games) * 10000) / 100 : 0,
      balance: val('Saldo'),
      sets: { balance: val('Sets'), won: val('Vitórias', 1), lost: val('Derrotas', 1) },
      gamesStat: { balance: val('Games'), won: val('Vitórias', 2), lost: val('Derrotas', 2) },
      tiebreaks: { balance: val('Tiebreaks'), won: val('Vitórias', 3), lost: val('Derrotas', 3) },
    }
  })
  const ok = players.filter((p) => p.name && Number.isFinite(p.rank) && p.rank > 0)
  if (ok.length < 8) throw new Error(`Só ${ok.length} jogadores reconhecidos; o HTML do Letzplay deve ter mudado.`)
  return ok.sort((a, b) => a.rank - b.rank)
}

/** Página de jogos → Match[] (os mais recentes primeiro). */
export function parseMatches(html) {
  const s = squash(html)
  const parts = s.split('<div class="row match">').slice(1)
  return parts.map((part) => {
    const id = Number(part.match(/match-(\d+)-schedule/)?.[1] ?? 0)
    const round = Number(part.match(/Rodada:\s*(\d+)/)?.[1] ?? 0)
    const when = strip(part.match(/match-\d+-schedule">(.*?)<\/span>/)?.[1] ?? '')
    const date = when.match(/\d{2}\/\d{2}\/\d{2}/)?.[0] ?? null
    const place = decode(part.match(/label-match-place"[^>]*data-original-title="([^"]*)"/)?.[1] ?? '')
    const players = part.split('<div class="row match-player').slice(1).map((pp) => {
      const name = strip(pp.match(/<div class="match-player-info">(?:(?!<a ).)*?([^<>]+?)\s*<span/)?.[1] ?? '')
      const won = /Venceu/.test(pp)
      const lost = /Perdeu/.test(pp)
      const sets = [...pp.matchAll(/match-points[^"]*">\s*(?:<strong>)?(\d+)(?:<\/strong>)?(?:<SUB>(\d*)<\/SUB>)?/gi)].map((m) => ({
        games: Number(m[1]),
        tb: m[2] ? Number(m[2]) : null,
      }))
      return { name, won, lost, sets }
    })
    const played = players.some((p) => p.won)
    const wo = /Perdeu por W\.O\./.test(part)
    return { id, round, date, when, place, players, played, wo }
  })
}

/** Texto do placar, vencedor primeiro: "7-6(4) 2-6 10-6". */
export function scoreText(match) {
  if (match.wo) return 'W.O.'
  const [a, b] = match.players
  const w = a.won ? a : b
  const l = a.won ? b : a
  return w.sets
    .map((ws, i) => {
      const ls = l.sets[i]
      if (!ls) return `${ws.games}`
      const tb = ws.tb ?? ls.tb
      return `${ws.games}-${ls.games}${tb != null ? `(${tb})` : ''}`
    })
    .join(' ')
}

/** Mudanças de colocação entre duas listas. */
export function diffRanking(prev, curr) {
  const before = new Map(prev.map((p) => [p.name, p.rank]))
  const changes = []
  for (const p of curr) {
    const old = before.get(p.name)
    if (old == null) changes.push({ name: p.name, from: null, to: p.rank })
    else if (old !== p.rank) changes.push({ name: p.name, from: old, to: p.rank })
  }
  for (const p of prev) if (!curr.some((c) => c.name === p.name)) changes.push({ name: p.name, from: p.rank, to: null })
  return changes.sort((a, b) => (a.to ?? 999) - (b.to ?? 999))
}

const ord = (n) => (n == null ? '—' : `${n}º`)
const fmtDate = (d) =>
  d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às')

/** Mensagem pronta para colar no WhatsApp. */
export function formatWhatsApp({ now = new Date(), players, newMatches = [], changes = [], siteUrl = 'https://maxstack.com.br/ranking/' }) {
  const L = []
  L.push(`🎾 *Ranking Ibi Aram 2026* — atualização ${fmtDate(now)}`)
  L.push('')
  if (newMatches.length) {
    L.push(`*Jogos novos (${newMatches.length}):*`)
    for (const m of newMatches) {
      const [a, b] = m.players
      const w = a.won ? a : b
      const l = a.won ? b : a
      L.push(`✅ ${w.name} venceu ${l.name}: ${scoreText(m)}${m.date ? ` (${m.date})` : ''}`)
    }
  } else {
    L.push('*Jogos novos:* nenhum desde a última leitura.')
  }
  L.push('')
  if (changes.length) {
    L.push('*Mudanças de posição:*')
    for (const c of changes) {
      const arrow = c.from == null ? '🆕' : c.to == null ? '➖' : c.to < c.from ? '🔼' : '🔽'
      L.push(`${arrow} ${c.name}: ${ord(c.from)} → ${ord(c.to)}`)
    }
  } else {
    L.push('*Mudanças de posição:* nenhuma.')
  }
  L.push('')
  L.push('*Classificados para o Master (hoje):*')
  L.push('🅰️ ' + players.slice(0, 8).map((p) => `${p.rank}. ${p.name}`).join(' · '))
  L.push('🅱️ ' + players.slice(8, 16).map((p) => `${p.rank}. ${p.name}`).join(' · '))
  const next = players.slice(16, 18)
  if (next.length) L.push('⏳ Na fila: ' + next.map((p) => `${p.rank}. ${p.name}`).join(' · '))
  L.push('')
  L.push(`Simule o chaveamento do Master: ${siteUrl}`)
  return L.join('\n')
}

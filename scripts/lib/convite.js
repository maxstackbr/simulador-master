// Mensagem individual pedindo a confirmação prévia de cada classificado para o Master.
// Texto sem emoji e sem formatação, no tom de uma mensagem pessoal: vai do Telegram para o
// WhatsApp de cada atleta, um por um. Sem "bom dia"/"boa tarde": pode ser enviada a qualquer hora.
import { CATEGORIES, COURTS } from '../../src/lib/schedule.js'

const SITE = 'https://maxstack.com.br/ranking/'

// "08:00" → "8h", "09:30" → "9h30"
export const fmtHour = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`
}

export const firstName = (name) => name.trim().split(/\s+/)[0]

/** Categoria e primeiro jogo (quartas) para a posição de hoje. */
export function slotFor(rank) {
  const cat = CATEGORIES.find((c) => c.seeds.includes(rank))
  if (!cat) return null
  const match = cat.rounds[0].matches.find((m) => m.seeds.includes(rank))
  const final = cat.rounds.at(-1).matches[0]
  return { category: cat.id, time: match.time, court: COURTS[match.court].name, finalTime: final.time }
}

export function formatConvite(player, { siteUrl = SITE } = {}) {
  const slot = slotFor(player.rank)
  const quadra = slot.court.replace(/^Quadra /, 'quadra ')
  return [
    `Fala, ${firstName(player.name)}! Tudo certo?`,
    '',
    `Estou fechando a organização do Master, que vai ser nos dias 12 e 13 de dezembro. Pela classificação de hoje você está em ${player.rank}º, na Categoria ${slot.category}.`,
    '',
    `O ranking só fecha no dia 1º, então ainda pode mudar, mas se ficar assim seu primeiro jogo seria sábado (12) às ${fmtHour(slot.time)}, na ${quadra}. A semifinal é sábado à tarde e a final no domingo às ${fmtHour(slot.finalTime)}, com churrasco depois.`,
    '',
    'Queria saber desde já se posso contar com você. A confirmação oficial vai até dia 3, mas se você me der um retorno antes já me ajuda bastante a fechar as chaves.',
    '',
    `A chave e os horários estão aqui: ${siteUrl}`,
    '',
    'Valeu!',
  ].join('\n')
}

const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/**
 * Um convite por classificado (16 primeiros ativos), na ordem do ranking.
 * exclude: nomes que não recebem (ex.: o próprio organizador). only: se não vazio, só esses nomes.
 */
export function buildConvites(players, { exclude = [], only = [], siteUrl = SITE } = {}) {
  const ex = new Set(exclude.map(norm).filter(Boolean))
  const on = new Set(only.map(norm).filter(Boolean))
  return players
    .filter((p) => p.status === 'Ativo')
    .slice(0, 16)
    .map((p, i) => ({ ...p, rank: i + 1 }))
    .filter((p) => !ex.has(norm(p.name)) && (!on.size || on.has(norm(p.name))))
    .map((p) => ({ player: p, category: slotFor(p.rank).category, text: formatConvite(p, { siteUrl }) }))
}

/** Lista separada por vírgula ou quebra de linha (input do workflow). */
export const parseNames = (s) => (s ?? '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean)

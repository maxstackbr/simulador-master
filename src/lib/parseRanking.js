import * as XLSX from 'xlsx'

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()

const COLS = {
  rank: ['COLOCACAO', 'POSICAO', 'POS', '#'],
  name: ['JOGADOR', 'NOME', 'ATLETA'],
  status: ['SITUACAO', 'STATUS'],
  games: ['JOGOS'],
  wins: ['VITORIAS'],
  losses: ['DERROTAS'],
  pct: ['APROVEITAMENTO (%)', 'APROVEITAMENTO'],
}

function findCol(headers, keys) {
  return headers.findIndex((h) => keys.includes(norm(h)))
}

/** Converte linhas (array de arrays) em Player[]. */
export function rowsToPlayers(rows) {
  const headerIdx = rows.findIndex((r) => r.some((c) => COLS.name.includes(norm(c))))
  if (headerIdx < 0) throw new Error('Não encontrei a coluna JOGADOR na planilha.')
  const headers = rows[headerIdx]
  const idx = Object.fromEntries(Object.entries(COLS).map(([k, keys]) => [k, findCol(headers, keys)]))
  if (idx.rank < 0) throw new Error('Não encontrei a coluna COLOCAÇÃO na planilha.')

  return rows
    .slice(headerIdx + 1)
    .filter((r) => r[idx.name] && Number.isFinite(Number(r[idx.rank])))
    .map((r) => ({
      rank: Number(r[idx.rank]),
      name: String(r[idx.name]).trim(),
      status: idx.status >= 0 ? String(r[idx.status] ?? 'Ativo').trim() : 'Ativo',
      games: idx.games >= 0 ? Number(r[idx.games]) || 0 : null,
      wins: idx.wins >= 0 ? Number(r[idx.wins]) || 0 : null,
      losses: idx.losses >= 0 ? Number(r[idx.losses]) || 0 : null,
      pct: idx.pct >= 0 ? Number(r[idx.pct]) || 0 : null,
    }))
    .sort((a, b) => a.rank - b.rank)
}

/** Lê um ArrayBuffer/Buffer de xlsx/csv e devolve Player[]. */
export function parseWorkbook(data) {
  const wb = XLSX.read(data, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  return rowsToPlayers(rows)
}

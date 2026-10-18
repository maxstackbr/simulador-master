import { useState } from 'react'
import { swapTargets, MAX_SWAP_DISTANCE } from '../lib/bracket.js'

const isActive = (p) => /^ativ/i.test(p.status)

export default function RankingTable({ players, seeds, withdrawn, onToggle, onSwap }) {
  const [selected, setSelected] = useState(null) // nome do jogador em modo troca
  const seedByName = new Map(seeds.map((s) => [s.name, s.seed]))
  const nextInLine = players.find((p) => !seedByName.has(p.name) && !withdrawn.has(p.name) && isActive(p))
  const targets = selected ? new Set(swapTargets(players, selected).map((p) => p.name)) : new Set()

  const clickRow = (p) => {
    if (!isActive(p) || withdrawn.has(p.name)) return
    if (!selected) return setSelected(p.name)
    if (selected === p.name) return setSelected(null)
    if (targets.has(p.name)) {
      onSwap(selected, p.name)
      setSelected(null)
    } else {
      setSelected(p.name)
    }
  }

  return (
    <section className="ranking">
      <header className="ranking-head">
        <h2>Classificação do ranking</h2>
        <p className="muted">
          Toque num jogador e depois em outro até {MAX_SWAP_DISTANCE} posições acima para trocar as colocações. Use o
          botão Desiste para simular uma desistência. Tudo reflete na chave ao lado.
        </p>
        {selected && (
          <div className="swap-hint">
            <span>
              Trocando <strong>{selected}</strong>. Escolha um jogador destacado acima, ou toque nele de novo para cancelar.
            </span>
            <button className="btn btn-small" onClick={() => setSelected(null)}>
              Cancelar
            </button>
          </div>
        )}
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th className="th-name">Jogador</th>
              <th>Chave</th>
              <th className="num stat">J</th>
              <th className="num stat">V</th>
              <th className="num stat">D</th>
              <th className="num stat">%</th>
              <th>Desiste</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const seed = seedByName.get(p.name)
              const out = withdrawn.has(p.name)
              const inactive = !isActive(p)
              const moved = p.originalRank != null && p.originalRank !== p.rank
              const cat = seed ? (seed <= 8 ? 'A' : 'B') : null
              const cls = [
                out ? 'row-out' : '',
                inactive ? 'row-inactive' : '',
                cat ? `row-cat-${cat}` : '',
                nextInLine?.name === p.name ? 'row-next' : '',
                selected === p.name ? 'row-selected' : '',
                targets.has(p.name) ? 'row-target' : '',
                selected && !targets.has(p.name) && selected !== p.name ? 'row-dim' : '',
                !inactive && !out ? 'row-clickable' : '',
              ]
                .join(' ')
                .trim()
              return (
                <tr key={p.name} className={cls} onClick={() => clickRow(p)} aria-selected={selected === p.name || undefined}>
                  <td className="num rank">{p.rank}</td>
                  <td className="name">
                    {p.name}
                    {moved && (
                      <span className={`tag rank-delta ${p.originalRank > p.rank ? 'up' : 'down'}`}>
                        {p.originalRank > p.rank ? '▲' : '▼'} era {p.originalRank}º
                      </span>
                    )}
                    {inactive && <span className="tag tag-muted">{p.status}</span>}
                    {nextInLine?.name === p.name && <span className="tag tag-next">próximo</span>}
                    {targets.has(p.name) && <span className="tag tag-swap">trocar</span>}
                  </td>
                  <td>
                    {cat ? (
                      <span className={`tag tag-cat-${cat}`}>
                        {cat} · {seed}º
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="num stat">{p.games ?? ''}</td>
                  <td className="num stat">{p.wins ?? ''}</td>
                  <td className="num stat">{p.losses ?? ''}</td>
                  <td className="num stat">{p.pct != null ? p.pct.toFixed(0) : ''}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <label className="switch">
                      <input type="checkbox" checked={out} disabled={inactive} onChange={() => onToggle(p.name)} />
                      <span />
                    </label>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

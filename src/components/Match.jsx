export default function Match({ match, onPickWinner }) {
  return (
    <article className={`match court-${match.court.id} ${match.winner ? 'match-done' : ''}`}>
      <header className="match-head">
        <span className="match-time">{match.time}</span>
        <span className="match-court">{match.court.name}</span>
      </header>
      {match.slots.map((slot, i) => {
        const p = slot.player
        const isWinner = p && match.winner === p.name
        const isLoser = p && match.winner && !isWinner
        return (
          <button
            key={i}
            type="button"
            className={`slot ${isWinner ? 'slot-winner' : ''} ${isLoser ? 'slot-loser' : ''} ${p ? '' : 'slot-empty'}`}
            disabled={!p || !match.playable}
            onClick={() => p && onPickWinner(match.id, p.name)}
            title={p && match.playable ? 'Marcar como vencedor' : undefined}
          >
            <span className="slot-seed">{slot.seed ?? '–'}</span>
            <span className="slot-name">{p ? p.name : slot.label}</span>
            {isWinner && <span className="slot-check" aria-label="vencedor">✓</span>}
            {!p && slot.seed && <span className="slot-tag">vaga</span>}
          </button>
        )
      })}
      {match.walkover && <div className="match-wo">W.O. · avança automaticamente</div>}
    </article>
  )
}

import Match from './Match.jsx'

function Category({ cat, onPickWinner }) {
  const [qf, sf, fin] = cat.rounds
  const champion = fin.matches[0].winner
  return (
    <section className={`category category-${cat.id}`}>
      <header className="category-head">
        <div>
          <h2>{cat.name}</h2>
          <p className="muted">{cat.subtitle}</p>
        </div>
        {champion && <div className="champion">🏆 {champion}</div>}
      </header>

      <div className="bracket-scroll">
      <div className="bracket">
        <div className="round round-qf">
          <h3 className="round-title">
            {qf.name} <small>{qf.day}</small>
          </h3>
          <div className="pair">
            <Match match={qf.matches[0]} onPickWinner={onPickWinner} />
            <Match match={qf.matches[1]} onPickWinner={onPickWinner} />
          </div>
          <div className="pair">
            <Match match={qf.matches[2]} onPickWinner={onPickWinner} />
            <Match match={qf.matches[3]} onPickWinner={onPickWinner} />
          </div>
        </div>

        <div className="round round-sf">
          <h3 className="round-title">
            {sf.name} <small>{sf.day}</small>
          </h3>
          <div className="pair">
            <Match match={sf.matches[0]} onPickWinner={onPickWinner} />
            <Match match={sf.matches[1]} onPickWinner={onPickWinner} />
          </div>
        </div>

        <div className="round round-final">
          <h3 className="round-title">
            {fin.name} <small>{fin.day}</small>
          </h3>
          <div className="single">
            <Match match={fin.matches[0]} onPickWinner={onPickWinner} />
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

export default function Bracket({ bracket, onPickWinner }) {
  return (
    <div className="categories">
      {bracket.categories.map((cat) => (
        <Category key={cat.id} cat={cat} onPickWinner={onPickWinner} />
      ))}
      <div className="legend">
        <span className="legend-item court-tucano">Quadra Tucano</span>
        <span className="legend-item court-beija">Quadra Beija-Flor</span>
      </div>
    </div>
  )
}

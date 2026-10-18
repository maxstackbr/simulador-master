export default function SimulationBar({ withdrawn, winnersCount, swapsCount = 0, onRemove, onReset }) {
  const active = withdrawn.length > 0 || winnersCount > 0 || swapsCount > 0
  return (
    <section className={`simbar ${active ? 'simbar-active' : ''}`}>
      <div className="simbar-text">
        <strong>Simulação</strong>
        {active ? (
          <span>
            {swapsCount} troca{swapsCount === 1 ? '' : 's'} · {withdrawn.length} desistência{withdrawn.length === 1 ? '' : 's'} · {winnersCount} resultado{winnersCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span>Toque num jogador na chave para marcar o vencedor. Na tabela, troque posições ou marque desistências.</span>
        )}
      </div>
      {withdrawn.length > 0 && (
        <div className="chips">
          {withdrawn.map((n) => (
            <button key={n} className="chip" onClick={() => onRemove(n)} title="Desfazer desistência">
              {n} <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}
      {active && (
        <button className="btn btn-small" onClick={onReset}>
          Limpar simulação
        </button>
      )}
    </section>
  )
}

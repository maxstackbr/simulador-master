export default function SimulationBar({ withdrawn, confirmed = [], revived = [], winnersCount, swapsCount = 0, onRemove, onReset }) {
  const active = withdrawn.length > 0 || winnersCount > 0 || swapsCount > 0 || revived.length > 0
  return (
    <section className={`simbar ${active ? 'simbar-active' : ''}`}>
      <div className="simbar-text">
        <strong>Simulação</strong>
        {active ? (
          <span>
            {swapsCount} troca{swapsCount === 1 ? '' : 's'} · {withdrawn.length} desistência{withdrawn.length === 1 ? '' : 's'} · {winnersCount} resultado{winnersCount === 1 ? '' : 's'}
            {revived.length > 0 && ` · ${revived.length} desistência${revived.length === 1 ? '' : 's'} confirmada${revived.length === 1 ? '' : 's'} desfeita${revived.length === 1 ? '' : 's'}`}
          </span>
        ) : (
          <span>Toque num jogador na chave para marcar o vencedor. Na tabela, troque posições ou marque desistências.</span>
        )}
      </div>
      {confirmed.length > 0 && (
        <div className="confirmed">
          <span className="muted">Desistências confirmadas, já aplicadas:</span>
          {confirmed.map((n) => (
            <button
              key={n}
              className={`chip chip-confirmed ${revived.includes(n) ? 'chip-revived' : ''}`}
              onClick={() => onRemove(n)}
              title={revived.includes(n) ? 'Aplicar a desistência de novo' : 'Simular que o atleta volta'}
            >
              {n}
            </button>
          ))}
        </div>
      )}
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

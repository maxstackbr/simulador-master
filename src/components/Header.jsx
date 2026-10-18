import ThemeToggle from './ThemeToggle.jsx'

const BASE = import.meta.env.BASE_URL
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function Header({ version, versions, onSelectVersion }) {
  return (
    <header className="header">
      <div className="container topbar">
        <a href="https://maxstack.com.br" className="brand-link" aria-label="Max Stack">
          <img className="logo logo-dark" src={`${BASE}brand/maxstack-logo-dark.svg`} alt="Max Stack" />
          <img className="logo logo-light" src={`${BASE}brand/maxstack-logo-light.svg`} alt="Max Stack" />
        </a>
        <ThemeToggle />
      </div>

      <div className="container hero">
        <p className="eyebrow">Torneio de tênis · 12 e 13 de dezembro de 2026</p>
        <h1>Master Ibi Aram 2026</h1>
        <p className="hero-sub">
          Simulador de chaveamento. As chaves são montadas a partir da classificação do ranking. Troque posições, marque
          desistências e resultados para ver quem entra, quem sai e quem avança.
        </p>

        {version?.generatedAt && (
          <div className="updated" role="status">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>
              Última atualização do ranking: <strong>{fmtDate(version.generatedAt)}</strong>
            </span>
          </div>
        )}

        <div className="toolbar">
          <label className="select-wrap">
            <span className="sr-only">Versão da classificação</span>
            <select
              value={version?.id ?? ''}
              onChange={(e) => onSelectVersion(e.target.value)}
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

    </header>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { buildBracket } from './lib/bracket.js'
import Header from './components/Header.jsx'
import Bracket from './components/Bracket.jsx'
import RankingTable from './components/RankingTable.jsx'
import SimulationBar from './components/SimulationBar.jsx'
import JumpButton from './components/JumpButton.jsx'

const BASE = import.meta.env.BASE_URL
// Em produção os dados vêm do GitHub (atualizados pelo workflow); em dev, da pasta public/data.
const DATA = (import.meta.env.VITE_DATA_URL || `${BASE}data/`).replace(/\/?$/, '/')
const STORAGE_KEY = 'master-ibi-aram-sim'

const loadSim = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { withdrawn: new Set(s?.withdrawn ?? []), winners: s?.winners ?? {}, swaps: s?.swaps ?? [], revived: s?.revived ?? [] }
  } catch {
    return { withdrawn: new Set(), winners: {}, swaps: [], revived: [] }
  }
}

export default function App() {
  const [versions, setVersions] = useState([])
  const [version, setVersion] = useState(null) // { id, label, generatedAt, players }
  const [error, setError] = useState(null)
  const [sim, setSim] = useState(loadSim)
  // Desistências confirmadas pelos atletas (data/desistencias.json): aplicadas por padrão.
  // Quem visita pode desmarcar uma para simular a volta do atleta (fica em sim.revived).
  const [confirmed, setConfirmed] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ withdrawn: [...sim.withdrawn], winners: sim.winners, swaps: sim.swaps, revived: sim.revived }))
    } catch {}
  }, [sim])

  useEffect(() => {
    fetch(`${DATA}index.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { versions: [] }))
      .then((idx) => setVersions(idx.versions ?? []))
      .catch(() => setVersions([]))
    fetch(`${DATA}ranking.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('Nenhuma classificação publicada ainda.')
        return r.json()
      })
      .then(setVersion)
      .catch((e) => setError(e.message))
    fetch(`${DATA}desistencias.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { nomes: [] }))
      .then((d) => setConfirmed(Array.isArray(d.nomes) ? d.nomes : []))
      .catch(() => setConfirmed([]))
  }, [])

  const selectVersion = async (id) => {
    setError(null)
    try {
      const r = await fetch(`${DATA}history/${id}.json`)
      if (!r.ok) throw new Error('Versão não encontrada.')
      setVersion(await r.json())
    } catch (e) {
      setError(e.message)
    }
  }

  const players = version?.players ?? []
  const confirmedOut = useMemo(() => confirmed.filter((n) => !sim.revived.includes(n)), [confirmed, sim.revived])
  const withdrawn = useMemo(() => new Set([...confirmedOut, ...sim.withdrawn]), [confirmedOut, sim.withdrawn])
  const bracket = useMemo(() => buildBracket(players, { ...sim, withdrawn }), [players, sim, withdrawn])

  const toggleWithdrawn = (name) =>
    setSim((s) => {
      if (confirmed.includes(name)) {
        const revived = s.revived.includes(name) ? s.revived.filter((n) => n !== name) : [...s.revived, name]
        return { ...s, revived }
      }
      const withdrawn = new Set(s.withdrawn)
      withdrawn.has(name) ? withdrawn.delete(name) : withdrawn.add(name)
      return { ...s, withdrawn }
    })

  const setWinner = (matchId, name) =>
    setSim((s) => {
      const winners = { ...s.winners }
      if (winners[matchId] === name) delete winners[matchId]
      else winners[matchId] = name
      return { ...s, winners }
    })

  const swapPlayers = (a, b) => setSim((s) => ({ ...s, swaps: [...s.swaps, [a, b]] }))

  const resetSim = () => setSim({ withdrawn: new Set(), winners: {}, swaps: [], revived: [] })

  return (
    <div className="app">
      <Header
        version={version}
        versions={versions}
        onSelectVersion={selectVersion}
      />

      <main className="container">
        {error && <div className="alert">{error}</div>}

        {version && (
          <SimulationBar
            withdrawn={[...sim.withdrawn].filter((n) => !confirmed.includes(n))}
            confirmed={confirmed}
            revived={sim.revived}
            winnersCount={Object.keys(sim.winners).length}
            swapsCount={sim.swaps.length}
            onRemove={toggleWithdrawn}
            onReset={resetSim}
          />
        )}

        {version && (
          <div className="layout">
            <div id="ranking" className="layout-ranking">
              <RankingTable players={bracket.players} seeds={bracket.seeds} withdrawn={withdrawn} confirmed={confirmedOut} onToggle={toggleWithdrawn} onSwap={swapPlayers} />
            </div>
            <div id="chave" className="layout-bracket">
              <Bracket bracket={bracket} onPickWinner={setWinner} />
            </div>
          </div>
        )}
        {version && <JumpButton />}
      </main>

      <footer className="footer">
        <p>Torneio Master Ibi Aram 2026 · 12 e 13 de dezembro · Quadras Tucano e Beija-Flor</p>
        <p className="muted">Simulador não oficial. A posição na chave depende da classificação final divulgada em 1º/dez.</p>
      </footer>
    </div>
  )
}

import { describe, it, expect } from 'vitest'
import { findStalled, formatStalled } from '../scripts/lib/watchdog.js'

const now = new Date('2026-10-27T05:00:00Z')
const run = (id, status, startedAt) => ({ id, status, run_started_at: startedAt, html_url: `https://github.com/x/y/actions/runs/${id}` })

describe('findStalled', () => {
  it('pega execução ativa há mais do limite (job preso na fila, como em 27/10)', () => {
    const runs = [run(1, 'in_progress', '2026-10-27T02:59:25Z'), run(2, 'queued', '2026-10-27T03:30:00Z')]
    expect(findStalled(runs, now, 60).map((r) => r.id)).toEqual([1, 2])
  })
  it('ignora execução recente, concluída ou esperando o grupo de concorrência', () => {
    const runs = [
      run(1, 'in_progress', '2026-10-27T04:30:00Z'),
      run(2, 'completed', '2026-10-27T01:00:00Z'),
      run(3, 'pending', '2026-10-27T02:00:00Z'),
    ]
    expect(findStalled(runs, now, 60)).toEqual([])
  })
})

describe('formatStalled', () => {
  const stalled = [run(1, 'in_progress', '2026-10-27T02:59:25Z')]
  it('cancelada: diz há quanto tempo estava presa, desde quando e que foi cancelada', () => {
    const txt = formatStalled({ stalled, now, cancelled: [1] })
    expect(txt).toContain('*Ranking Ibi Aram*')
    expect(txt).toContain('presa há 2 h')
    expect(txt).toContain('desde 26/10 23:59')
    expect(txt).toContain('cancelada pelo vigia')
  })
  it('sem conseguir cancelar: avisa para cancelar manualmente', () => {
    expect(formatStalled({ stalled, now, cancelled: [] })).toContain('não consegui cancelar')
  })
})

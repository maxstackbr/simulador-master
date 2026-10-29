// Detecta execuções do sync presas e monta o aviso. Em 27/10/2026 um job ficou 24 h na fila sem
// runner, segurando o grupo de concorrência; como nenhum passo rodou, ninguém foi avisado.
// "pending" é a execução esperando o grupo atrás de outra: ela anda sozinha quando a presa sai.
const ACTIVE = ['queued', 'in_progress', 'requested', 'waiting']

export const findStalled = (runs, now, maxMinutes) =>
  runs.filter((r) => ACTIVE.includes(r.status) && (now - Date.parse(r.run_started_at)) / 60_000 > maxMinutes)

const when = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')

export function formatStalled({ stalled, now, cancelled }) {
  const L = stalled.map((r) => {
    const hours = Math.floor((now - Date.parse(r.run_started_at)) / 3_600_000)
    const age = hours >= 1 ? `${hours} h` : `${Math.floor((now - Date.parse(r.run_started_at)) / 60_000)} min`
    const fate = cancelled.includes(r.id)
      ? 'foi cancelada pelo vigia para liberar as próximas'
      : 'não consegui cancelar: cancele pelo link da execução'
    return `• presa há ${age} (desde ${when(r.run_started_at)}); ${fate}.`
  })
  return [
    '⚠️ *Ranking Ibi Aram*: a sincronização com o Letzplay travou no GitHub Actions.',
    '',
    ...L,
    '',
    'Enquanto ela estava presa, nenhuma leitura rodou. A próxima execução agendada lê de novo e avisa se algo mudou.',
  ].join('\n')
}

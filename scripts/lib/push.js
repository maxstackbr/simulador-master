// Monta a notificação push (ntfy) a partir do resumo do sync.
// A mensagem leva o texto pronto para o WhatsApp e um botão que abre o app com o texto preenchido;
// o WhatsApp não tem API oficial para grupos, então o último toque (escolher o grupo, enviar) é humano.
const TITLES = { changed: '✅ Ranking atualizado', error: '❌ Falha na leitura do ranking' }

export function buildPush({ status, summary, topic, runUrl = null, siteUrl = 'https://maxstack.com.br/ranking/' }) {
  const error = status !== 'changed'
  const whatsapp = `whatsapp://send?text=${encodeURIComponent(summary)}`
  const actions = error
    ? [{ action: 'view', label: 'Ver execução', url: runUrl ?? siteUrl, clear: true }]
    : [
        { action: 'view', label: 'Abrir no WhatsApp', url: whatsapp, clear: true },
        { action: 'copy', label: 'Copiar texto', value: summary },
      ]
  return {
    topic,
    title: TITLES[status] ?? TITLES.error,
    message: summary,
    tags: [error ? 'warning' : 'tennis'],
    priority: error ? 4 : 3,
    click: error ? (runUrl ?? siteUrl) : whatsapp,
    actions,
  }
}

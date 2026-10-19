// Monta a notificação push (ntfy) a partir do resumo do sync.
// A mensagem leva o texto pronto para o WhatsApp e um botão que abre o app com o texto preenchido;
// o WhatsApp não tem API oficial para grupos, então o último toque (escolher o grupo, enviar) é humano.
const TITLES = { changed: '✅ Ranking atualizado', test: '🧪 Teste de notificação', error: '❌ Falha na leitura do ranking' }
const TAGS = { changed: 'tennis', test: 'test_tube', error: 'warning' }

export function buildPush({ status, summary, topic, runUrl = null, siteUrl = 'https://maxstack.com.br/ranking/' }) {
  const kind = TITLES[status] ? status : 'error'
  const error = kind === 'error'
  const whatsapp = `whatsapp://send?text=${encodeURIComponent(summary)}`
  const actions = error
    ? [{ action: 'view', label: 'Ver execução', url: runUrl ?? siteUrl, clear: true }]
    : [
        { action: 'view', label: 'Abrir no WhatsApp', url: whatsapp, clear: true },
        { action: 'copy', label: 'Copiar texto', value: summary },
      ]
  return {
    topic,
    title: TITLES[kind],
    message: summary,
    tags: [TAGS[kind]],
    priority: error ? 4 : kind === 'test' ? 2 : 3,
    click: error ? (runUrl ?? siteUrl) : whatsapp,
    actions,
  }
}

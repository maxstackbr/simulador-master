// Monta a mensagem do Telegram (Bot API, sendMessage) a partir do resumo do sync.
// O resumo usa o *negrito* do WhatsApp; aqui vira HTML do Telegram. O botão inline só aceita http(s),
// por isso o "Abrir no WhatsApp" usa https://wa.me/?text= em vez de whatsapp://.
const TITLES = { changed: '✅ Ranking atualizado', test: '🧪 Teste de notificação', error: '❌ Falha na leitura do ranking' }

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

// *texto* (na mesma linha, sem espaço colado aos asteriscos) → <b>texto</b>
export const toTelegramHtml = (s) => esc(s).replace(/\*([^*\n\s](?:[^*\n]*[^*\n\s])?)\*/g, '<b>$1</b>')

// Token colado do Windows no WSL pode trazer \r ou espaço no fim, e a API responde 404.
export const cleanToken = (t) => (t ?? '').replace(/\s+/g, '')

export function buildTelegram({ status, summary, chatId, runUrl = null, siteUrl = 'https://maxstack.com.br/ranking/' }) {
  const kind = TITLES[status] ? status : 'error'
  const button = kind === 'error'
    ? { text: 'Ver execução', url: runUrl ?? siteUrl }
    : { text: 'Abrir no WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(summary)}` }
  return {
    chat_id: chatId,
    text: `<b>${TITLES[kind]}</b>\n\n${toTelegramHtml(summary)}`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[button]] },
  }
}

import { useEffect, useState } from 'react'

/** No celular, alterna entre a tabela (ranking) e a chave, que ficam empilhadas. */
export default function JumpButton() {
  const [onBracket, setOnBracket] = useState(false)

  useEffect(() => {
    const el = document.getElementById('chave')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setOnBracket(e.isIntersecting), { rootMargin: '-40% 0px -40% 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const go = () => document.getElementById(onBracket ? 'ranking' : 'chave')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <button type="button" className="jump" onClick={go}>
      {onBracket ? '↑ Ver ranking' : '↓ Ver chave'}
    </button>
  )
}

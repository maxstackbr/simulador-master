import { useEffect, useState } from 'react'

const current = () => document.documentElement.dataset.theme || 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(current)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F4F7FA' : '#0A1628')
  }, [theme])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem('theme', next)
    } catch {}
    setTheme(next)
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'light' ? 'Tema escuro' : 'Tema claro'}>
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M14 3a9 9 0 1 0 7 13.5A7.5 7.5 0 0 1 14 3z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
          <rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        </svg>
      )}
    </button>
  )
}

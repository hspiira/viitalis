import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const THEME_KEY = 'vitalis-theme'

export function ThemeToggler({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    const dark = stored !== 'light'
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem(THEME_KEY, 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem(THEME_KEY, 'light')
    }
  }

  const buttonClass =
    variant === 'compact'
      ? 'flex items-center justify-center rounded-md p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
      : 'flex items-center'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={buttonClass}
    >
      {variant === 'compact' ? (
        isDark ? (
          <Moon className="size-4" aria-hidden />
        ) : (
          <Sun className="size-4" aria-hidden />
        )
      ) : (
        <span className="relative inline-flex h-1.5 w-9 shrink-0 rounded-full bg-[var(--muted)]">
          <span
            className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full border border-[var(--border-subtle)] bg-[var(--secondary)] shadow transition-[left] duration-200 ${
              isDark ? 'left-5' : 'left-0.5'
            }`}
          >
            {isDark ? (
              <Moon className="absolute inset-0 m-auto size-2.5 text-[var(--foreground-active)]" aria-hidden />
            ) : (
              <Sun className="absolute inset-0 m-auto size-2.5 text-[var(--foreground-active)]" aria-hidden />
            )}
          </span>
        </span>
      )}
    </button>
  )
}

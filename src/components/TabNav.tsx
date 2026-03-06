import { useRef, useEffect, useCallback } from 'react'
import { Lock } from 'lucide-react'
import { sections } from '../data/sections'
import { Icon } from './Icons'
import { isFreeSection } from './LoginGate'

interface TabNavProps {
  activeTab: string
  onTabChange: (id: string) => void
  isAuthenticated?: boolean
}

export function TabNav({ activeTab, onTabChange, isAuthenticated = true }: TabNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active tab into view
  useEffect(() => {
    if (activeRef.current && navRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeTab])

  // Arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = sections.findIndex(s => s.id === activeTab)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (currentIndex + 1) % sections.length
      onTabChange(sections[next].id)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (currentIndex - 1 + sections.length) % sections.length
      onTabChange(sections[prev].id)
    }
  }, [activeTab, onTabChange])

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Seções do guia"
      onKeyDown={handleKeyDown}
      className="flex gap-1 overflow-x-auto sm:flex-wrap sm:justify-center scrollbar-hide snap-x snap-mandatory pb-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {sections.map((s, i) => {
        const isActive = activeTab === s.id
        const locked = !isAuthenticated && !isFreeSection(s.id)

        return (
          <button
            key={s.id}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            aria-controls="section-panel"
            tabIndex={isActive ? 0 : -1}
            id={`tab-${s.id}`}
            onClick={() => onTabChange(s.id)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border whitespace-nowrap snap-start min-w-[44px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg-accent)] focus-visible:ring-offset-1
              ${isActive
                ? 'bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border-[var(--border-accent)]'
                : 'bg-transparent text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-surface)] border-transparent'
              }
            `}
          >
            <Icon name={s.icon} size={14} className="shrink-0" />
            <span>{s.title}</span>
            {locked && <Lock className="w-3 h-3 shrink-0 opacity-50" />}
          </button>
        )
      })}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </nav>
  )
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SearchBar } from './components/SearchBar'
import { TabNav } from './components/TabNav'
import { LevelFilter } from './components/LevelFilter'
import { SectionContent } from './components/SectionContent'
import { Footer } from './components/Footer'
import { LoginGate, useAuth, isFreeSection } from './components/LoginGate'
import { OnboardingModal, shouldShowOnboarding } from './components/OnboardingModal'
import { LockedOverlay } from './components/LockedOverlay'
import { useTheme } from './hooks/useTheme'
import { useSearch } from './hooks/useSearch'
import { useProgress } from './hooks/useProgress'
import { useFavorites } from './hooks/useFavorites'
import { sections } from './data/sections'
import { Heart, X, Trash2 } from 'lucide-react'

function App() {
  const { theme, toggle } = useTheme()
  const { isAuthenticated, authenticate } = useAuth()
  const { query, setQuery, results, isFocused, handleFocus, handleBlur } = useSearch()
  const { getGlobalProgress } = useProgress()
  const globalProgress = getGlobalProgress()
  const [activeTab, setActiveTab] = useState('primeiros-passos')
  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null)
  const [levelFilter, setLevelFilter] = useState('todos')
  const [showGuide, setShowGuide] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const { favorites, removeFavorite, favoritesCount } = useFavorites()
  const heroRef = useRef<HTMLDivElement>(null)

  // Show onboarding after first login
  useEffect(() => {
    if (isAuthenticated && shouldShowOnboarding()) {
      setShowOnboarding(true)
    }
  }, [isAuthenticated])

  // Show guide content when user scrolls past the Hero section
  useEffect(() => {
    if (showGuide) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setShowGuide(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [showGuide])

  const handleStart = useCallback(() => {
    setShowGuide(true)
    setTimeout(() => {
      document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const handleTabChange = useCallback((sectionId: string) => {
    if (!isAuthenticated && !isFreeSection(sectionId)) {
      setActiveTab(sectionId)
      setShowGuide(true)
      return
    }
    setActiveTab(sectionId)
  }, [isAuthenticated])

  const handleSelectResult = useCallback((sectionId: string, cardIndex: number) => {
    if (!isAuthenticated && !isFreeSection(sectionId)) {
      setActiveTab(sectionId)
      setShowGuide(true)
      setTimeout(() => {
        document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return
    }
    setActiveTab(sectionId)
    setOpenCardIndex(cardIndex)
    setShowGuide(true)
    setTimeout(() => {
      document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [isAuthenticated])

  const handleRequestLogin = useCallback(() => {
    setShowLogin(true)
  }, [])

  const handleAuthenticated = useCallback(() => {
    authenticate()
    setShowLogin(false)
  }, [authenticate])

  // Full login gate: only when no free preview available (showLogin triggered)
  if (!isAuthenticated && showLogin) {
    return <LoginGate onAuthenticated={handleAuthenticated} />
  }

  const isLockedTab = !isAuthenticated && !isFreeSection(activeTab)

  return (
    <div className="relative z-10 min-h-screen">
      <Header theme={theme} onToggleTheme={toggle} />

      <main className="max-w-[840px] mx-auto px-4 sm:px-8 pt-14">
        <div ref={heroRef}>
          <Hero onStart={handleStart} />
        </div>

        <div id="guide-content" className={`transition-opacity duration-500 ${showGuide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Search */}
          <div className="mb-6">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelectResult={handleSelectResult}
              isFocused={isFocused}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Global Progress */}
          {isAuthenticated && globalProgress.viewed > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${globalProgress.percent}%`,
                      background: 'linear-gradient(90deg, var(--fg-accent), var(--fg-accent))',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--fg-muted)] whitespace-nowrap">
                  {globalProgress.viewed}/{globalProgress.total} cards
                </span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-4">
            <TabNav activeTab={activeTab} onTabChange={handleTabChange} isAuthenticated={isAuthenticated} />
          </div>

          {/* Level Filter + Favorites Button */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1">
              <LevelFilter active={levelFilter} onChange={setLevelFilter} />
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowFavorites(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all duration-200 hover:border-[var(--border-accent)] hover:text-[var(--fg-accent)]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-line)',
                  color: 'var(--fg-secondary)',
                }}
              >
                <Heart className="w-3.5 h-3.5" style={{ color: favoritesCount > 0 ? '#f43f5e' : undefined, fill: favoritesCount > 0 ? '#f43f5e' : 'none' }} />
                Favoritos
                {favoritesCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Section Content or Locked Overlay */}
          {isLockedTab ? (
            <LockedOverlay onRequestLogin={handleRequestLogin} />
          ) : (
            <SectionContent
              activeTab={activeTab}
              openCardIndex={openCardIndex}
              onCardToggle={setOpenCardIndex}
              levelFilter={levelFilter}
            />
          )}

          <Footer />
        </div>
      </main>

      {/* Favorites Panel */}
      {showFavorites && (
        <div
          className="fixed inset-0 z-[150] flex justify-end"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFavorites(false) }}
        >
          <div
            className="w-full max-w-sm h-full overflow-y-auto border-l"
            style={{
              background: 'var(--bg-page)',
              borderColor: 'var(--border-line)',
              animation: 'slideInRight 0.25s ease both',
            }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-line)' }}>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" style={{ color: '#f43f5e', fill: '#f43f5e' }} />
                <h2 className="text-sm font-bold text-[var(--fg-primary)]">Favoritos</h2>
                <span className="text-[10px] font-mono text-[var(--fg-muted)]">({favoritesCount})</span>
              </div>
              <button
                onClick={() => setShowFavorites(false)}
                className="p-1.5 rounded-lg cursor-pointer bg-transparent border-none transition-colors hover:bg-[var(--bg-surface)]"
                style={{ color: 'var(--fg-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg-muted)' }} />
                  <p className="text-sm text-[var(--fg-muted)]">Nenhum favorito salvo ainda</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-1 opacity-60">Clique no coração nos cards para salvar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by section */}
                  {sections.map(section => {
                    const sectionFavs = favorites.filter(f => f.sectionId === section.id)
                    if (sectionFavs.length === 0) return null
                    return (
                      <div key={section.id}>
                        <h3 className="text-[10px] font-mono font-bold text-[var(--fg-accent)] uppercase tracking-[0.08em] mb-2">
                          {section.title}
                        </h3>
                        <div className="space-y-1.5">
                          {sectionFavs.map(fav => (
                            <div
                              key={`${fav.sectionId}-${fav.cardIndex}`}
                              className="flex items-center gap-2 rounded-lg border p-2.5 transition-all duration-200 hover:border-[var(--border-accent)] group"
                              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-line)' }}
                            >
                              <button
                                onClick={() => {
                                  setActiveTab(fav.sectionId)
                                  setOpenCardIndex(fav.cardIndex)
                                  setShowGuide(true)
                                  setShowFavorites(false)
                                  setTimeout(() => {
                                    document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' })
                                  }, 100)
                                }}
                                className="flex-1 text-left cursor-pointer bg-transparent border-none p-0"
                              >
                                <span className="text-sm text-[var(--fg-primary)] font-medium">{fav.title}</span>
                              </button>
                              <button
                                onClick={() => removeFavorite(fav.sectionId, fav.cardIndex)}
                                className="shrink-0 p-1 rounded cursor-pointer bg-transparent border-none opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--fg-muted)' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}

export default App

import { useState, useRef, useEffect } from 'react'
import { Lock, AlertCircle, Eye, EyeOff, ArrowRight, MessageSquare } from 'lucide-react'

const ACCESS_KEY = '11632GPTchat'
const STORAGE_KEY = 'si-chatgpt-advogados-auth'

const FREE_SECTIONS = new Set(['primeiros-passos', 'ecossistema'])

export function isFreeSection(sectionId: string): boolean {
  return FREE_SECTIONS.has(sectionId)
}

// ChatGPT-inspired teal/green palette (distinct from Claude gold)
const TEAL = {
  primary: '#10a37f',
  light: '#34d399',
  dark: '#0d8c6d',
  glow: 'rgba(16, 163, 127, 0.25)',
  glowSoft: 'rgba(16, 163, 127, 0.12)',
  glowSubtle: 'rgba(16, 163, 127, 0.06)',
  particle: (opacity: number) => `rgba(52, 211, 153, ${opacity})`,
  shimmer: 'rgba(16, 163, 127, 0.3)',
  focusShadow: '0 0 20px rgba(16, 163, 127, 0.15), 0 0 40px rgba(16, 163, 127, 0.05)',
  buttonShadow: '0 0 30px rgba(16, 163, 127, 0.2), 0 4px 12px rgba(0,0,0,0.2)',
  cardFocusShadow: '0 0 60px rgba(16, 163, 127, 0.1), 0 8px 32px rgba(0,0,0,0.4)',
}

interface LoginGateProps {
  onAuthenticated: () => void
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const authenticate = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // sessionStorage indisponível
    }
    setIsAuthenticated(true)
  }

  return { isAuthenticated, authenticate }
}

/* Floating particles for ambient depth — teal variant */
function Particles() {
  const count = 24
  const particles = Array.from({ length: count }, (_, i) => {
    const size = 2 + Math.random() * 3
    const left = Math.random() * 100
    const delay = Math.random() * 8
    const duration = 6 + Math.random() * 10
    const opacity = 0.15 + Math.random() * 0.35
    return (
      <div
        key={i}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          bottom: '-5%',
          opacity: 0,
          background: TEAL.particle(opacity),
          animation: `particleRise ${duration}s ease-in-out ${delay}s infinite`,
        }}
      />
    )
  })
  return <>{particles}</>
}

/* ChatGPT-inspired circular logo with chat bubble */
function ChatLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="url(#tealGrad)"
        strokeWidth="4"
        fill="none"
      />
      {/* Inner ring */}
      <circle
        cx="50"
        cy="50"
        r="34"
        stroke="url(#tealGrad2)"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Chat bubble icon in center */}
      <path
        d="M38 36h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H50l-6 6v-6h-6a4 4 0 0 1-4-4V40a4 4 0 0 1 4-4z"
        fill="url(#tealGrad)"
        opacity="0.9"
      />
      {/* Three dots inside bubble */}
      <circle cx="44" cy="47" r="2" fill="#0f1419" />
      <circle cx="50" cy="47" r="2" fill="#0f1419" />
      <circle cx="56" cy="47" r="2" fill="#0f1419" />
      <defs>
        <linearGradient id="tealGrad" x1="6" y1="6" x2="94" y2="94">
          <stop offset="0%" stopColor={TEAL.light} />
          <stop offset="100%" stopColor={TEAL.primary} />
        </linearGradient>
        <linearGradient id="tealGrad2" x1="16" y1="16" x2="84" y2="84">
          <stop offset="0%" stopColor={TEAL.light} stopOpacity="0.5" />
          <stop offset="100%" stopColor={TEAL.primary} stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LoginGate({ onAuthenticated }: LoginGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ACCESS_KEY) {
      onAuthenticated()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      {/* Grid background overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(var(--grid-color) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-color) 1px, transparent 1px),
          linear-gradient(var(--grid-accent) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-accent) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px, 60px 60px, 300px 300px, 300px 300px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
      }} />

      {/* Animated ambient orbs — teal */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] animate-[orbFloat_14s_ease-in-out_infinite]" style={{
        background: `radial-gradient(circle, ${TEAL.glowSoft} 0%, transparent 70%)`,
      }} />
      <div className="absolute bottom-[-5%] left-[-10%] w-[450px] h-[450px] rounded-full pointer-events-none blur-[120px] animate-[orbFloat_14s_ease-in-out_infinite_-5s]" style={{
        background: `radial-gradient(circle, rgba(16,163,127,0.10) 0%, transparent 70%)`,
      }} />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none blur-[150px] animate-[orbFloat_18s_ease-in-out_infinite_-8s]" style={{
        background: `radial-gradient(circle, ${TEAL.glowSubtle} 0%, transparent 60%)`,
      }} />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <div
        className={`relative z-10 w-full max-w-[440px] ${shake ? 'animate-[shakeX_0.5s_ease]' : ''}`}
        style={{ animation: shake ? undefined : 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        {/* Branding section */}
        <div className="text-center mb-10" style={{ animation: 'fadeUp 0.8s ease 0.1s both' }}>

          {/* Chat logo with teal glow */}
          <div className="relative inline-flex items-center justify-center mb-7">
            {/* Glow behind logo */}
            <div className="absolute w-28 h-28 rounded-full blur-[40px]" style={{
              background: `radial-gradient(circle, ${TEAL.glow} 0%, transparent 70%)`,
              animation: 'loginPulse 4s ease-in-out infinite',
            }} />
            <ChatLogo className="relative w-20 h-20 sm:w-24 sm:h-24" />
          </div>

          {/* Label line */}
          <div className="flex items-center justify-center gap-2.5 mb-4" style={{ animation: 'fadeIn 1s ease 0.2s both' }}>
            <div className="w-8 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL.primary}, transparent)` }} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em]" style={{ color: TEAL.primary }}>
              Acesso Exclusivo
            </span>
            <div className="w-8 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL.primary}, transparent)` }} />
          </div>

          {/* Title with teal gradient */}
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.04em] leading-[1.1] text-[var(--fg-primary)]">
            ChatGPT para{' '}
            <span style={{
              background: `linear-gradient(135deg, ${TEAL.light}, ${TEAL.primary}, ${TEAL.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Advogados
            </span>
          </h1>

          <p className="text-sm text-[var(--fg-secondary)] mt-3 max-w-[320px] mx-auto leading-relaxed">
            Conteúdo reservado para membros do programa{' '}
            <span className="font-medium" style={{ color: TEAL.primary }}>Super Inteligênc[IA]</span>
          </p>
        </div>

        {/* Login card with glassmorphism */}
        <div
          className="relative rounded-2xl border overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: focused ? TEAL.primary : 'var(--border-line)',
            boxShadow: focused
              ? TEAL.cardFocusShadow
              : '0 8px 32px rgba(0,0,0,0.3)',
            transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            animation: 'fadeUp 0.8s ease 0.25s both',
          }}
        >
          {/* Shimmer top border — teal */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{
            background: `linear-gradient(90deg, transparent, ${TEAL.shimmer}, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s ease-in-out infinite',
          }} />

          <div className="p-7 sm:p-9">
            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulário de acesso">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--fg-secondary)] uppercase tracking-[0.08em] font-mono mb-2.5">
                  <Lock className="w-3.5 h-3.5" style={{ color: TEAL.primary }} />
                  Chave de Acesso
                </label>

                <div className="relative group">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false) }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Digite a chave de acesso"
                    className="w-full h-13 px-4 pr-12 rounded-xl border text-sm font-sans outline-none transition-all duration-300"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: error ? '#ef4444' : focused ? TEAL.primary : 'var(--border-line)',
                      color: 'var(--fg-primary)',
                      boxShadow: focused ? `${TEAL.focusShadow}, inset 0 1px 0 rgba(16,163,127,0.05)` : 'none',
                    }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none transition-colors duration-200"
                    style={{ color: 'var(--fg-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = TEAL.primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-muted)')}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Error message */}
                <div role="alert" aria-live="polite" className={`flex items-center gap-1.5 mt-2.5 transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-xs text-red-400 font-medium">Chave de acesso incorreta. Tente novamente.</span>
                </div>
              </div>

              <button
                type="submit"
                className="group/btn relative w-full h-13 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2.5 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${TEAL.primary}, ${TEAL.dark})`,
                  color: '#ffffff',
                  boxShadow: TEAL.buttonShadow,
                }}
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
                <span className="relative z-10 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Acessar Guia
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-7" style={{ animation: 'fadeIn 1s ease 0.6s both' }}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-5 h-px" style={{ background: 'var(--border-line)' }} />
            <span className="font-mono text-[9px] text-[var(--fg-muted)] uppercase tracking-[0.12em]">
              Super Inteligênc[IA]
            </span>
            <div className="w-5 h-px" style={{ background: 'var(--border-line)' }} />
          </div>
          <p className="text-[10px] text-[var(--fg-muted)]">
            Guia interativo para dominar o ecossistema ChatGPT na advocacia
          </p>
        </div>
      </div>
    </div>
  )
}

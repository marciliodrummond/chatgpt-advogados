import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Navigation, Lightbulb, X } from 'lucide-react'

const ONBOARDING_KEY = 'chatgpt-adv-onboarding-done'

interface Step {
  icon: typeof BookOpen
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: BookOpen,
    title: 'Bem-vindo ao Guia!',
    description: '12 seções, 95+ cards práticos, prompts prontos para copiar. Tudo o que você precisa para dominar o ChatGPT na advocacia.',
  },
  {
    icon: Navigation,
    title: 'Navegacao',
    description: 'Use as abas para navegar entre seções. Filtre por nível de experiência. Use a busca para encontrar qualquer tema.',
  },
  {
    icon: Lightbulb,
    title: 'Dica Pro',
    description: 'Cada prompt tem um botão "Abrir no ChatGPT" que abre diretamente no navegador. Explore, experimente!',
  },
]

interface OnboardingModalProps {
  onClose: () => void
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)

  const complete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
    onClose()
  }, [onClose])

  const goNext = useCallback(() => {
    if (animating) return
    if (currentStep === steps.length - 1) {
      complete()
      return
    }
    setDirection('next')
    setAnimating(true)
    setTimeout(() => {
      setCurrentStep(s => s + 1)
      setAnimating(false)
    }, 200)
  }, [currentStep, animating, complete])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') complete()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [complete])

  const step = steps[currentStep]
  const StepIcon = step.icon

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) complete() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-line)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Close button */}
        <button
          onClick={complete}
          className="absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer bg-transparent border-none transition-colors duration-200 hover:bg-[var(--bg-surface)]"
          style={{ color: 'var(--fg-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon circle */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-accent-subtle)', border: '2px solid var(--border-accent)' }}
            >
              <StepIcon className="w-7 h-7" style={{ color: 'var(--fg-accent)' }} />
            </div>
          </div>

          {/* Step content with transition */}
          <div
            key={currentStep}
            className="text-center"
            style={{
              animation: animating
                ? `slideOut${direction === 'next' ? 'Left' : 'Right'} 0.2s ease forwards`
                : 'slideInRight 0.25s ease both',
            }}
          >
            <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-3">
              {step.title}
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed max-w-[340px] mx-auto">
              {step.description}
            </p>
          </div>
        </div>

        {/* Footer: dots + buttons */}
        <div className="px-8 pb-8 pt-2 flex items-center justify-between">
          {/* Skip link */}
          <button
            onClick={complete}
            className="text-xs cursor-pointer bg-transparent border-none transition-colors duration-200 hover:text-[var(--fg-primary)]"
            style={{ color: 'var(--fg-muted)' }}
          >
            Pular
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 20 : 6,
                  height: 6,
                  background: i === currentStep ? 'var(--fg-accent)' : 'var(--border-line)',
                }}
              />
            ))}
          </div>

          {/* Next / Concluir button */}
          <button
            onClick={goNext}
            className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all duration-200 hover:opacity-90"
            style={{
              background: 'var(--fg-accent)',
              color: '#ffffff',
            }}
          >
            {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-30px); }
        }
      `}</style>
    </div>
  )
}

export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true'
  } catch {
    return false
  }
}

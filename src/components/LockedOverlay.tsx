import { Lock, ArrowRight } from 'lucide-react'

interface LockedOverlayProps {
  onRequestLogin: () => void
}

export function LockedOverlay({ onRequestLogin }: LockedOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Lock icon circle */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'var(--bg-accent-subtle)',
          border: '2px solid var(--border-accent)',
        }}
      >
        <Lock className="w-7 h-7" style={{ color: 'var(--fg-accent)' }} />
      </div>

      <h3 className="text-lg font-bold text-[var(--fg-primary)] mb-2">
        Conteúdo exclusivo
      </h3>

      <p className="text-sm text-[var(--fg-secondary)] mb-6 max-w-xs leading-relaxed">
        Acesse com sua chave para desbloquear todas as 12 seções do guia completo.
      </p>

      <button
        onClick={onRequestLogin}
        className="group flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all duration-200 hover:opacity-90"
        style={{
          background: 'var(--fg-accent)',
          color: '#ffffff',
        }}
      >
        <Lock className="w-4 h-4" />
        Inserir chave de acesso
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

import { useAppStore } from '../../store/appStore'
import { MACRO_KEYS, MACRO_LABELS } from '../../data/types'

export default function MacroFilterChips() {
  const visibleMacros = useAppStore((s) => s.visibleMacros)
  const toggleMacro = useAppStore((s) => s.toggleMacro)

  return (
    <div className="macro-chips">
      {MACRO_KEYS.map((macro) => (
        <button
          key={macro}
          className={`chip chip--${macro}` + (visibleMacros.has(macro) ? ' chip--active' : '')}
          onClick={() => toggleMacro(macro)}
        >
          {MACRO_LABELS[macro]}
        </button>
      ))}
    </div>
  )
}

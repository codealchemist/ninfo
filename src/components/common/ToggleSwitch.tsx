export interface ToggleControl {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}

/** A sliding two-or-more-way pill switch — both option labels stay visible, with an animated
 * thumb behind whichever one is active. */
export default function ToggleSwitch({ toggle, className }: { toggle: ToggleControl; className?: string }) {
  const count = toggle.options.length
  const activeIndex = Math.max(
    toggle.options.findIndex((opt) => opt.value === toggle.value),
    0
  )

  return (
    <div className={'bia-toggle' + (className ? ` ${className}` : '')}>
      <span
        className="bia-toggle-thumb"
        style={{ width: `calc((100% - 4px) / ${count})`, transform: `translateX(${activeIndex * 100}%)` }}
      />
      {toggle.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={'bia-toggle-option' + (toggle.value === opt.value ? ' bia-toggle-option--active' : '')}
          onClick={() => toggle.onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

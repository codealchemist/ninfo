import qrcode from 'qrcode-generator'

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

/**
 * Renders as plain black-on-white regardless of the app's theme — QR scanners rely on that
 * exact contrast, and inverting it for dark mode risks cameras that don't handle reversed
 * polarity. The surrounding modal supplies a white card so it never sits directly on a dark
 * background.
 */
export default function QrCode({ value, size = 220, className }: QrCodeProps) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()

  const count = qr.getModuleCount()
  const cell = size / count

  let modules = ''
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!qr.isDark(row, col)) continue
      modules += `M${col * cell},${row * cell}h${cell}v${cell}h${-cell}z`
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="QR code"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={modules} fill="#000000" />
    </svg>
  )
}

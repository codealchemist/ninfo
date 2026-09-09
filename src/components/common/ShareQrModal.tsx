import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, X } from 'lucide-react'
import QrCode from './QrCode'
import { copyTextToClipboard } from '../../utils/clipboard'

interface ShareQrModalProps {
  url: string
  onClose: () => void
}

export default function ShareQrModal({ url, onClose }: ShareQrModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return createPortal(
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button icon-button--ghost qr-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h3>Scan to open this spreadsheet</h3>
        <p className="hint">Point a phone camera at the code to open it directly in Ninfo.</p>
        <div className="qr-modal-code">
          <QrCode value={url} size={220} />
        </div>
        <div className="qr-modal-link">
          <span>{url}</span>
          <button className="icon-button icon-button--ghost" onClick={handleCopy} aria-label="Copy link" title="Copy link">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

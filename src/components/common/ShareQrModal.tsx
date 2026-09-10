import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Modal from './Modal'
import QrCode from './QrCode'
import { copyTextToClipboard } from '../../utils/clipboard'

interface ShareQrModalProps {
  url: string
  onClose: () => void
}

export default function ShareQrModal({ url, onClose }: ShareQrModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Modal onClose={onClose} className="qr-modal">
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
    </Modal>
  )
}

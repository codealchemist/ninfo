import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import Modal from './Modal'
import QrCode from './QrCode'
import { copyTextToClipboard } from '../../utils/clipboard'

interface ShareModalProps {
  url: string
  onClose: () => void
}

/** The one "Share" action: the link (with a copy button) and a QR code for the same link. */
export default function ShareModal({ url, onClose }: ShareModalProps) {
  const { t } = useTranslation()
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
      <h3>{t('shareModal.title')}</h3>
      <p className="hint">{t('shareModal.hint')}</p>
      <div className="qr-modal-code">
        <QrCode value={url} size={220} />
      </div>
      <div className="qr-modal-link">
        <span>{url}</span>
        <button className="qr-modal-copy" onClick={handleCopy} title={t('common.copyLink')}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('shareModal.copied') : t('shareModal.copy')}
        </button>
      </div>
    </Modal>
  )
}

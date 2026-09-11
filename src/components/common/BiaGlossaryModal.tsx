import { useTranslation } from 'react-i18next'
import Modal from './Modal'

const GLOSSARY_KEYS = ['peso', 'cgt', 'gv', 'mm', 'imc'] as const

interface BiaGlossaryModalProps {
  onClose: () => void
}

export default function BiaGlossaryModal({ onClose }: BiaGlossaryModalProps) {
  const { t } = useTranslation()

  return (
    <Modal onClose={onClose} className="bia-glossary-modal">
      <h3>{t('bia.glossaryTitle')}</h3>
      <dl className="bia-glossary-list">
        {GLOSSARY_KEYS.map((key) => (
          <div className="bia-glossary-item" key={key}>
            <dt>
              {t(`bia.glossary.${key}.term`)}{' '}
              <span className="bia-glossary-name">— {t(`bia.glossary.${key}.name`)}</span>
            </dt>
            <dd>{t(`bia.glossary.${key}.description`)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

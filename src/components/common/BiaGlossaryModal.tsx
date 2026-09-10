import Modal from './Modal'

const GLOSSARY: Array<{ term: string; name: string; description: string }> = [
  { term: 'Peso', name: 'Weight', description: 'Total body weight, in kilograms.' },
  {
    term: 'CGT',
    name: 'Grasa Corporal Total',
    description: 'Total body fat, as a percentage of body weight (with its kg equivalent alongside).',
  },
  {
    term: 'GV',
    name: 'Grasa Visceral',
    description: "Visceral fat rating — fat stored around internal organs, on the scale's own index. Lower is generally better.",
  },
  {
    term: 'MM%',
    name: 'Masa Muscular',
    description: 'Muscle mass, as a percentage of body weight (with its kg equivalent alongside).',
  },
  {
    term: 'IMC',
    name: 'Índice de Masa Corporal',
    description: 'Body Mass Index — weight relative to height². A general indicator, less accurate for very muscular builds.',
  },
]

interface BiaGlossaryModalProps {
  onClose: () => void
}

export default function BiaGlossaryModal({ onClose }: BiaGlossaryModalProps) {
  return (
    <Modal onClose={onClose} className="bia-glossary-modal">
      <h3>Bioimpedancia terms</h3>
      <dl className="bia-glossary-list">
        {GLOSSARY.map((g) => (
          <div className="bia-glossary-item" key={g.term}>
            <dt>
              {g.term} <span className="bia-glossary-name">— {g.name}</span>
            </dt>
            <dd>{g.description}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

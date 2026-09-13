import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { BioimpedanciaSource } from '../data/sources/BioimpedanciaSource'
import { PesoSource } from '../data/sources/PesoSource'
import { LiquidoSource } from '../data/sources/LiquidoSource'
import type { BiaEntry } from '../data/parsers/bioimpedanciaParser'
import type { WeightEntry } from '../data/parsers/pesoParser'
import type { LiquidEntry } from '../data/parsers/liquidoParser'
import GlobalReportDocument from '../components/report/GlobalReportDocument'

type Status = 'idle' | 'generating' | 'failed'

interface Snapshot {
  biaEntries: BiaEntry[]
  weightEntries: WeightEntry[]
  liquidEntries: LiquidEntry[]
  generatedAt: Date
}

export default function Report() {
  const { t } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [status, setStatus] = useState<Status>('idle')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const pageElRef = useRef<HTMLDivElement | null>(null)

  const spreadsheetId = sheetLinkId
    ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
    : null

  // BIA/Weight/Liquid only exist for sheet-link mode (see NutritionSource capabilities) — in
  // demo/upload mode these quietly resolve to empty lists, so the report still generates with
  // just the meal-based sections instead of failing outright.
  const handleGenerate = async () => {
    setStatus('generating')
    try {
      const [biaEntries, weightEntries, liquidEntries] = await Promise.all([
        spreadsheetId ? new BioimpedanciaSource(spreadsheetId).load().catch(() => []) : Promise.resolve([]),
        spreadsheetId ? new PesoSource(spreadsheetId).load().catch(() => []) : Promise.resolve([]),
        spreadsheetId ? new LiquidoSource(spreadsheetId).load().catch(() => []) : Promise.resolve([]),
      ])
      setSnapshot({ biaEntries, weightEntries, liquidEntries, generatedAt: new Date() })

      // Let the off-screen document actually mount and paint before rasterizing it — a state
      // update here doesn't take effect until React's next render, so a couple of animation
      // frames guarantee the DOM (and its layout) is ready by the time we read from it.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      if (!pageElRef.current) throw new Error('Report page did not render')

      const fileName = `ninfo-report-${new Date().toISOString().slice(0, 10)}.pdf`
      // jsPDF pulls in a sizable html2canvas/dompurify dependency chain it doesn't strictly
      // need here (only its core PDF assembly is used) — dynamic import keeps that weight out
      // of the main bundle for everyone who never generates a report.
      const { generatePdfFromPages } = await import('../utils/pdfReport')
      await generatePdfFromPages([pageElRef.current], fileName)
      setStatus('idle')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>{t('report.title')}</h2>
        <p className="hint">{t('report.description')}</p>
        <button className="link-button" onClick={handleGenerate} disabled={status === 'generating'}>
          {status === 'generating' ? <LoaderCircle size={14} className="spin" /> : <FileDown size={14} />}
          <span>{status === 'generating' ? t('report.generating') : t('report.generateButton')}</span>
        </button>
        {status === 'failed' && (
          <p className="hint bia-error">
            <TriangleAlert size={14} /> {t('report.generateFailed')}
          </p>
        )}
      </section>

      <div className="day-summary-share-offscreen" aria-hidden="true">
        {snapshot && (
          <GlobalReportDocument
            meals={meals}
            goalsByDate={goalsByDate}
            biaEntries={snapshot.biaEntries}
            weightEntries={snapshot.weightEntries}
            liquidEntries={snapshot.liquidEntries}
            generatedAt={snapshot.generatedAt}
            pageRef={(el) => {
              pageElRef.current = el
            }}
          />
        )}
      </div>
    </div>
  )
}

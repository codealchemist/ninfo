import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { REPORT_PAGE_HEIGHT_PX, REPORT_PAGE_WIDTH_PX } from './reportPageSize'

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297

/**
 * Rasterizes each already-laid-out report page (see GlobalReportDocument) to a PNG and stacks
 * them into a single multi-page PDF, then triggers a browser download. Pages are plain,
 * fixed-size, print-styled DOM nodes with literal colors (not CSS variables) so the export
 * looks the same regardless of the viewer's live light/dark theme.
 */
export async function generatePdfFromPages(pages: HTMLElement[], fileName: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  for (let i = 0; i < pages.length; i++) {
    const dataUrl = await toPng(pages[i], {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: REPORT_PAGE_WIDTH_PX,
      height: REPORT_PAGE_HEIGHT_PX,
    })
    if (i > 0) doc.addPage()
    doc.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
  }

  doc.save(fileName)
}

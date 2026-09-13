// A4 at 96dpi, portrait — shared by GlobalReportDocument (which lays out each page at this
// exact pixel size) and pdfReport.ts (which rasterizes them at this size before adding them to
// the PDF). Kept dependency-free so importing it doesn't pull in jsPDF just to read a constant.
export const REPORT_PAGE_WIDTH_PX = 794
export const REPORT_PAGE_HEIGHT_PX = 1123

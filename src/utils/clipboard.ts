import { toBlob } from 'html-to-image'

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'fill',
  'stroke',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
] as const

function toKebabCase(camel: string): string {
  return camel.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

function isMeaningfulColor(value: string): boolean {
  return !!value && value !== 'none' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)'
}

/**
 * html-to-image clones a subtree and re-renders it in an isolated context to rasterize it.
 * That process doesn't reliably carry CSS custom properties (var(--text), etc.) through for
 * every property — SVG fill/stroke in particular can come out stuck at a stale/default value
 * even when the rest of the label correctly reflects the live theme. The robust fix is to
 * "bake" every element's already-resolved, theme-correct computed colors as literal inline
 * styles directly on itself right before the snapshot, so there's nothing left for the
 * export to misresolve — it's reading colors already known to be correct on screen, not
 * re-deriving them from a variable the clone might not see.
 *
 * Restoration snapshots each element's whole `style` attribute up front, rather than trying
 * to save/restore individual longhand properties — some elements here (e.g. the fat-quality
 * legend swatches) set their color via a shorthand like `background`, and selectively writing
 * then removing just the `background-color` longhand corrupts that shorthand's internal state,
 * permanently losing the color since React never re-applies an inline style whose prop value
 * hasn't changed. Restoring the exact original attribute string sidesteps that entirely.
 */
function bakeComputedColors(root: HTMLElement): () => void {
  const elements: Element[] = [root, ...Array.from(root.querySelectorAll('*'))]
  const snapshots: Array<{ el: HTMLElement | SVGElement; styleAttr: string | null }> = []

  for (const el of elements) {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue
    snapshots.push({ el, styleAttr: el.getAttribute('style') })

    const computed = getComputedStyle(el)
    for (const prop of COLOR_PROPERTIES) {
      const cssName = toKebabCase(prop)
      const value = computed.getPropertyValue(cssName) || (computed as any)[prop]
      if (!isMeaningfulColor(value)) continue
      el.style.setProperty(cssName, value)
    }
  }

  return () => {
    for (let i = snapshots.length - 1; i >= 0; i--) {
      const { el, styleAttr } = snapshots[i]
      if (styleAttr === null) el.removeAttribute('style')
      else el.setAttribute('style', styleAttr)
    }
  }
}

/**
 * The label scrolls internally on screen (`overflow-y: auto`) so a tall meal doesn't blow out
 * the fixed card height. Capturing it as-is rasterizes that live scrollbar as a static artifact
 * in the image. Since we want the *whole* label in the export regardless of what's currently
 * scrolled into view, expand the element to its full natural (scrollHeight) size with
 * `overflow: visible` right before the snapshot — nothing left to scroll, nothing to draw a
 * scrollbar for — then restore the live layout immediately after.
 */
function expandToNaturalSize(element: HTMLElement): { width: number; height: number; restore: () => void } {
  const width = element.scrollWidth
  const height = element.scrollHeight
  const previous = {
    overflow: element.style.overflow,
    height: element.style.height,
    width: element.style.width,
  }

  element.style.overflow = 'visible'
  element.style.height = `${height}px`
  element.style.width = `${width}px`

  return {
    width,
    height,
    restore: () => {
      element.style.overflow = previous.overflow
      element.style.height = previous.height
      element.style.width = previous.width
    },
  }
}

function findAncestorBackground(element: HTMLElement): string {
  let el: HTMLElement | null = element
  while (el) {
    const bg = getComputedStyle(el).backgroundColor
    if (isMeaningfulColor(bg)) return bg
    el = el.parentElement
  }
  return getComputedStyle(document.body).backgroundColor
}

/**
 * Renders a DOM node to a PNG and copies it to the clipboard as an image, so it can be
 * pasted into chat apps, notes, etc. Falls back to triggering a file download when the
 * Clipboard API's image support isn't available (older Safari/Firefox).
 */
export async function copyElementAsImage(element: HTMLElement): Promise<boolean> {
  // The label content itself has no background of its own — it sits on its card's surface
  // color, set further up the tree — so walk up to find the actual visible background
  // rather than falling back to the page background, which is a different (darker/lighter)
  // shade of the same theme.
  const background = findAncestorBackground(element)
  const previousBackground = element.style.backgroundColor

  const restoreColors = bakeComputedColors(element)
  const { width, height, restore: restoreSize } = expandToNaturalSize(element)
  element.style.backgroundColor = background

  try {
    const blob = await toBlob(element, { pixelRatio: 2, backgroundColor: background, width, height })
    if (!blob) return false

    if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return true
    }

    downloadBlob(blob, 'nutrition-label.png')
    return true
  } catch {
    return false
  } finally {
    restoreColors()
    restoreSize()
    element.style.backgroundColor = previousBackground
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

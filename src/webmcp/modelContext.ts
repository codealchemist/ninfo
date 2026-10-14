/**
 * Minimal WebMCP typings + registration (see docs/webmcp-best-practices.md). Typed locally rather
 * than via the `webmcp-types` package since we only touch registerTool — keep this in step with
 * the spec if it changes. Everything here is progressive enhancement: with no modelContext the
 * app behaves exactly as before.
 */

export interface JsonSchema {
  type: string
  description?: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
  enum?: (string | number)[]
  maxLength?: number
  maxItems?: number
}

export interface ToolAnnotations {
  readOnlyHint?: boolean
  untrustedContentHint?: boolean
  consequentialHint?: boolean
}

export interface WebMcpTool {
  name: string
  title?: string
  description: string
  inputSchema: JsonSchema
  execute: (input: Record<string, unknown>, context: { signal?: AbortSignal }) => Promise<unknown>
  annotations?: ToolAnnotations
}

interface ModelContext {
  registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => Promise<undefined>
}

/** document.modelContext is current; navigator.modelContext is a deprecated alias in older builds. */
export function getModelContext(): ModelContext | null {
  const doc = document as Document & { modelContext?: ModelContext }
  const nav = navigator as Navigator & { modelContext?: ModelContext }
  const ctx = doc.modelContext ?? nav.modelContext
  return ctx && typeof ctx.registerTool === 'function' ? ctx : null
}

export interface RegistrationResult {
  supported: boolean
  registered: string[]
  error: string | null
}

/**
 * Registers every tool under one AbortController — aborting it unregisters them all. Reports
 * what happened instead of throwing, and never leaves a half-registered set behind.
 */
export async function registerTools(
  tools: WebMcpTool[],
  controller: AbortController
): Promise<RegistrationResult> {
  const ctx = getModelContext()
  if (!ctx) return { supported: false, registered: [], error: null }
  try {
    for (const tool of tools) await ctx.registerTool(tool, { signal: controller.signal })
    return { supported: true, registered: tools.map((t) => t.name), error: null }
  } catch (error) {
    controller.abort()
    return { supported: true, registered: [], error: (error as Error).message }
  }
}

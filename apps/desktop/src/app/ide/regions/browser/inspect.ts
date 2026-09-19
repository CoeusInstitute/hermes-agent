// Element inspection for the IDE browser pane: an in-page picker that resolves
// with the element under the first click (or null on Escape), plus the message
// text handed to the chat. The script is injected into the guest page through
// the <webview> and returns a JSON-safe payload — no host-side DOM access
// needed, and nothing is exposed to the page itself.

export interface PickedElement {
  html: string
  selector: string
}

export const MAX_PICKED_HTML = 2000

/**
 * In-page picker: hover outlines the element under the cursor, the first click
 * captures it, Escape cancels. Deterministic and single-shot — the promise
 * always settles, so the caller's "picking" state cannot strand.
 */
export const PICKER_SCRIPT = `new Promise(function (resolve) {
  var last = null
  var box = document.createElement('div')
  box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #3b82f6;background:rgba(59,130,246,0.12);border-radius:2px'
  document.documentElement.appendChild(box)

  function selectorFor(el) {
    var parts = []
    var node = el
    while (node && node.nodeType === 1 && parts.length < 6) {
      var part = node.tagName.toLowerCase()
      if (node.id) {
        parts.unshift(part + '#' + node.id)
        break
      }
      var parent = node.parentElement
      if (parent) {
        var sameTag = []
        for (var i = 0; i < parent.children.length; i += 1) {
          if (parent.children[i].tagName === node.tagName) sameTag.push(parent.children[i])
        }
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')'
      }
      parts.unshift(part)
      node = parent
      if (!node || node.tagName === 'HTML') break
    }
    return parts.join(' > ')
  }

  function cleanup() {
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKey, true)
    if (box.parentNode) box.parentNode.removeChild(box)
    document.documentElement.style.cursor = ''
  }

  function onMove(event) {
    last = document.elementFromPoint(event.clientX, event.clientY)
    if (!last) return
    var rect = last.getBoundingClientRect()
    box.style.left = rect.left + 'px'
    box.style.top = rect.top + 'px'
    box.style.width = rect.width + 'px'
    box.style.height = rect.height + 'px'
  }

  function onClick(event) {
    event.preventDefault()
    event.stopPropagation()
    var el = last
    cleanup()
    var payload = el ? { html: el.outerHTML, selector: selectorFor(el) } : null
    resolve(payload)
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      cleanup()
      resolve(null)
    }
  }

  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey, true)
  document.documentElement.style.cursor = 'crosshair'
})`

/** The composer text an inspected element contributes. */
export function formatPickedElement(picked: PickedElement, pageUrl: string): string {
  const html =
    picked.html.length > MAX_PICKED_HTML ? `${picked.html.slice(0, MAX_PICKED_HTML)}\n… (truncated)` : picked.html

  return `Element from ${pageUrl}\n\nSelector: ${picked.selector}\n\n\`\`\`html\n${html}\n\`\`\``
}

/** Validate the guest page's return value before trusting it. */
export function parsePickedPayload(value: unknown): null | PickedElement {
  if (!value || typeof value !== 'object') {
    return null
  }

  const { html, selector } = value as { html?: unknown; selector?: unknown }

  if (typeof html !== 'string' || typeof selector !== 'string') {
    return null
  }

  return { html, selector }
}

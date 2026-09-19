import { describe, expect, it } from 'vitest'

import { formatPickedElement, MAX_PICKED_HTML, parsePickedPayload } from './inspect'

describe('formatPickedElement', () => {
  it('builds the chat payload with the selector, html fence, and page url', () => {
    const text = formatPickedElement({ html: '<button id="save">Save</button>', selector: 'button#save' }, 'https://app.test/x')

    expect(text).toContain('Element from https://app.test/x')
    expect(text).toContain('Selector: button#save')
    expect(text).toContain('```html\n<button id="save">Save</button>\n```')
  })

  it('truncates very large elements', () => {
    const text = formatPickedElement({ html: 'a'.repeat(MAX_PICKED_HTML + 50), selector: 'div' }, 'https://app.test')

    expect(text).toContain('… (truncated)')
    expect(text.length).toBeLessThan(MAX_PICKED_HTML + 200)
  })
})

describe('parsePickedPayload', () => {
  it('accepts the picker payload', () => {
    expect(parsePickedPayload({ html: '<a/>', selector: 'a' })).toEqual({ html: '<a/>', selector: 'a' })
  })

  it('rejects cancelled and malformed payloads', () => {
    expect(parsePickedPayload(null)).toBe(null)
    expect(parsePickedPayload(undefined)).toBe(null)
    expect(parsePickedPayload('nope')).toBe(null)
    expect(parsePickedPayload({ html: 1, selector: 'a' })).toBe(null)
    expect(parsePickedPayload({ html: '<a/>' })).toBe(null)
  })
})

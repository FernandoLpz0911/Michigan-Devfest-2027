import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import FileSteps from './FileSteps.jsx'

const steps = [
  { step: 'header', state: 'done', title: 'Found the header', detail: '' },
  { step: 'granite', state: 'current', title: 'Asked IBM Granite', detail: '' },
  { step: 'cleaning', state: 'waiting', title: 'Cleaned the values', detail: '' },
  { step: 'records', state: 'waiting', title: 'Built the records', detail: '' },
]

describe('FileSteps', () => {
  it('shows the four steps in order with their states', () => {
    const html = renderToStaticMarkup(<FileSteps steps={steps} />)
    const order = ['Header', 'Granite', 'Cleaning', 'Records'].map((n) => html.indexOf(n))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(html).toContain('step-done')
    expect(html).toContain('step-current')
    expect(html).toContain('step-waiting')
  })

  it('shows Granite as not needed for a recognized file', () => {
    const recognized = steps.map((s) =>
      s.step === 'granite' ? { ...s, state: 'not_needed' } : s,
    )
    const html = renderToStaticMarkup(<FileSteps steps={recognized} />)
    expect(html).toContain('step-not-needed')
    expect(html).toContain('Granite, not needed')
  })
})

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TimeSavedLine from './TimeSavedLine.jsx'

describe('TimeSavedLine', () => {
  it('shows only the tool time when hand time is empty', () => {
    const html = renderToStaticMarkup(<TimeSavedLine toolSeconds={41} handTimeMinutes={null} />)
    expect(html).toContain('41 s')
    expect(html).not.toContain('by hand')
  })

  it('shows tool time and hand time when both are set', () => {
    const html = renderToStaticMarkup(<TimeSavedLine toolSeconds={41} handTimeMinutes={22} />)
    expect(html).toContain('41 s')
    expect(html).toContain('22 min')
    expect(html).toContain('by hand')
  })
})

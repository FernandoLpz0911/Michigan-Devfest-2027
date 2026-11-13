import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import SwitchCell, { FadeCell } from './SwitchCell.jsx'

describe('SwitchCell', () => {
  it('unchanged cells are plain text with no animation', () => {
    const { container } = render(<SwitchCell raw="A" clean="A" cleaned play index={2} />)
    expect(container.querySelector('.sw-play')).toBeNull()
    expect(container.textContent).toBe('A')
  })
  it('changed cell shows new value with old struck through, staggered by column', () => {
    const { container } = render(<SwitchCell raw="lot7" clean="LOT-7" cleaned play index={3} />)
    expect(container.querySelector('.sw-new').textContent).toBe('LOT-7')
    expect(container.querySelector('s').textContent).toContain('lot7')
    expect(container.querySelector('.sw-play').style.getPropertyValue('--col')).toBe('3')
  })
  it('does not animate before the first flip', () => {
    const { container } = render(<SwitchCell raw="a" clean="b" cleaned index={0} />)
    expect(container.querySelector('.sw-play')).toBeNull()
  })
  it('FadeCell passes through when not playing', () => {
    const { container } = render(<FadeCell play={false} index={1}>x</FadeCell>)
    expect(container.querySelector('.sw-play')).toBeNull()
  })
  it('css turns animation off for reduced motion', () => {
    const css = readFileSync('src/parts/SwitchCell.css', 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
  })
})

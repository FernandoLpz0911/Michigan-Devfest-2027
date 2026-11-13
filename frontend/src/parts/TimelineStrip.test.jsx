import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { test, expect } from 'vitest'
import canned from '../../../fixtures/canned/timeline.json'
import TimelineStrip from './TimelineStrip.jsx'

const num = (el, k) => parseFloat(el.style[k])

test('blocks sit at real times; outlined only worth-checking; other kept in list only; no axe violations', async () => {
  const { container } = render(<TimelineStrip timeline={canned} />)
  const a = screen.getByTestId('block-4411'), b = screen.getByTestId('block-4412')
  // 4411 ends exactly where 4412 starts, widths follow time
  expect(num(a, 'left') + num(a, 'width')).toBeCloseTo(num(b, 'left'), 3)
  expect(num(a, 'width')).toBeCloseTo((117 / (13 * 60)) * 100, 1) // 08:00..21:00 axis
  expect(screen.getByTestId('block-4417').style.background).toMatch(/22|rgb/)
  expect(screen.queryByTestId('block-4407')).toBeNull()
  expect(screen.getByText(/Lot 4407: 08:20 to 10:14/)).toBeTruthy()
  expect(screen.getAllByText(/stop 28/).length).toBeGreaterThan(0)
  expect((await axe(container)).violations).toHaveLength(0)
})

test('a short lot still has a readable label', () => {
  const t = { lot: '1', machine: 'Press 3', day: '2021-05-04',
    lots: [{ lot: '1', start: '2021-05-04T10:00', end: '2021-05-04T10:10', role: 'this' },
           { lot: '2', start: '2021-05-04T10:10', end: '2021-05-04T12:00', role: 'worth_checking' }], stops: [] }
  render(<TimelineStrip timeline={t} />)
  const label = screen.getByTestId('block-1').querySelector('span')
  expect(label.textContent).toBe('1')
  expect(label.style.whiteSpace).toBe('nowrap')
  expect(label.style.color).not.toBe('rgb(255, 255, 255)')
})

test('lot alone on its machine shows just that lot', async () => {
  const t = { lot: '1', machine: 'Press 3', day: '2021-05-04',
    lots: [{ lot: '1', start: '2021-05-04T10:00', end: '2021-05-04T12:00', role: 'this' }], stops: [] }
  const { container } = render(<TimelineStrip timeline={t} />)
  expect(container.querySelectorAll('[data-testid^="block-"]')).toHaveLength(1)
  expect((await axe(container)).violations).toHaveLength(0)
})

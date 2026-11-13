import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import canned from '../../../fixtures/canned/file_view.json'
import SeeFile from './SeeFile.jsx'

vi.mock('../api.js', () => ({ api: { fileView: vi.fn(() => Promise.resolve(canned)) } }))

async function open(go = vi.fn()) {
  const out = render(<SeeFile go={go} params={{ fileId: 'f1' }} />)
  await screen.findByRole('heading', { name: 'shift1_log.csv' })
  return { ...out, go }
}

describe('SeeFile', () => {
  it('greys skipped rows with their reason', async () => {
    await open()
    expect(screen.getAllByText(/skipped: title row/).length).toBe(2)
    expect(screen.getByText(/skipped: blank row/)).toBeTruthy()
  })

  it('shows one tag per column, dashed for extra detail', async () => {
    const { container } = await open()
    expect(container.querySelectorAll('.seefile-tag').length).toBe(canned.columns.length)
    expect(container.querySelectorAll('.seefile-tag-extra').length).toBe(2)
  })

  it('shows only the lines it was given (50 at most)', async () => {
    const { container } = await open()
    expect(container.querySelectorAll('tbody tr').length).toBeLessThanOrEqual(51)
  })

  it('flips raw and cleaned with the old value struck through', async () => {
    const { container } = await open()
    expect(container.querySelectorAll('s').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('tab', { name: 'Your file' }))
    expect(container.querySelectorAll('s').length).toBe(0)
    expect(screen.getAllByText('5/3/21 6:01a').length).toBeGreaterThan(0)
  })

  it('shows the summary and Change on header click', async () => {
    const { go } = await open()
    expect(screen.queryByRole('link', { name: 'Change' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Mach' }))
    expect(screen.getByRole('status').textContent).toMatch(/Mach became Machine/)
    expect(screen.getByRole('status').textContent).toMatch(/15 rows/)
    await userEvent.click(screen.getByRole('link', { name: 'Change' }))
    expect(go).toHaveBeenCalledWith('check', { fileId: 'f1' })
  })

  it('shows held rows with the reason', async () => {
    await open()
    expect(screen.getAllByText(/held back: No lot number/i).length).toBeGreaterThan(0)
  })

  it('reaches the switch and every header by keyboard', async () => {
    await open()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(canned.columns.length)
    buttons.forEach((b) => expect(b.tabIndex).toBeGreaterThanOrEqual(0))
    expect(within(screen.getByRole('tablist')).getAllByRole('tab').length).toBe(2)
  })

  it('has no accessibility violations', async () => {
    const { container } = await open()
    expect((await axe(container)).violations).toEqual([])
  })
})

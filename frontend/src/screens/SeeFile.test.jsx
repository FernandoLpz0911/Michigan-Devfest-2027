import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import canned from '../../../fixtures/canned/file_view.json'
import SeeFile from './SeeFile.jsx'

vi.mock('../api.js', () => ({
  api: {
    fileView: vi.fn(() => Promise.resolve(canned)),
    downloadUrl: vi.fn((id, o) => `/dl/${id}?${new URLSearchParams(Object.entries(o).filter(([, v]) => v !== false))}`),
  },
}))
import { api } from '../api.js'

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
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Mach' }))
    expect(screen.getByRole('status').textContent).toMatch(/Mach became Machine/)
    expect(screen.getByRole('status').textContent).toMatch(/15 rows/)
    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(go).toHaveBeenCalledWith('check', { fileId: 'f1' })
  })

  it('sums up held rows in one line and Show them filters to them', async () => {
    await open()
    const n = canned.rows.filter((r) => r.kind === 'held').length
    expect(screen.getByText(new RegExp(`${n} ${n === 1 ? 'row' : 'rows'} held back: ${n} No lot number`))).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Show them' }))
    expect(api.fileView).toHaveBeenLastCalledWith('f1', { kind: 'held' })
    expect(await screen.findByRole('button', { name: 'Show all rows' })).toBeTruthy()
  })

  it('shows held rows with the reason', async () => {
    await open()
    expect(screen.getAllByText(/held back: No lot number/i).length).toBeGreaterThan(0)
  })

  it('reaches the switch and every header by keyboard', async () => {
    await open()
    const buttons = within(screen.getAllByRole('columnheader')[0].closest('tr')).getAllByRole('button')
    expect(buttons.length).toBe(canned.columns.length)
    buttons.forEach((b) => expect(b.tabIndex).toBeGreaterThanOrEqual(0))
    expect(within(screen.getByRole('tablist')).getAllByRole('tab').length).toBe(2)
  })

  it('has no accessibility violations', async () => {
    const { container } = await open()
    expect((await axe(container)).violations).toEqual([])
  })

  it('opens in the Cleaned view with changed cells marked, both values shown', async () => {
    const { container } = await open()
    expect(screen.getByRole('tab', { name: 'Cleaned' }).getAttribute('aria-selected')).toBe('true')
    const cell = container.querySelector('td.seefile-changed')
    expect(cell.querySelector('s').textContent).toMatch(/\S/)
    expect(cell.querySelector('.sw-new').textContent).toMatch(/\S/)
  })

  it('shows no strikethrough in unchanged cells', async () => {
    const { container } = await open()
    const plain = [...container.querySelectorAll('tbody td:not(.seefile-changed)')]
    expect(plain.some((td) => td.querySelector('s'))).toBe(false)
  })

  it('shows the summary bar and leaves out zero counts', async () => {
    await open()
    const bar = screen.getByRole('list', { name: 'What cleaning did' }).textContent
    expect(bar).toMatch(/Times written one way: 82 rows/)
    expect(bar).toMatch(/Machine names made the same: 15 rows/)
    expect(bar).toMatch(/Title and blank rows skipped: 3 \(in the first/)
    expect(bar).toMatch(/Held back for you to check: 1/)
    expect(bar).not.toMatch(/Operator|: 0/)
  })

  it('searches after a pause and shows how many rows match', async () => {
    await open()
    api.fileView.mockClear()
    api.fileView.mockResolvedValueOnce({ ...canned, matching: 7 })
    await userEvent.type(screen.getByRole('searchbox'), '4384')
    await screen.findByText('7 rows match')
    expect(api.fileView).toHaveBeenLastCalledWith('f1', { q: '4384' })
    expect(api.fileView.mock.calls.length).toBe(1)
  })

  it('the Show dropdown asks for saved or held rows', async () => {
    await open()
    await userEvent.selectOptions(screen.getByLabelText('Show'), 'Held back')
    expect(api.fileView).toHaveBeenLastCalledWith('f1', { kind: 'held' })
    await userEvent.selectOptions(screen.getByLabelText('Show'), 'Saved rows')
    expect(api.fileView).toHaveBeenLastCalledWith('f1', { kind: 'entry' })
  })

  it('clicking a cell with a column picked filters, and the x clears it', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Mach' }))
    const cell = document.querySelector('tbody tr:not(.seefile-header):not(.seefile-skipped):not(.seefile-tags) td:nth-child(4)')
    await userEvent.click(cell)
    expect(screen.getByText(/Only rows where Qty is 5699/)).toBeTruthy()
    expect(api.fileView.mock.lastCall[1]).toMatchObject({ column: 2, value: '5699' })
    await userEvent.click(screen.getByRole('button', { name: 'Clear this filter' }))
    expect(screen.queryByText(/Only rows where/)).toBeNull()
  })

  it('the download window builds the link from its choices', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    const link = () => screen.getByRole('link', { name: 'Download' }).getAttribute('href')
    expect(link()).toBe('/dl/f1?version=cleaned&format=csv&dates=iso')
    await userEvent.click(screen.getByLabelText('Excel'))
    await userEvent.click(screen.getByLabelText('05/03/2021 6:01 AM'))
    await userEvent.click(screen.getByLabelText('Include held-back rows'))
    expect(link()).toBe('/dl/f1?version=cleaned&format=xlsx&dates=us&held=true')
    expect(screen.queryByLabelText('Only the rows that match your filter')).toBeNull()
  })

  it('the original version disables the other choices', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    await userEvent.click(screen.getByLabelText('Your original file'))
    expect(screen.getByLabelText('Excel').disabled).toBe(true)
    expect(screen.getByLabelText('Include held-back rows').disabled).toBe(true)
    expect(screen.getByRole('link', { name: 'Download' }).getAttribute('href')).toBe('/dl/f1?version=original')
  })

  it('offers the filter checkbox only when a filter is set', async () => {
    await open()
    await userEvent.selectOptions(screen.getByLabelText('Show'), 'Held back')
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(screen.getByLabelText('Only the rows that match your filter').checked).toBe(true)
    expect(screen.getByRole('link', { name: 'Download' }).getAttribute('href')).toMatch(/kind=held/)
    await userEvent.click(screen.getByLabelText('Only the rows that match your filter'))
    expect(screen.getByRole('link', { name: 'Download' }).getAttribute('href')).not.toMatch(/kind=held/)
  })

  it('shows machine-clock seconds in an extra column as a readable time', async () => {
    const view = structuredClone(canned)
    const i = view.columns.findIndex((c) => c.field === 'extra')
    view.rows.forEach((r) => {
      if (r.kind === 'entry' || r.kind === 'held') { r.raw[i] = '1620000658.677'; if (r.clean) r.clean[i] = null }
    })
    api.fileView.mockImplementation(() => Promise.resolve(view))
    const { container } = await open()
    expect(screen.getByText('Extra detail: a time')).toBeTruthy()
    expect(container.textContent).toContain('May 3, 2021, 12:10:58 AM')
    expect(container.textContent).toContain('was 1620000658.677')
    api.fileView.mockImplementation(() => Promise.resolve(canned))
  })
})

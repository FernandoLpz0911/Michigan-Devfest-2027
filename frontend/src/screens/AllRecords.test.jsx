import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { it, expect, vi, beforeEach } from 'vitest'
import page from '../../../fixtures/canned/record_page.json'

vi.mock('../api.js', () => ({ api: { records: vi.fn(), recordsCsvUrl: vi.fn() } }))
import { api } from '../api.js'
import AllRecords from './AllRecords.jsx'

const start = { machine: "Press 3", stop: "A_101" }
beforeEach(() => {
  api.records.mockReset()
  api.records.mockResolvedValue(page)
  api.recordsCsvUrl.mockImplementation((f) => `/csv?machine=${f.machine || ''}&stop=${f.stop || ''}`)
})

it('shows count line, chips, rows, and passes axe', async () => {
  const { container } = render(<AllRecords go={() => {}} params={{ filters: start }} />)
  await screen.findByText(/of 217 records match/)
  expect(container.textContent).toMatch(/18 of 217/)
  expect(screen.getByRole('button', { name: /Clear all/ })).toBeTruthy()
  expect(screen.getByText('Press 3', { selector: '.cds--tag *, .cds--tag' })).toBeTruthy()
  expect(container.querySelectorAll('.cds--btn--primary').length).toBe(0)
  expect(container.textContent).not.toMatch(/template|schema|regex|label/i)
  expect((await axe(container)).violations).toEqual([])
})

it('first load asks with page 1, removing a chip refetches without it', async () => {
  render(<AllRecords go={() => {}} params={{ filters: start }} />)
  await screen.findByText(/records match/)
  await userEvent.click(screen.getByRole('button', { name: /Remove filter Press 3|Press 3/ }))
  await vi.waitFor(() => expect(api.records).toHaveBeenLastCalledWith(expect.objectContaining({ machine: null, page: 1 })))
})

it('Clear all, checkbox, and search send the filters', async () => {
  render(<AllRecords go={() => {}} params={{ filters: start }} />)
  await screen.findByText(/records match/)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Only rows that were cleaned' }))
  await vi.waitFor(() => expect(api.records).toHaveBeenLastCalledWith(expect.objectContaining({ only_cleaned: true })))
  await userEvent.type(screen.getByRole('searchbox'), 'B-220')
  await vi.waitFor(() => expect(api.records).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'B-220' })))
  await userEvent.click(screen.getByRole('button', { name: /Clear all/ }))
  await vi.waitFor(() => expect(api.records).toHaveBeenLastCalledWith(
    expect.objectContaining({ q: null, machine: null, stop: null, only_cleaned: false })))
})

it('click a row opens the lot, raw switch shows file values, CSV link uses the filters', async () => {
  const go = vi.fn()
  render(<AllRecords go={go} params={{ filters: start }} />)
  await screen.findByText(/records match/)
  await userEvent.click(screen.getAllByText('4387')[0])
  expect(go).toHaveBeenCalledWith('find', { lot: '4387' })
  await userEvent.click(screen.getByRole('tab', { name: 'Your files' }))
  expect(screen.getAllByText(/5\/3\/21 8:43a/).length).toBeGreaterThan(0)
  expect(screen.getByRole('link', { name: 'Download these as CSV' }).getAttribute('href')).toBe('/csv?machine=Press 3&stop=A_101')
})

it('shows a plain error', async () => {
  api.records.mockRejectedValue({ message: 'Could not read.', fix: 'Try again.' })
  render(<AllRecords go={() => {}} params={{ filters: start }} />)
  await screen.findByText(/Could not read\./)
  expect(screen.getByText(/Try again\./)).toBeTruthy()
})

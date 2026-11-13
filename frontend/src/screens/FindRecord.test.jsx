import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'
import answer from '../../../fixtures/canned/answer.json'
import noMatch from '../../../fixtures/canned/answer_no_match.json'
import draft from '../../../fixtures/canned/granite_job4.json'
import FindRecord from './FindRecord.jsx'

vi.mock('../api.js', () => ({ api: { find: vi.fn(), draft: vi.fn(), timeline: vi.fn(() => Promise.resolve(null)), settings: vi.fn(() => Promise.resolve({ window_hours: 4, hand_time_minutes: 45 })) } }))
import { api } from '../api.js'

beforeEach(() => { vi.clearAllMocks(); api.draft.mockResolvedValue(draft) })

async function search(text) {
  fireEvent.change(screen.getByLabelText(/Paste the message/), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Find' }))
}

test('message search shows reading with Change, history, stop, worth checking, reply', async () => {
  api.find.mockResolvedValue(answer)
  const go = vi.fn()
  render(<FindRecord go={go} params={{}} />)
  await search('Buyer says burrs on lot 4417')
  expect(await screen.findByText(/Granite read this as/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy()
  const items = screen.getAllByRole('listitem').filter((li) => /From .*, row/.test(li.textContent))
  expect(items[0].textContent).toMatch(/2021-05-04/)
  expect(items[0].textContent).toMatch(/shift2_export.csv, row 22/)
  expect(items[0].textContent).toMatch(/Machine stop, code 101/)
  fireEvent.click(screen.getAllByRole('button', { name: 'See the original row' })[0])
  expect(screen.getByText('REF')).toBeTruthy()
  expect(screen.getByRole('heading', { name: /Worth checking: \d+ of \d+ lots that week/ })).toBeTruthy()
  expect(await screen.findByText('Reply to the buyer')).toBeTruthy()
  expect(await screen.findByText('by hand, timed on Friday')).toBeTruthy()
  expect(screen.getByText('45 min')).toBeTruthy()
  expect(screen.getByText(/Drafted by IBM Granite/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Copy reply' })).toBeTruthy()
})

test('typed lot number hides the Granite line', async () => {
  api.find.mockResolvedValue({ ...answer, reading: { ...answer.reading, source: 'typed' } })
  render(<FindRecord go={vi.fn()} params={{}} />)
  await search('4417')
  await screen.findByRole('heading', { name: /Worth checking/ })
  expect(screen.queryByText(/Granite read this as/)).toBeNull()
})

test('no match shows closest lot numbers', async () => {
  api.find.mockResolvedValue(noMatch)
  render(<FindRecord go={vi.fn()} params={{}} />)
  await search('4471')
  expect(await screen.findByText('No matching lot')).toBeTruthy()
  for (const l of noMatch.closest) expect(screen.getByRole('button', { name: l })).toBeTruthy()
})

test('fallback reply label', async () => {
  api.find.mockResolvedValue(answer)
  api.draft.mockResolvedValue({ ...draft, source: 'fallback' })
  render(<FindRecord go={vi.fn()} params={{}} />)
  await search('4417')
  await waitFor(() => expect(screen.getByText(/could not write this reply/)).toBeTruthy())
})

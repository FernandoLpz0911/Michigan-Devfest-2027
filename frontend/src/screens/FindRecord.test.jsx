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
  const items = screen.getAllByRole('listitem').filter((li) => /, row \d+/.test(li.textContent))
  expect(items[0].textContent).toMatch(/May 4, 2021/)
  expect(items[0].textContent).toMatch(/shift2_export.csv, row 22/)
  expect(items[0].textContent).toMatch(/Machine stop, code 101/)
  fireEvent.click(screen.getAllByRole('button', { name: 'See original row' })[0])
  expect(screen.getByLabelText('Original row 22').textContent).toMatch(/OP-121/)
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

test('a value found in the records lists the rows and links each lot', async () => {
  api.find.mockResolvedValue({ reading: null, history: null, links: [], lots_in_week: 0, closest: [], matches: {
    text: 'Press 3', total: 2, lots: 2, rows: [
      { entry_id: 'e1', lot: '4417', time: '2021-05-04T16:15', machine: 'Press 3', part: 'B-220', source_file: 'shift1_log.csv', source_row: 7, where: ['Machine'] },
      { entry_id: 'e2', lot: '4418', time: '2021-05-04T17:00', machine: 'Press 3', part: 'B-220', source_file: 'shift1_log.csv', source_row: 8, where: ['Machine'] }] } })
  const go = vi.fn()
  render(<FindRecord go={go} params={{}} />)
  await search('Press 3')
  expect(await screen.findByText('2 rows hold "Press 3"')).toBeTruthy()
  expect(screen.queryByText(/No matching lot/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'See lot 4418' }))
  expect(go).toHaveBeenCalledWith('find', { lot: '4418' })
})

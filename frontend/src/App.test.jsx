import { render, screen, fireEvent } from '@testing-library/react'
import App from './App.jsx'
import canned from '../../fixtures/canned/file_result.json'

test('app shell renders the header and the Files screen', () => {
  render(<App />)
  expect(screen.getByText('LotTrail')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})

const RESULT = canned

describe('reload', () => {
  beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks() })

  test('keeps the Check screen and its questions after a reload', async () => {
    const { api } = await import('./api.js')
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => RESULT }))
    await api.uploadFile(new File(['x'], 'a.csv'))
    sessionStorage.setItem('dw.view', JSON.stringify({ screen: 'check', params: { fileId: RESULT.file_id } }))
    render(<App />)
    expect(await screen.findByText('3 things to check')).toBeInTheDocument()
  })

  test('a fresh load with storage blocked does not throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

test('All records is reachable from the header', async () => {
  sessionStorage.clear()
  globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ records: [], rows: [], total: 0 }) }))
  render(<App />)
  fireEvent.click(screen.getByText('All records'))
  expect(await screen.findByRole('heading', { name: 'All records' })).toBeInTheDocument()
})

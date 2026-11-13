import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { it, expect } from 'vitest'
import FileRow from './FileRow.jsx'
import status from '../../../fixtures/canned/file_status.json'

const wrap = (f) => render(<ul><FileRow file={f} /></ul>)

it('working state shows sentence and steps', () => {
  wrap(status)
  expect(screen.getByText(/Asking IBM Granite what the columns mean/)).toBeTruthy()
  expect(screen.getByText(/Granite/, { selector: 'li' })).toBeTruthy()
})
it('done state', () => {
  wrap({ ...status, status: 'ready', sentence: 'New layout. You checked 3 things.' })
  expect(screen.getByText('New layout. You checked 3 things.')).toBeTruthy()
})
it('error state shows message and fix on the same row, no violations', async () => {
  const e = { message: "Can't read a PDF.", fix: 'Use CSV or Excel.' }
  const { container } = wrap({ ...status, source_file: 'notes.pdf', status: 'error', sentence: e.message, error: e, steps: [] })
  expect(screen.getByText(/Can't read a PDF. Use CSV or Excel./)).toBeTruthy()
  expect(screen.getByText('Choose another')).toBeTruthy()
  expect((await axe(container)).violations).toEqual([])
})

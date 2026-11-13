import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { vi, test, expect } from 'vitest'
import detail from '../../../fixtures/canned/file_detail.json'
import DetailsPanel from './DetailsPanel.jsx'

vi.mock('../api.js', () => ({ api: { fileDetail: vi.fn() } }))
import { api } from '../api.js'

test('shows steps and numbers, closes on Escape, has no axe violations', async () => {
  api.fileDetail.mockResolvedValue(detail)
  const onClose = vi.fn()
  const { container } = render(<DetailsPanel fileId="f1" onClose={onClose} />)
  expect(await screen.findByText('Found the header')).toBeTruthy()
  expect(screen.getByText(/columns right before your check/)).toBeTruthy()
  expect(screen.getByText(/Granite cost/)).toBeTruthy()
  expect((await axe(container)).violations).toHaveLength(0)
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('traps focus on Tab', async () => {
  api.fileDetail.mockResolvedValue(detail)
  render(<DetailsPanel fileId="f1" onClose={() => {}} />)
  await screen.findByText('Found the header')
  const close = screen.getByRole('button', { name: /Close/ })
  close.focus()
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
  expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
})

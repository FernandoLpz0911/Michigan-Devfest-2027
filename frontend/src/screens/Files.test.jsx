import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { it, expect, vi } from 'vitest'
import result from '../../../fixtures/canned/file_result.json'
import status from '../../../fixtures/canned/file_status.json'
import rows from '../../../fixtures/canned/file_rows.json'

vi.mock('../api.js', () => ({ api: { listFiles: vi.fn(), fileStatus: vi.fn(), uploadFile: vi.fn() } }))
import { api } from '../api.js'
import Files from './Files.jsx'

it('lists files, find button disabled until one is ready, one primary button', async () => {
  api.listFiles.mockResolvedValue([{ ...status, status: 'ready', sentence: 'Recognized from a file you checked earlier.' }])
  api.fileStatus.mockResolvedValue(status)
  const { container } = render(<Files go={() => {}} params={{}} />)
  await screen.findByText(/Recognized from a file/)
  expect(screen.getByRole('button', { name: 'Find a record' }).disabled).toBe(false)
  expect(container.querySelectorAll('.cds--btn--primary').length).toBe(1)
  expect(container.textContent).not.toMatch(/template|schema|regex|label|field/i)
  expect((await axe(container)).violations).toEqual([])
})
it('disabled with no ready file; upload needing a check goes to Check', async () => {
  api.listFiles.mockResolvedValue([])
  api.uploadFile.mockResolvedValue(result)
  const go = vi.fn()
  const { container } = render(<Files go={go} params={{}} />)
  expect(screen.getByRole('button', { name: 'Find a record' }).disabled).toBe(true)
  await userEvent.upload(container.querySelector('input[type=file]'), new File(['a'], 'shift1_log.csv'))
  await vi.waitFor(() => expect(go).toHaveBeenCalledWith('check', { fileId: 'f1', result }))
})
it('error row shows message and fix', async () => {
  api.listFiles.mockResolvedValue([])
  api.uploadFile.mockRejectedValue({ message: "Can't read a PDF.", fix: 'Use CSV or Excel.' })
  const { container } = render(<Files go={() => {}} params={{}} />)
  await userEvent.upload(container.querySelector('input[type=file]'), new File(['a'], 'notes.pdf'), { applyAccept: false })
  await screen.findByText(/Can't read a PDF. Use CSV or Excel./)
})

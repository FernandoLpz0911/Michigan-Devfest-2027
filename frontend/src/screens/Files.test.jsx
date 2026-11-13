import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { it, expect, vi } from 'vitest'
import result from '../../../fixtures/canned/file_result.json'
import status from '../../../fixtures/canned/file_status.json'
import rows from '../../../fixtures/canned/file_rows.json'

vi.mock('../api.js', () => ({ api: { listFiles: vi.fn(), fileStatus: vi.fn(), uploadFile: vi.fn(), deleteFile: vi.fn() } }))
import { api } from '../api.js'
import Files from './Files.jsx'

it('lists files with no extra Find button (the header has it)', async () => {
  api.listFiles.mockResolvedValue([{ ...status, status: 'ready', sentence: 'Recognized from a file you checked earlier.' }])
  api.fileStatus.mockResolvedValue(status)
  const { container } = render(<Files go={() => {}} params={{}} />)
  await screen.findByText(/Recognized from a file/)
  expect(screen.queryByRole('button', { name: 'Find a record' })).toBeNull()
  expect(container.textContent).not.toMatch(/template|schema|regex|label|field/i)
  expect((await axe(container)).violations).toEqual([])
})
it('a single upload needing a check goes to Check', async () => {
  api.listFiles.mockResolvedValue([])
  api.uploadFile.mockResolvedValue(result)
  const go = vi.fn()
  const { container } = render(<Files go={go} params={{}} />)
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
it('several files: every one is sent, none jumps to Check', async () => {
  api.listFiles.mockResolvedValue([])
  api.uploadFile.mockReset()
  api.uploadFile.mockResolvedValue(result)
  const go = vi.fn()
  const { container } = render(<Files go={go} params={{}} />)
  await userEvent.upload(container.querySelector('input[type=file]'),
    [new File(['a'], 'a.csv'), new File(['b'], 'b.csv'), new File(['c'], 'c.csv')])
  await vi.waitFor(() => expect(api.uploadFile).toHaveBeenCalledTimes(3))
  await vi.waitFor(() => expect(api.listFiles.mock.calls.length).toBeGreaterThanOrEqual(4))
  expect(go).not.toHaveBeenCalled()
})

const ready = { ...status, file_id: 'f9', source_file: 'shift9.csv', status: 'ready', sentence: 'Done.' }
it('ready file shows the next-step line with two links', async () => {
  api.listFiles.mockResolvedValue([ready])
  const go = vi.fn()
  render(<Files go={go} params={{}} />)
  await screen.findByText(/Your records are ready\./)
  await userEvent.click(screen.getByRole('button', { name: 'Find a lot' }))
  expect(go).toHaveBeenCalledWith('find')
  await userEvent.click(screen.getByRole('button', { name: 'See all records' }))
  expect(go).toHaveBeenCalledWith('records')
})
it('no next-step line without a ready file', async () => {
  api.listFiles.mockResolvedValue([])
  render(<Files go={() => {}} params={{}} />)
  await vi.waitFor(() => expect(api.listFiles).toHaveBeenCalled())
  expect(screen.queryByText(/Your records are ready\./)).toBeNull()
})
it('remove asks in a modal; Keep it does nothing, Remove file deletes', async () => {
  api.listFiles.mockResolvedValue([ready])
  api.deleteFile.mockReset()
  api.deleteFile.mockResolvedValue({})
  render(<Files go={() => {}} params={{}} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Remove shift9.csv' }))
  await screen.findByText(/The records saved from this file are removed too/)
  await userEvent.click(screen.getByRole('button', { name: 'Keep it' }))
  expect(api.deleteFile).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Remove shift9.csv' }))
  await userEvent.click(screen.getByRole('button', { name: 'Remove file' }))
  await vi.waitFor(() => expect(api.deleteFile).toHaveBeenCalledWith('f9'))
})
it('saved message is a closable notification', async () => {
  api.listFiles.mockResolvedValue([])
  render(<Files go={() => {}} params={{ saved: 'shift1_log.csv' }} />)
  await screen.findByText(/Files like shift1_log.csv are automatic from now on./)
  await userEvent.click(screen.getByRole('button', { name: /close notification/i }))
  expect(screen.queryByText(/automatic from now on/)).toBeNull()
})
it('drop zone is a keyboard button that opens the picker', async () => {
  api.listFiles.mockResolvedValue([])
  const { container } = render(<Files go={() => {}} params={{}} />)
  const click = vi.spyOn(container.querySelector('input[type=file]'), 'click')
  screen.getByRole('button', { name: 'Add files' }).focus()
  await userEvent.keyboard('{Enter}')
  expect(click).toHaveBeenCalled()
})

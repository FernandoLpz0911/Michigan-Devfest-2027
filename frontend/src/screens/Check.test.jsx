import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { it, expect, vi } from 'vitest'
import result from '../../../fixtures/canned/file_result.json'
import saved from '../../../fixtures/canned/save_result.json'

vi.mock('../api.js', () => ({ api: { sendAnswers: vi.fn(() => Promise.resolve(saved)) } }))
import { api } from '../api.js'
import Check from './Check.jsx'

it('renders questions, matched list, one primary button, no banned words', async () => {
  const { container } = render(<Check go={() => {}} params={{ result }} />)
  expect(screen.getByText('3 things to check')).toBeTruthy()
  expect(container.querySelectorAll('.cds--btn--primary').length).toBe(1)
  await userEvent.click(screen.getByText('See the 7 matched columns'))
  for (const m of result.matched) expect(screen.getByText(new RegExp('^' + m.header + ':'))).toBeTruthy()
  expect(container.textContent).not.toMatch(/template|schema|regex|label|field/i)
  expect((await axe(container)).violations).toEqual([])
})
it('save stays disabled until the unanswered card is answered, then sends answers', async () => {
  const go = vi.fn()
  render(<Check go={go} params={{ result }} />)
  const save = screen.getByRole('button', { name: 'Save these answers' })
  expect(save.disabled).toBe(true)
  await userEvent.click(screen.getByRole('radio', { name: /Prod Dt/ }))
  expect(save.disabled).toBe(false)
  await userEvent.click(save)
  expect(api.sendAnswers).toHaveBeenCalledWith('f1', [
    { question_id: 'q1', value: '3' }, { question_id: 'q2', value: 'lot' }, { question_id: 'q3', value: 'yes' }])
  await vi.waitFor(() => expect(go).toHaveBeenCalledWith('files', { saved: 'shift1_log.csv' }))
})
it('shows the warning bar when Granite fell back', () => {
  render(<Check go={() => {}} params={{ result: { ...result, fell_back: true } }} />)
  expect(screen.getByText(/could not be read/)).toBeTruthy()
})

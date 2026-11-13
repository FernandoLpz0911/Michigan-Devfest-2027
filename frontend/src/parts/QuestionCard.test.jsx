import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect, vi } from 'vitest'
import QuestionCard from './QuestionCard.jsx'
import result from '../../../fixtures/canned/file_result.json'

it.each(['duplicate', 'unsure', 'merge'])('renders kind %s', (kind) => {
  const q = result.questions.find((x) => x.kind === kind)
  render(<QuestionCard question={q} value={q.preselected} onChange={() => {}} />)
  expect(screen.getByText(q.title)).toBeTruthy()
  expect(screen.getAllByRole('radio').length).toBe(q.choices.length)
})
it('guess is preselected and labeled', () => {
  const q = result.questions[1]
  render(<QuestionCard question={q} value={q.preselected} onChange={() => {}} />)
  expect(screen.getByRole('radio', { name: /Lot number/ }).checked).toBe(true)
  expect(screen.getByText("Granite's guess")).toBeTruthy()
})
it('type_conflict and missing kinds render', () => {
  for (const kind of ['type_conflict', 'missing']) {
    const q = { question_id: 'x' + kind, kind, positions: [1], title: 'T ' + kind, sentence: 'S',
      choices: [{ value: '1', text: 'A', samples: [], granite_guess: false }, { value: 'none', text: 'None of these', samples: [], granite_guess: false }], preselected: null }
    const { unmount } = render(<QuestionCard question={q} value={null} onChange={() => {}} />)
    expect(screen.getByText('T ' + kind)).toBeTruthy()
    unmount()
  }
})
it('keyboard answers', async () => {
  const q = result.questions[1]
  const fn = vi.fn()
  render(<QuestionCard question={q} value="lot" onChange={fn} />)
  screen.getByRole('radio', { name: /Lot number/ }).focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(fn).toHaveBeenCalledWith('part')
})

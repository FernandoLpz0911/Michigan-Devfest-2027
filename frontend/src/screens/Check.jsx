import { useState } from 'react'
import { Button, InlineNotification } from '@carbon/react'
import QuestionCard from '../parts/QuestionCard.jsx'
import { api } from '../api.js'

const SHOWN = { lot: 'Lot number', part: 'Part number', quantity: 'Quantity', time: 'Time', machine: 'Machine',
  operator: 'Operator', shift: 'Shift', step: 'Process step', alarm: 'Machine stop', extra: 'Extra detail' }

// params: { fileId, result } where result is the FileResult from the upload.
export default function Check({ go, params }) {
  const result = params?.result
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries((result?.questions || []).map((q) => [q.question_id, q.preselected])))
  const [showMatched, setShowMatched] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  if (!result) return <p>Nothing to check. <a href="#" onClick={(e) => { e.preventDefault(); go('files') }}>Back to files</a></p>

  const { questions, matched, source_file: name, fell_back } = result
  const ready = questions.every((q) => answers[q.question_id])

  async function save(e) {
    e.preventDefault()
    if (!ready || saving) return
    setSaving(true)
    setError(null)
    try {
      await api.sendAnswers(result.file_id, questions.map((q) => ({ question_id: q.question_id, value: answers[q.question_id] })))
      go('files', { saved: name })
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1>{questions.length} {questions.length === 1 ? 'thing' : 'things'} to check</h1>
      <p>{name}. Everything else was matched.</p>
      {fell_back && (
        <InlineNotification kind="warning" lowContrast hideCloseButton title="Granite's answer could not be read."
          subtitle="Every column is a question, with no guess. Nothing was merged." />
      )}
      {questions.map((q) => (
        <QuestionCard key={q.question_id} question={q} value={answers[q.question_id]}
          onChange={(v) => setAnswers({ ...answers, [q.question_id]: v })} />
      ))}
      {error && <p role="alert">{error.message} {error.fix}</p>}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Button type="submit" kind="primary" disabled={!ready || saving}>Save</Button>
        <a href="#" onClick={(e) => { e.preventDefault(); go('files') }}>Back to files</a>
        <a href="#" style={{ marginLeft: 'auto' }} aria-expanded={showMatched}
          onClick={(e) => { e.preventDefault(); setShowMatched(!showMatched) }}>
          See the {matched.length} matched columns
        </a>
      </div>
      {showMatched && (
        <ul aria-label="Matched columns">
          {matched.map((m) => <li key={m.position}>{m.header}: {SHOWN[m.field]}</li>)}
        </ul>
      )}
    </form>
  )
}

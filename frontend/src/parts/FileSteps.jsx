import React from 'react'

// steps: the `steps` list from FileStatus. Each has step, state, title.
const LABELS = { header: 'Header', granite: 'Granite', cleaning: 'Cleaning', records: 'Records' }

function marker(state) {
  if (state === 'done') return { mark: '✓', cls: 'step-done', word: 'done' }
  if (state === 'current') return { mark: '●', cls: 'step-current', word: 'working' }
  if (state === 'not_needed') return { mark: '○', cls: 'step-not-needed', word: 'not needed' }
  return { mark: '○', cls: 'step-waiting', word: 'waiting' }
}

export default function FileSteps({ steps = [] }) {
  return (
    <ul className="file-steps" style={{ listStyle: 'none', display: 'flex', gap: '1rem', padding: 0 }}>
      {steps.map((s) => {
        const m = marker(s.state)
        return (
          <li key={s.step} className={m.cls} aria-label={`${LABELS[s.step] ?? s.step}, ${m.word}`}>
            <span aria-hidden="true">{m.mark} </span>
            {LABELS[s.step] ?? s.step}
          </li>
        )
      })}
    </ul>
  )
}

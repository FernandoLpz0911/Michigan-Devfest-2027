import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import StepCard from './StepCard.jsx'

const FOCUSABLE = 'button, a[href], input, [tabindex]:not([tabindex="-1"])'

export default function DetailsPanel({ fileId, onClose, onGraniteSaw }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const box = useRef(null)

  useEffect(() => {
    api.fileDetail(fileId).then(setDetail).catch(setError)
  }, [fileId])

  useEffect(() => { box.current?.querySelector('button')?.focus() }, [])

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key !== 'Tab') return
    const items = [...box.current.querySelectorAll(FOCUSABLE)]
    if (!items.length) return
    const first = items[0], last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const c = detail?.counters
  return (
    <div className="details-backdrop">
      <div ref={box} role="dialog" aria-modal="true" aria-label="Details" className="details-panel" onKeyDown={onKeyDown}>
        <button type="button" onClick={onClose}>Close ×</button>
        {error && <p role="alert">{error.message} {error.fix}</p>}
        {detail && (
          <>
            <h2>{detail.source_file}</h2>
            <p>{detail.recognized ? 'Recognized from a file you checked earlier.' : 'New layout. Granite suggested, you decided.'}</p>
            <ol className="step-list">{detail.steps.map((s) => <StepCard key={s.step} step={s} />)}</ol>
            {onGraniteSaw && !detail.recognized && <button type="button" onClick={onGraniteSaw}>What Granite saw</button>}
            {c && (
              <dl className="details-numbers">
                <div><dt>columns right before your check</dt><dd>{c.columns_right} of {c.columns_total}</dd></div>
                <div><dt>Granite cost ({(c.tokens_in + c.tokens_out).toLocaleString('en-US')} tokens)</dt><dd>${c.cost_usd.toFixed(4)}</dd></div>
                <div><dt>records, rows held back</dt><dd>{c.entries}, {c.rows_held}</dd></div>
              </dl>
            )}
          </>
        )}
      </div>
    </div>
  )
}

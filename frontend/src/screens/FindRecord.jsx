import { useEffect, useState } from 'react'
import { api } from '../api.js'
import TimeSavedLine from '../parts/TimeSavedLine.jsx'
import TimelineStrip from '../parts/TimelineStrip.jsx'

function stopText(alarm) {
  const n = String(alarm).replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return `Machine stop, code ${n}`
}

function Step({ e }) {
  const [open, setOpen] = useState(false)
  const when = e.time.replace('T', ' ')
  return (
    <li>
      <p>
        <strong>{when}</strong>: {e.step || 'Step'} on {e.machine || 'unknown machine'}
        {e.operator ? `, operator ${e.operator}` : ''}{e.shift ? `, ${e.shift} shift` : ''}
        {e.quantity != null ? `, ${e.quantity} parts` : ''}. From {e.source_file}, row {e.source_row}.
      </p>
      {e.alarm && <p className="stop"><span aria-hidden="true">▲</span> {stopText(e.alarm)}</p>}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Hide the original row' : 'See the original row'}
      </button>
      {open && (
        <dl>{Object.entries(e.original_row).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      )}
    </li>
  )
}

function Reply({ draft }) {
  const [sections, setSections] = useState(draft.sections)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const plain = sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n')
  const label = draft.source === 'granite'
    ? 'Drafted by IBM Granite from these records only. Read before sending.'
    : 'Granite could not write this reply. These are the facts as a plain list.'
  function copy() {
    navigator.clipboard?.writeText(plain)
    setCopied(true)
  }
  return (
    <section aria-labelledby="reply-h">
      <h2 id="reply-h">Reply to the buyer</h2>
      <div className="reply-card">
        {sections.map((s, i) => (
          <div key={s.heading}>
            <h3>{s.heading}</h3>
            {editing
              ? <textarea aria-label={s.heading} value={s.text} onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              : s.text
                ? <p style={{ whiteSpace: 'pre-line' }}>{s.text}</p>
                : <p><em>Add where these lots are and who is checking them.</em></p>}
          </div>
        ))}
      </div>
      <p>{label}</p>
      <button type="button" className="cds--btn cds--btn--primary" onClick={copy}>Copy reply</button>{' '}
      <button type="button" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit'}</button>
      {copied && <span role="status"> Copied.</span>}
    </section>
  )
}

export default function FindRecord({ go, params }) {
  const [text, setText] = useState(params?.lot || '')
  const [searched, setSearched] = useState(null)
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState(null)
  const [seconds, setSeconds] = useState(null)
  const [handTime, setHandTime] = useState(null)
  const [timeline, setTimeline] = useState(null)

  async function search(value) {
    const q = value.trim()
    if (!q) return
    setBusy(true); setError(null); setAnswer(null); setDraft(null); setSearched(q); setSeconds(null); setTimeline(null)
    const started = Date.now()
    try {
      const a = await api.find(q)
      setAnswer(a)
      setBusy(false)
      if (a.history) {
        api.timeline(a.history.lot).then(setTimeline).catch(() => setTimeline(null))
        api.draft(a.history.lot, a.reading).then((d) => {
          setDraft(d)
          setSeconds(Math.max(1, Math.round((Date.now() - started) / 1000)))
        }).catch(setError)
      }
    } catch (err) {
      setError(err); setBusy(false)
    }
  }

  useEffect(() => { if (params?.lot) search(params.lot) }, [params?.lot])
  useEffect(() => { api.settings().then((s) => setHandTime(s?.hand_time_minutes ?? null)).catch(() => {}) }, [])

  function reset() { setSearched(null); setAnswer(null); setDraft(null); setError(null) }

  const r = answer?.reading
  const typed = r?.source === 'typed'
  return (
    <div className="find-record">
      {searched === null ? (
        <form onSubmit={(e) => { e.preventDefault(); search(text) }}>
          <h1>Find a record</h1>
          <label htmlFor="find-box">Paste the message or type a lot number</label>
          <textarea id="find-box" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="cds--btn cds--btn--primary">Find</button>
        </form>
      ) : (
        <p>
          <span>{searched}</span> <button type="button" onClick={reset}>New search</button>
        </p>
      )}
      {busy && <p role="status">{/^\S+$/.test(searched) ? 'Looking up the lot...' : 'Sending this message to IBM Granite...'}</p>}
      {error && <p role="alert">{error.message} {error.fix}</p>}
      {answer && !typed && (
        <p>
          {r?.found
            ? `Granite read this as: lot ${r.lot}${r.part ? `, part ${r.part}` : ''}${r.problem ? `, problem: ${r.problem}` : ''}.`
            : 'No lot number found in this message.'}{' '}
          <button type="button" onClick={reset}>Change</button>
        </p>
      )}
      {answer && !answer.history && r?.found !== false && (
        <section>
          <h2>No matching lot</h2>
          <p>There is no lot {r?.lot ?? searched} in your records.</p>
          {answer.closest.length > 0 && (
            <>
              <p>Closest lot numbers:</p>
              <ul>{answer.closest.map((l) => <li key={l}><button type="button" onClick={() => go('find', { lot: l })}>{l}</button></li>)}</ul>
            </>
          )}
        </section>
      )}
      {answer?.history && (
        <>
          <h2>Lot {answer.history.lot} history</h2>
          <ol>{answer.history.entries.map((e) => <Step key={e.entry_id} e={e} />)}</ol>
          {timeline && <TimelineStrip timeline={timeline} />}
          <section aria-labelledby="worth-h">
            <h2 id="worth-h">Worth checking: {answer.links.length} of {answer.lots_in_week} lots that week</h2>
            <p>Not a verdict. Each one shares something with lot {answer.history.lot}.</p>
            <ul>
              {answer.links.map((l) => (
                <li key={l.lot}>
                  <strong>Lot {l.lot}</strong> {l.reasons.join(', ')}{' '}
                  <button type="button" aria-label={`See lot ${l.lot}`} onClick={() => go('find', { lot: l.lot })}>See</button>
                </li>
              ))}
            </ul>
          </section>
          {draft && <Reply draft={draft} />}
          {draft && seconds !== null && <TimeSavedLine toolSeconds={seconds} handTimeMinutes={handTime} />}
        </>
      )}
    </div>
  )
}

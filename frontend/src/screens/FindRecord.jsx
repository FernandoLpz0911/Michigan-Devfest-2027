import { useEffect, useState } from 'react'
import { Button, TextArea } from '@carbon/react'
import { api } from '../api.js'
import TimeSavedLine from '../parts/TimeSavedLine.jsx'
import TimelineStrip from '../parts/TimelineStrip.jsx'

function stopText(alarm) {
  const n = String(alarm).replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return `Machine stop, code ${n}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2021-05-04T16:15" -> ["May 4, 2021", "4:15 PM"], read as written (no time zone shift).
export function whenText(time) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(time || '')
  if (!m) return [time || '', '']
  const day = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`
  if (m[4] === undefined) return [day, '']
  const h = Number(m[4])
  return [day, `${h % 12 || 12}:${m[5]} ${h < 12 ? 'AM' : 'PM'}`]
}

function Step({ e }) {
  const [open, setOpen] = useState(false)
  const [day, clock] = whenText(e.time)
  return (
    <li className="lot-step">
      <div className="when"><strong>{day}</strong><span className="subtle">{clock}</span></div>
      <div>
        <p>
          {e.step || 'Step'} on {e.machine || 'an unknown machine'}
          {e.operator ? ` by operator ${e.operator}` : ''}{e.shift ? `, ${e.shift} shift` : ''}.
          {e.quantity != null ? ` ${e.quantity} parts.` : ''}
        </p>
        {e.alarm && <p className="stop"><span className="stop-icon" aria-hidden="true">▲</span>{stopText(e.alarm)}</p>}
        <p className="source">
          {e.source_file}, row {e.source_row} ·{' '}
          <button type="button" className="link-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide original row' : 'See original row'}
          </button>
        </p>
        {open && (
          <code className="raw-row" aria-label={`Original row ${e.source_row}`}>
            {Object.values(e.original_row).join(', ')}
          </code>
        )}
      </div>
    </li>
  )
}

function Reply({ draft }) {
  // Granite joins the other lots with semicolons; put each lot on its own line.
  const [sections, setSections] = useState(() => draft.sections.map((x) => ({
    ...x, text: (x.text || '').replace(/;\s*(?=Lot \S)/g, '\n') })))
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
      <p className="subtle">{label}</p>
      <div className="reply-actions">
        <Button kind="primary" onClick={copy}>Copy reply</Button>
        <Button kind="ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit'}</Button>
        {copied && <span role="status">Copied.</span>}
      </div>
    </section>
  )
}

// Text found inside the records (a machine, part, operator, stop code, date...).
function Matches({ m, go }) {
  const rows = m.total === 1 ? 'row holds' : 'rows hold'
  const lots = m.lots === 1 ? '1 lot' : `${m.lots} lots`
  return (
    <section aria-labelledby="matches-h">
      <h2 id="matches-h">{m.total} {rows} "{m.text}"</h2>
      <p className="subtle">
        In {lots}.{m.total > m.rows.length ? ` Showing the first ${m.rows.length}.` : ''} Pick a lot to see its whole history.
      </p>
      <table className="match-table">
        <thead><tr><th>Lot</th><th>When</th><th>Machine</th><th>Found in</th><th>From</th></tr></thead>
        <tbody>
          {m.rows.map((x) => {
            const [day, clock] = whenText(x.time)
            return (
              <tr key={x.entry_id}>
                <td><button type="button" className="link-btn" aria-label={`See lot ${x.lot}`}
                  onClick={() => go('find', { lot: x.lot })}>{x.lot}</button></td>
                <td>{day} {clock}</td>
                <td>{x.machine || ''}</td>
                <td>{x.where.join(', ')}</td>
                <td className="subtle">{x.source_file}, row {x.source_row}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
  const [drafting, setDrafting] = useState(false)

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
        // A pasted buyer message gets its reply drafted right away. A plain lookup
        // (typed lot, or a lot picked from a list) only drafts when asked.
        if (a.reading?.source !== 'typed') makeDraft(a, started)
      }
    } catch (err) {
      setError(err); setBusy(false)
    }
  }

  function makeDraft(a, started = Date.now()) {
    setDrafting(true)
    api.draft(a.history.lot, a.reading).then((d) => {
      setDraft(d)
      setSeconds(Math.max(1, Math.round((Date.now() - started) / 1000)))
    }).catch(setError).finally(() => setDrafting(false))
  }

  useEffect(() => { if (params?.lot) search(params.lot) }, [params?.lot])
  useEffect(() => { api.settings().then((s) => setHandTime(s?.hand_time_minutes ?? null)).catch(() => {}) }, [])

  function reset() { setSearched(null); setAnswer(null); setDraft(null); setError(null) }

  const r = answer?.reading
  const typed = r?.source === 'typed'
  return (
    <div className="find-record">
      <h1>Find a record</h1>
      {searched === null ? (
        <form className="find-form" onSubmit={(e) => { e.preventDefault(); search(text) }}>
          <TextArea id="find-box" rows={5} labelText="Paste the message, or type what you are looking for"
            helperText="A lot number, or anything in your files: a machine, part, operator, stop code or date."
            value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" kind="primary">Find</Button>
        </form>
      ) : (
        <p className="find-searched">
          <span>{answer?.history && /^\S+$/.test(searched) ? `Lot ${searched}` : `"${searched}"`}</span>
          <button type="button" className="link-btn" onClick={reset}>New search</button>
        </p>
      )}
      {busy && <p role="status">{searched.length <= 60 && !searched.includes('\n') ? 'Searching your records...' : 'Sending this message to IBM Granite...'}</p>}
      {error && <p role="alert">{error.message} {error.fix}</p>}
      {answer && !typed && (
        <p className="find-reading">
          {r?.found
            ? <>Granite read this as <strong>lot {r.lot}</strong>
              {r.part && <>, <strong>part {r.part}</strong></>}
              {r.problem && <>, problem: <strong>{r.problem}</strong></>}.</>
            : 'No lot number found in this message.'}{' '}
          <button type="button" className="link-btn" onClick={reset}>Change</button>
        </p>
      )}
      {answer?.matches && <Matches m={answer.matches} go={go} />}
      {answer && !answer.matches && !answer.history && r?.found !== false && (
        <section>
          <h2>No matching lot</h2>
          <p>There is no lot {r?.lot ?? searched} in your records.</p>
          {answer.closest.length > 0 && (
            <>
              <p>Closest lot numbers:</p>
              <ul>{answer.closest.map((l) => <li key={l}><button type="button" className="link-btn" onClick={() => go('find', { lot: l })}>{l}</button></li>)}</ul>
            </>
          )}
        </section>
      )}
      {answer?.history && (
        <>
          <div className="lot-head">
            <h2>Lot {answer.history.lot}</h2>
            {answer.history.part && <span className="subtle">Part {answer.history.part}</span>}
            <button type="button" className="link-btn" onClick={() => window.print()}>Print</button>
          </div>
          <ol className="lot-steps" aria-label={`Lot ${answer.history.lot} history`}>
            {answer.history.entries.map((e) => <Step key={e.entry_id} e={e} />)}
          </ol>
          {timeline && <TimelineStrip timeline={timeline} />}
          <section aria-labelledby="worth-h">
            <h2 id="worth-h">Worth checking: {answer.links.length} of {answer.lots_in_week} lots that week</h2>
            <p>Not a verdict. Each one shares something with lot {answer.history.lot}.</p>
            <ul className="worth-list">
              {answer.links.map((l) => (
                <li key={l.lot}>
                  <strong>Lot {l.lot}</strong> {l.reasons.join(', ')}{' '}
                  <button type="button" className="link-btn" aria-label={`See lot ${l.lot}`} onClick={() => go('find', { lot: l.lot })}>See</button>
                </li>
              ))}
            </ul>
          </section>
          {!draft && (
            <section className="draft-ask" aria-labelledby="draft-ask-h">
              <h2 id="draft-ask-h">Answering a buyer about this lot?</h2>
              <p className="subtle">IBM Granite can write a reply from these records only. You read and edit it before sending.</p>
              <Button kind="secondary" disabled={drafting} onClick={() => makeDraft(answer)}>
                {drafting ? 'Writing the reply...' : 'Draft a reply'}
              </Button>
            </section>
          )}
          {draft && <Reply draft={draft} />}
          {draft && seconds !== null && <TimeSavedLine toolSeconds={seconds} handTimeMinutes={handTime} />}
        </>
      )}
    </div>
  )
}

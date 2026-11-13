import { useEffect, useRef, useState } from 'react'
import { InlineNotification, Modal } from '@carbon/react'
import { Upload } from '@carbon/icons-react'
import FileRow from '../parts/FileRow.jsx'
import { api } from '../api.js'
import './Files.css'

export default function Files({ go, params }) {
  const [over, setOver] = useState(false)
  const [showSaved, setShowSaved] = useState(true)
  const [pending, setPending] = useState(null)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const input = useRef(null)

  const load = () => api.listFiles().then(setRows).catch(setError)
  useEffect(() => { load() }, [])

  // Poll the files that are still working.
  const working = rows.filter((r) => r.status === 'working').map((r) => r.file_id).join(',')
  useEffect(() => {
    if (!working) return
    const timer = setInterval(() => {
      Promise.all(working.split(',').map((id) => api.fileStatus(id))).then((list) =>
        setRows((old) => old.map((r) => list.find((s) => s.file_id === r.file_id) || r)))
    }, 500)
    return () => clearInterval(timer)
  }, [working])

  // Files go up one at a time (the server numbers them in order), but every file in the drop
  // is sent. Only a single-file drop jumps straight to Check; with several, each file that
  // needs a check keeps its own "Check" link in the list.
  async function upload(files) {
    setError(null)
    const queue = files.map((file) => ({ file_id: `up-${file.name}`, source_file: file.name, status: 'working',
      sentence: 'Waiting its turn...', steps: [] }))
    for (const [i, file] of files.entries()) {
      // The first row in the queue is the file being read now; the rest wait.
      setBusy([{ ...queue[i], sentence: 'Finding the header...', steps: [
        { step: 'header', state: 'current' }, { step: 'granite', state: 'waiting' },
        { step: 'cleaning', state: 'waiting' }, { step: 'records', state: 'waiting' }] }, ...queue.slice(i + 1)])
      try {
        const result = await api.uploadFile(file)
        if (result.status === 'needs_check' && files.length === 1) {
          setBusy(null); go('check', { fileId: result.file_id, result }); return
        }
        await load()
      } catch (err) {
        setRows((old) => [...old, { file_id: `err-${file.name}`, source_file: file.name, status: 'error', sentence: err.message, error: err, steps: [] }])
      }
    }
    setBusy(null)
  }

  function remove(r) {
    if (r.file_id.startsWith('err-')) { setRows((old) => old.filter((x) => x !== r)); return }
    setPending(r)
  }

  async function confirmRemove() {
    const r = pending
    setPending(null)
    setError(null)
    try { await api.deleteFile(r.file_id) } catch (err) { setError(err) }
    await load()
  }

  return (
    <div className="files-screen">
      <p className="files-eyebrow">Messy shop files in, buyer answers out.</p>
      <h1>Add your shift logs</h1>
      <p className="subtle">Any spreadsheet works, even a messy one. Your column names stay; the values inside are made consistent.</p>
      <ol className="files-steps" aria-label="How it works">
        <li><span>1</span>Add each shift's file</li>
        <li><span>2</span>Answer a few plain questions</li>
        <li><span>3</span>Find any lot's whole history</li>
      </ol>
      {params?.saved && showSaved && (
        <InlineNotification kind="success" lowContrast title="Saved."
          subtitle={`Files like ${params.saved} are automatic from now on.`}
          onCloseButtonClick={() => setShowSaved(false)} />
      )}
      <div role="button" tabIndex={0} aria-label="Add files"
        className={`drop-zone${over ? ' drop-zone-over' : ''}`}
        onClick={() => input.current.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current.click() } }}
        onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload([...e.dataTransfer.files]) }}>
        <Upload size={32} aria-hidden="true" className="drop-zone-icon" />
        <span className="drop-zone-text">Drop files here, or <span className="drop-zone-link">choose files</span></span>
        <span className="drop-zone-hint">.csv, .xlsx or .xls</span>
        <input ref={input} type="file" multiple hidden aria-label="Choose files" accept=".csv,.xlsx,.xls"
          onClick={(e) => e.stopPropagation()} onChange={(e) => upload([...e.target.files])} />
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((r) => (
          <FileRow key={r.file_id} file={r}
            onChooseAnother={() => { setRows(rows.filter((x) => x !== r)); input.current.click() }}
            onCheck={() => go('check', { fileId: r.file_id })}
            onSee={() => go('seefile', { fileId: r.file_id })}
            onDelete={remove} />
        ))}
        {busy && busy.map((b) => <FileRow key={b.file_id} file={b} />)}
      </ul>
      {rows.some((r) => r.status === 'ready') && (
        <p className="files-next">Your records are ready.{' '}
          <button type="button" className="link-btn" onClick={() => go('find')}>Find a lot</button>
          <button type="button" className="link-btn" onClick={() => go('records')}>See all records</button>
        </p>
      )}
      {error && <p role="alert">{error.message} {error.fix}</p>}
      <p className="subtle">Only column names and a few sample values are sent to Granite.</p>
      <Modal danger open={!!pending} modalHeading={`Remove ${pending?.source_file}?`}
        primaryButtonText="Remove file" secondaryButtonText="Keep it"
        onRequestClose={() => setPending(null)} onRequestSubmit={confirmRemove}
        onSecondarySubmit={() => setPending(null)}>
        <p>The records saved from this file are removed too. You can add the file again later.</p>
      </Modal>
    </div>
  )
}

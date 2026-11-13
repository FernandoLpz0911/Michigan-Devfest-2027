import { useEffect, useRef, useState } from 'react'
import { Button } from '@carbon/react'
import FileRow from '../parts/FileRow.jsx'
import { api } from '../api.js'

export default function Files({ go, params }) {
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

  async function upload(files) {
    for (const file of files) {
      setError(null)
      setBusy({ source_file: file.name, status: 'working', sentence: 'Finding the header...', steps: [
        { step: 'header', state: 'current' }, { step: 'granite', state: 'waiting' },
        { step: 'cleaning', state: 'waiting' }, { step: 'records', state: 'waiting' }] })
      try {
        const result = await api.uploadFile(file)
        if (result.status === 'needs_check') { setBusy(null); go('check', { fileId: result.file_id, result }); return }
        await load()
      } catch (err) {
        setRows((old) => [...old, { file_id: `err-${file.name}`, source_file: file.name, status: 'error', sentence: err.message, error: err, steps: [] }])
      }
      setBusy(null)
    }
  }

  const anyReady = rows.some((r) => r.status === 'ready')
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1>Add your shift logs</h1>
      <p>Any spreadsheet works, even a messy one.</p>
      {params?.saved && <div role="status">Saved. Files like {params.saved} are automatic from now on.</div>}
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload([...e.dataTransfer.files]) }}
        style={{ border: '1px dashed #8d8d8d', padding: '3rem', textAlign: 'center' }}>
        Drop files here, or{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); input.current.click() }}>choose files</a>
        <input ref={input} type="file" multiple hidden aria-label="Choose files" accept=".csv,.xlsx,.xls"
          onChange={(e) => upload([...e.target.files])} />
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((r) => (
          <FileRow key={r.file_id} file={r}
            onChooseAnother={() => { setRows(rows.filter((x) => x !== r)); input.current.click() }}
            onCheck={() => go('check', { fileId: r.file_id })}
            onSee={() => go('seefile', { fileId: r.file_id })} />
        ))}
        {busy && <FileRow file={busy} />}
      </ul>
      {error && <p role="alert">{error.message} {error.fix}</p>}
      <p>Only column names and a few sample values are sent to Granite.</p>
      <Button kind="primary" disabled={!anyReady} onClick={() => go('find')}>Find a record</Button>
    </div>
  )
}

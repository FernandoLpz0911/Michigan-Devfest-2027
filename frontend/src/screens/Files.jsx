import { useEffect, useRef, useState } from 'react'
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

  async function remove(r) {
    if (r.file_id.startsWith('err-')) { setRows((old) => old.filter((x) => x !== r)); return }
    if (!window.confirm(`Remove ${r.source_file} and the records saved from it?`)) return
    setError(null)
    try { await api.deleteFile(r.file_id) } catch (err) { setError(err) }
    await load()
  }

  return (
    <div className="files-screen">
      <h1>Add your shift logs</h1>
      <p className="subtle">Any spreadsheet works, even a messy one.</p>
      {params?.saved && <div role="status">Saved. Files like {params.saved} are automatic from now on.</div>}
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload([...e.dataTransfer.files]) }}
        style={{ border: '1px dashed var(--cds-border-strong)', padding: '3rem', textAlign: 'center', margin: '2rem 0' }}>
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
            onSee={() => go('seefile', { fileId: r.file_id })}
            onDelete={remove} />
        ))}
        {busy && busy.map((b) => <FileRow key={b.file_id} file={b} />)}
      </ul>
      {error && <p role="alert">{error.message} {error.fix}</p>}
      <p className="subtle">Only column names and a few sample values are sent to Granite.</p>
    </div>
  )
}

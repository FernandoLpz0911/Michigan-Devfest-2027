import { InlineLoading } from '@carbon/react'
import { ErrorFilled, CheckmarkFilled, WarningAltFilled, Close } from '@carbon/icons-react'
import FileSteps from './FileSteps.jsx'
import './FileRow.css'

// One row of the Files list. Props: file (FileStatus or FileRow), onCheck, onChooseAnother, onSee, onDelete.
// With onDelete, the status icon turns into an X on hover or keyboard focus.
export default function FileRow({ file, onCheck, onChooseAnother, onSee, onDelete }) {
  const { source_file: name, status, sentence, steps = [], error } = file
  return (
    <li className={`file-row file-row-${status}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #c6c6c6' }}>
      {onDelete && status !== 'working' ? (
        <button type="button" className="file-row-delete" aria-label={`Remove ${name}`} title="Remove this file"
          onClick={() => onDelete(file)}>
          <span className="file-row-status" aria-hidden="true">
            {status === 'working' && <InlineLoading description="" />}
            {status === 'error' && <ErrorFilled size={24} />}
            {status === 'ready' && <CheckmarkFilled size={24} />}
            {status === 'needs_check' && <WarningAltFilled size={24} />}
          </span>
          <Close size={24} className="file-row-x" aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true">
          {status === 'working' && <InlineLoading description="" />}
          {status === 'error' && <ErrorFilled size={24} />}
          {status === 'ready' && <CheckmarkFilled size={24} />}
          {status === 'needs_check' && <WarningAltFilled size={24} />}
        </span>
      )}
      <strong>{name}</strong>
      <div style={{ flex: 1 }}>
        <div role={status === 'error' ? 'alert' : 'status'}>
          {status === 'error' && error ? `${error.message} ${error.fix}` : sentence}
        </div>
        {status === 'working' && steps.length > 0 && <FileSteps steps={steps} />}
      </div>
      {status === 'error' && <button type="button" className="link-btn" onClick={() => onChooseAnother?.()}>Choose another</button>}
      {status === 'needs_check' && <button type="button" className="link-btn" aria-label={`Answer questions about ${name}`} onClick={() => onCheck?.(file)}>Answer questions</button>}
      {status === 'ready' && onSee && <button type="button" className="link-btn" onClick={() => onSee(file)}>See the file</button>}
    </li>
  )
}

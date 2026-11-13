import { InlineLoading } from '@carbon/react'
import { ErrorFilled, CheckmarkFilled, WarningAltFilled } from '@carbon/icons-react'
import FileSteps from './FileSteps.jsx'

// One row of the Files list. Props: file (FileStatus or FileRow), onCheck, onChooseAnother, onSee.
export default function FileRow({ file, onCheck, onChooseAnother, onSee }) {
  const { source_file: name, status, sentence, steps = [], error } = file
  return (
    <li className={`file-row file-row-${status}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #c6c6c6' }}>
      <span aria-hidden="true">
        {status === 'working' && <InlineLoading description="" />}
        {status === 'error' && <ErrorFilled size={24} />}
        {status === 'ready' && <CheckmarkFilled size={24} />}
        {status === 'needs_check' && <WarningAltFilled size={24} />}
      </span>
      <strong>{name}</strong>
      <div style={{ flex: 1 }}>
        <div role={status === 'error' ? 'alert' : 'status'}>
          {status === 'error' && error ? `${error.message} ${error.fix}` : sentence}
        </div>
        {status === 'working' && steps.length > 0 && <FileSteps steps={steps} />}
      </div>
      {status === 'error' && <a href="#" onClick={(e) => { e.preventDefault(); onChooseAnother?.() }}>Choose another</a>}
      {status === 'needs_check' && <a href="#" onClick={(e) => { e.preventDefault(); onCheck?.(file) }}>Check {name}</a>}
      {status === 'ready' && onSee && <a href="#" onClick={(e) => { e.preventDefault(); onSee(file) }}>See the file</a>}
    </li>
  )
}

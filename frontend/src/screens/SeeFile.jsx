import { useEffect, useState } from 'react'
import { ContentSwitcher, Switch, InlineLoading, Link } from '@carbon/react'
import { WarningAltFilled } from '@carbon/icons-react'
import { api } from '../api.js'
import SwitchCell from '../parts/SwitchCell.jsx'
import './SeeFile.css'

const SHOWN = {
  lot: 'Lot number', part: 'Part', quantity: 'Quantity', time: 'Time', machine: 'Machine',
  operator: 'Operator', shift: 'Shift', step: 'Step', alarm: 'Machine stop', extra: 'Extra detail',
}
const WHO = {
  granite: 'Granite matched it',
  person: 'you confirmed it',
  format: 'a saved layout matched it',
}

function Line({ row, columns, cleaned, play }) {
  const n = <th scope="row" className="seefile-num">{row.source_row}</th>
  if (row.kind === 'skipped') {
    const text = row.raw.find((v) => v) || ''
    return (
      <tr className="seefile-skipped">
        {n}
        <td colSpan={columns.length}>{text ? `${text} · ` : ''}skipped: {row.reason_text}</td>
      </tr>
    )
  }
  if (row.kind === 'header') {
    return <tr className="seefile-header">{n}{row.raw.map((v, i) => <td key={i}>{v}</td>)}</tr>
  }
  const held = row.kind === 'held'
  return (
    <tr className={held ? 'seefile-held' : ''}>
      {n}
      {row.raw.map((v, i) => (
        <td key={i} className={cleaned && row.clean && row.clean[i] !== v ? 'seefile-changed' : ''}>
          {held && i === 0 && (
            <div className="seefile-reason">
              <WarningAltFilled size={16} aria-hidden="true" /> Held back: {row.reason_text}
            </div>
          )}
          <SwitchCell raw={v} clean={row.clean ? row.clean[i] : null} cleaned={cleaned} play={play} index={i} />
        </td>
      ))}
    </tr>
  )
}

export default function SeeFile({ go, params }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState(null)
  const [cleaned, setCleaned] = useState(true)
  const [played, setPlayed] = useState(false)
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    api.fileView(params?.fileId).then(setView).catch(setError)
  }, [params?.fileId])

  if (error) return <p role="alert">{error.message} {error.fix}</p>
  if (!view) return <InlineLoading description="Loading the file..." />

  const cols = view.columns
  const col = picked === null ? null : cols[picked]
  const headerRow = view.rows.find((r) => r.kind === 'header')
  const held = view.rows.filter((r) => r.kind === 'held')

  return (
    <div className="seefile">
      <div className="seefile-top">
        <div>
          <h1>{view.source_file}</h1>
          <p>Click any column to see what it became and why.</p>
        </div>
        <ContentSwitcher
          size="lg"
          selectedIndex={cleaned ? 1 : 0}
          onChange={({ index }) => { setPlayed(true); setCleaned(index === 1) }}
        >
          <Switch name="raw" text="Your file" />
          <Switch name="clean" text="Cleaned" />
        </ContentSwitcher>
      </div>

      <div className="seefile-scroll">
        <table className="seefile-grid">
          <caption className="cds--visually-hidden">First 50 lines of {view.source_file}</caption>
          <tbody>
            {view.rows.map((row) => {
              const line = <Line key={row.source_row} row={row} columns={cols} cleaned={cleaned} play={played} />
              if (row.kind !== 'header') return line
              return [
                <tr key="tags" className="seefile-tags">
                  <td />
                  {cols.map((c) => (
                    <td key={c.position}>
                      <span className={`seefile-tag${c.field === 'extra' ? ' seefile-tag-extra' : ''}`}>
                        {SHOWN[c.field]}
                      </span>
                    </td>
                  ))}
                </tr>,
                <tr key="head" className="seefile-header">
                  <th scope="row" className="seefile-num">{row.source_row}</th>
                  {cols.map((c, i) => (
                    <th key={c.position} scope="col" className={picked === i ? 'seefile-picked' : ''}>
                      <button type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}>
                        {headerRow.raw[i]}
                      </button>
                    </th>
                  ))}
                </tr>,
              ]
            })}
          </tbody>
        </table>
      </div>

      {col && (
        <div className="seefile-summary" role="status">
          <p>
            <strong>{col.header} became {SHOWN[col.field]}.</strong> {WHO[col.decided_by]}.
            {' '}Changed in {col.rows_changed} {col.rows_changed === 1 ? 'row' : 'rows'}.
          </p>
          <Link href="#" onClick={(e) => { e.preventDefault(); go('check', { fileId: view.file_id }) }}>
            Change
          </Link>
        </div>
      )}

      <div className="seefile-foot">
        <span>
          {held.map((r) => (
            <span key={r.source_row} className="seefile-reason">
              <WarningAltFilled size={16} aria-hidden="true" /> Row {r.source_row} held back: {r.reason_text}
            </span>
          ))}
          <span>Struck-through text is what the file said before</span>
        </span>
        <Link href="#" onClick={(e) => { e.preventDefault(); go('files') }}>Back to files</Link>
      </div>
    </div>
  )
}

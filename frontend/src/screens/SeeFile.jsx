import { useEffect, useState } from 'react'
import { ContentSwitcher, Switch, InlineLoading, Search, Select, SelectItem, Button, Modal, RadioButtonGroup, RadioButton, Checkbox } from '@carbon/react'
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

const DID = {
  time: 'Times written one way', machine: 'Machine names made the same', lot: 'Lot numbers made the same',
  part: 'Part names made the same', quantity: 'Quantities made the same', operator: 'Operator names made the same',
  shift: 'Shifts made the same', step: 'Steps made the same', alarm: 'Machine stops made the same',
  extra: 'Extra details tidied',
}

function whatCleaningDid(view) {
  const sums = {}
  view.columns.forEach((c) => { sums[c.field] = (sums[c.field] || 0) + c.rows_changed })
  const items = Object.keys(sums).filter((f) => sums[f] > 0).map((f) => `${DID[f]}: ${sums[f]} ${sums[f] === 1 ? 'row' : 'rows'}`)
  const first = view.total_rows > view.rows.length ? ` (in the first ${view.rows.length} lines)` : ''
  const skipped = view.rows.filter((r) => r.kind === 'skipped').length
  const held = view.rows.filter((r) => r.kind === 'held').length
  if (skipped) items.push(`Title and blank rows skipped: ${skipped}${first}`)
  if (held) items.push(`Held back for you to check: ${held}${first}`)
  return items
}

function heldSummary(held) {
  const by = {}
  held.forEach((r) => { by[r.reason_text] = (by[r.reason_text] || 0) + 1 })
  const parts = Object.keys(by).map((k) => `${by[k]} ${k}`).join(', ')
  return `${held.length} ${held.length === 1 ? 'row' : 'rows'} held back: ${parts}`
}

// Extra columns that hold seconds since 1970 (machine clocks) are shown as readable times.
const SECONDS = /^1\d{9}(\.\d+)?$/
function clockColumns(view) {
  const data = view.rows.filter((r) => r.kind === 'entry' || r.kind === 'held')
  return new Set(view.columns.map((c, i) => i).filter((i) => {
    if (view.columns[i].field !== 'extra') return false
    const vals = data.map((r) => (r.raw[i] || '').trim()).filter(Boolean)
    return vals.length > 0 && vals.every((v) => SECONDS.test(v))
  }))
}
const clockText = (v) => new Date(Number(v) * 1000).toLocaleString('en-US',
  { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' })
function withClocks(row, clocks) {
  if (!clocks.size || (row.kind !== 'entry' && row.kind !== 'held')) return row
  const clean = row.raw.map((v, i) => (clocks.has(i) && SECONDS.test((v || '').trim())
    ? clockText(v) : row.clean ? row.clean[i] : null))
  return { ...row, clean }
}

function Line({ row, columns, cleaned, play, onCell }) {
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
        <td key={i} onClick={() => onCell && onCell(i, cleaned && row.clean && row.clean[i] ? row.clean[i] : v)}
          className={cleaned && row.clean && row.clean[i] !== null && row.clean[i] !== undefined && row.clean[i] !== v ? 'seefile-changed' : ''}>
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

function DownloadModal({ fileId, filter, onClose }) {
  const [version, setVersion] = useState('cleaned')
  const [format, setFormat] = useState('csv')
  const [dates, setDates] = useState('iso')
  const [held, setHeld] = useState(false)
  const [useFilter, setUseFilter] = useState(true)
  const original = version === 'original'
  const options = original ? { version } : { version, format, dates, held, ...(useFilter ? filter : {}) }
  return (
    <Modal open passiveModal modalHeading="Download this file" onRequestClose={onClose} className="seefile-modal">
      <RadioButtonGroup legendText="Which version?" name="version" valueSelected={version} onChange={setVersion}>
        <RadioButton labelText="Cleaned" value="cleaned" id="dl-cleaned" />
        <RadioButton labelText="Your original file" value="original" id="dl-original" />
      </RadioButtonGroup>
      <RadioButtonGroup legendText="File type" name="format" valueSelected={format} onChange={setFormat} disabled={original}>
        <RadioButton labelText="CSV, opens anywhere" value="csv" id="dl-csv" disabled={original} />
        <RadioButton labelText="Excel" value="xlsx" id="dl-xlsx" disabled={original} />
      </RadioButtonGroup>
      <RadioButtonGroup legendText="Dates look like" name="dates" valueSelected={dates} onChange={setDates} disabled={original}>
        <RadioButton labelText="2021-05-03 06:01" value="iso" id="dl-iso" disabled={original} />
        <RadioButton labelText="05/03/2021 6:01 AM" value="us" id="dl-us" disabled={original} />
      </RadioButtonGroup>
      <Checkbox id="dl-held" labelText="Include held-back rows" checked={held} disabled={original}
        onChange={(_, { checked }) => setHeld(checked)} />
      {Object.keys(filter).length > 0 && (
        <Checkbox id="dl-filter" labelText="Only the rows that match your filter" checked={useFilter} disabled={original}
          onChange={(_, { checked }) => setUseFilter(checked)} />
      )}
      <a className="cds--btn cds--btn--primary seefile-dl" href={api.downloadUrl(fileId, options)} download>Download</a>
    </Modal>
  )
}

export default function SeeFile({ go, params }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState(null)
  const [cleaned, setCleaned] = useState(true)
  const [played, setPlayed] = useState(false)
  const [picked, setPicked] = useState(null)
  const [typed, setTyped] = useState('')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [cell, setCell] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setQ(typed.trim()), 300)
    return () => clearTimeout(t)
  }, [typed])

  const filter = {}
  if (q) filter.q = q
  if (kind) filter.kind = kind
  if (cell) { filter.column = cell.column; filter.value = cell.value }

  useEffect(() => {
    api.fileView(params?.fileId, filter).then(setView).catch(setError)
  }, [params?.fileId, q, kind, cell]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p role="alert">{error.message} {error.fix}</p>
  if (!view) return <InlineLoading description="Loading the file..." />

  const cols = view.columns
  const col = picked === null ? null : cols[picked]
  const headerRow = view.rows.find((r) => r.kind === 'header')
  const held = view.rows.filter((r) => r.kind === 'held')
  const clocks = clockColumns(view)

  return (
    <div className="seefile">
      <div className="seefile-top">
        <div>
          <h1>{view.source_file}</h1>
          <p className="subtle">Click a column name to see what it became.</p>
          <p className="subtle">Then click a cell to show only rows like it.</p>
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

      <div className="seefile-tools">
        <Search size="lg" labelText="Find in this file" placeholder="Find in this file" value={typed}
          onChange={(e) => setTyped(e.target.value)} />
        <Select id="seefile-show" size="lg" labelText="Show" value={kind} onChange={(e) => setKind(e.target.value)}>
          <SelectItem value="" text="All rows" />
          <SelectItem value="entry" text="Saved rows" />
          <SelectItem value="held" text="Held back" />
        </Select>
        <Button kind="tertiary" onClick={() => setSaving(true)}>Download</Button>
      </div>
      {(cell || view.matching !== undefined) && (
        <p className="seefile-filters">
          {cell && (
            <span className="seefile-chip">
              Only rows where {cell.header} is {cell.value}
              <button type="button" aria-label="Clear this filter" onClick={() => setCell(null)}>×</button>
            </span>
          )}
          {view.matching !== undefined && <strong>{view.matching} {view.matching === 1 ? 'row matches' : 'rows match'}</strong>}
        </p>
      )}
      {saving && <DownloadModal fileId={view.file_id} filter={filter} onClose={() => setSaving(false)} />}

      <ul className="seefile-did" aria-label="What cleaning did">
        {whatCleaningDid(view).map((t) => <li key={t}>{t}</li>)}
      </ul>

      <div className="seefile-scroll">
        <table className="seefile-grid">
          <caption className="cds--visually-hidden">First 50 lines of {view.source_file}</caption>
          <tbody>
            {view.rows.map((row) => {
              const line = <Line key={row.source_row} row={withClocks(row, clocks)} columns={cols} cleaned={cleaned} play={played}
                onCell={picked === null ? null : (i, v) => setCell({ column: i, value: v, header: headerRow.raw[i] })} />
              if (row.kind !== 'header') return line
              return [
                <tr key="tags" className="seefile-tags">
                  <td />
                  {cols.map((c) => (
                    <td key={c.position}>
                      <span className={`seefile-tag${c.field === 'extra' ? ' seefile-tag-extra' : ''}`}>
                        {clocks.has(cols.indexOf(c)) ? 'Extra detail: a time' : SHOWN[c.field]}
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
          <button type="button" className="link-btn" onClick={() => go('check', { fileId: view.file_id })}>Change</button>
        </div>
      )}

      <div className="seefile-foot">
        <span>
          {held.length > 0 && (
            <span className="seefile-reason">
              <WarningAltFilled size={16} aria-hidden="true" /> {heldSummary(held)}{' '}
              <button type="button" className="link-btn" onClick={() => setKind(kind === 'held' ? '' : 'held')}>
                {kind === 'held' ? 'Show all rows' : 'Show them'}
              </button>
            </span>
          )}
          <span>Struck-through text is what the file said before</span>
        </span>
        <button type="button" className="link-btn" onClick={() => go('files')}>Back to files</button>
      </div>
    </div>
  )
}

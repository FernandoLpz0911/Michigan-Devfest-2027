import { useEffect, useState } from 'react'
import {
  Checkbox, ContentSwitcher, DataTable, Dropdown, Pagination, Search, Switch, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Tag, TextInput,
} from '@carbon/react'
import { Warning } from '@carbon/icons-react'
import { api } from '../api.js'
import { FadeCell } from '../parts/SwitchCell.jsx'
import './AllRecords.css'

const EMPTY = { q: null, machine: null, shift: null, date_from: null, date_to: null, stop: null, only_cleaned: false, only_held: false }
const stopText = (code) => `Machine stop, code ${String(code).replace(/\D/g, '').replace(/^0+(?=\d)/, '')}`
const shortStop = (code) => `Stop code ${String(code).replace(/\D/g, '').replace(/^0+(?=\d)/, '')}`
const when = (t) => {
  const [d, h] = t.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = (h || '00:00').split(':').map(Number)
  return new Date(y, m - 1, day, hh, mm).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
const day = (d) => new Date(...d.split('-').map((n, i) => (i === 1 ? n - 1 : Number(n)))).toLocaleDateString('en-US', { dateStyle: 'medium' })

const CLEAN_HEADERS = ['Lot', 'Time', 'Machine', 'Part', 'Operator', 'Shift', 'Step', 'Good', 'Stop', 'From']
const RAW_HEADERS = ['Lot', 'What the file said', 'From']

function cells(row, raw) {
  const from = `${row.source_file}, row ${row.source_row}`
  if (row.reason) return [row.original_row && Object.values(row.original_row)[0], `Held back: ${row.reason_text}`, from]
  if (raw) return [row.lot, Object.values(row.original_row).join(' | '), from]
  return [row.lot, when(row.time), row.machine, row.part, row.operator, row.shift, row.step, row.quantity,
    row.alarm ? <span key="s"><Warning size={16} aria-hidden="true" /> {stopText(row.alarm)}</span> : '', from]
}

export default function AllRecords({ go, params }) {
  const [filters, setFilters] = useState({ ...EMPTY, ...(params?.filters || {}) })
  const [pageNo, setPageNo] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(false)
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    let live = true
    api.records({ ...filters, page: pageNo }).then(
      (d) => { if (live) { setData(d); setError(null) } },
      (e) => { if (live) setError(e) })
    return () => { live = false }
  }, [filters, pageNo])

  const change = (patch) => { setFilters((f) => ({ ...f, ...patch })); setPageNo(1) }
  const opts = data?.options || { machine: [], shift: [], stop: [] }
  const chips = []
  if (filters.q) chips.push(['q', `Search: ${filters.q}`, { q: null }])
  if (filters.machine) chips.push(['machine', filters.machine, { machine: null }])
  if (filters.shift) chips.push(['shift', `Shift ${filters.shift}`, { shift: null }])
  if (filters.stop) chips.push(['stop', shortStop(filters.stop), { stop: null }])
  if (filters.date_from || filters.date_to) {
    const text = filters.date_from && filters.date_to ? `${day(filters.date_from)} to ${day(filters.date_to)}`
      : filters.date_from ? `From ${day(filters.date_from)}` : `Until ${day(filters.date_to)}`
    chips.push(['dates', text, { date_from: null, date_to: null }])
  }

  const pick = (key, label, items, show = (x) => x) => (
    <Dropdown id={`f-${key}`} className="records-dropdown" titleText={label} label="Any" size="lg"
      items={[null, ...items]} itemToString={(x) => (x === null ? 'Any' : show(x))}
      selectedItem={filters[key]} onChange={({ selectedItem }) => change({ [key]: selectedItem })} />
  )
  const headers = (raw ? RAW_HEADERS : CLEAN_HEADERS).map((h) => ({ key: h, header: h }))
  const rows = (data?.rows || []).map((r, i) => ({ id: String(i), r }))

  return (
    <div className="records">
      <h1>All records</h1>
      <ContentSwitcher size="lg" className="records-switch" selectedIndex={raw ? 0 : 1}
        onChange={({ index }) => { setPlayed(true); setRaw(index === 0) }}>
        <Switch name="raw" text="Your files" />
        <Switch name="clean" text="Cleaned" />
      </ContentSwitcher>
      {error && <p role="alert" className="records-error"><strong>{error.message}</strong> {error.fix}</p>}
      <div className="records-filters">
        <Search size="lg" labelText="Search lot, part, operator" placeholder="Search lot, part, operator..."
          value={filters.q || ''} onChange={(e) => change({ q: e.target.value || null })} />
        {pick('machine', 'Machine', opts.machine)}
        {pick('shift', 'Shift', opts.shift)}
        {pick('stop', 'Stop code', opts.stop, shortStop)}
        <TextInput id="f-from" type="date" labelText="Dates from" min={opts.date_min} max={opts.date_max}
          value={filters.date_from || ''} onChange={(e) => change({ date_from: e.target.value || null })} />
        <TextInput id="f-to" type="date" labelText="Dates to" min={opts.date_min} max={opts.date_max}
          value={filters.date_to || ''} onChange={(e) => change({ date_to: e.target.value || null })} />
      </div>
      <div className="records-checks">
        <Checkbox id="only-cleaned" labelText="Only rows that were cleaned" checked={filters.only_cleaned}
          onChange={(_, { checked }) => change({ only_cleaned: checked })} />
        <Checkbox id="only-held" labelText="Only rows held back" checked={filters.only_held}
          onChange={(_, { checked }) => change({ only_held: checked })} />
        <div className="records-chips">
          {chips.map(([key, text, patch]) => (
            <Tag key={key} type="gray" filter onClose={() => change(patch)} title={`Remove filter ${text}`}>{text}</Tag>
          ))}
          {chips.length > 0 && (
            <button type="button" className="link-button" onClick={() => { setFilters({ ...EMPTY }); setPageNo(1) }}>
              Clear all
            </button>
          )}
        </div>
      </div>
      {data && <p className="records-count" aria-live="polite"><strong>{data.matching}</strong> of {data.total} records match</p>}
      {data && (
        <DataTable rows={rows} headers={headers}>
          {({ rows: tableRows, headers: heads, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()} aria-label="All records">
              <TableHead>
                <TableRow>{heads.map((h) => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((tr, i) => {
                  const entry = data.rows[Number(tr.id)]
                  // DataTable keeps the previous rows for one render after a filter shrinks the list.
                  if (!entry) return null
                  const values = cells(entry, raw)
                  return (
                    <TableRow {...getRowProps({ row: tr })} key={tr.id} className="records-row"
                      onClick={() => entry.lot && go('find', { lot: entry.lot })}>
                      {values.map((v, c) => (
                        <TableCell key={c}>
                          {c === 0 && entry.lot
                            ? <button type="button" className="link-button" onClick={(e) => { e.stopPropagation(); go('find', { lot: entry.lot }) }}>{v}</button>
                            : <FadeCell play={played && c > 0} index={c}>{v}</FadeCell>}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DataTable>
      )}
      {data && (
        <Pagination page={pageNo} pageSize={50} pageSizes={[50]} totalItems={data.matching}
          onChange={({ page }) => setPageNo(page)} />
      )}
      <p className="records-foot">
        <span>Click a row to see its whole lot.</span>
        <a href={api.recordsCsvUrl(filters)}>Download these as CSV</a>
      </p>
    </div>
  )
}

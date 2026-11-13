const mins = (t) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16))
const hhmm = (t) => t.slice(11, 16)
const stopNumber = (code) => String(parseInt(String(code).replace(/\D/g, '') || '0', 10))
const ROLE_WORDS = { this: 'this lot', worth_checking: 'worth checking', other: 'not linked by machine or stop' }

// Vertical layout (px). Labels that sit side by side alternate between two rows so they never touch.
const STOP_ROWS = [0, 22]
const BLOCK_TOP = 60
const BLOCK_H = 28
const HOUR_ROWS = [BLOCK_TOP + BLOCK_H + 26, BLOCK_TOP + BLOCK_H + 46]
const HEIGHT = HOUR_ROWS[1] + 18

export default function TimelineStrip({ timeline }) {
  const { lots, stops, machine, day } = timeline
  const onStrip = lots.filter((l) => l.role !== 'other')
  const all = [...lots.map((l) => mins(l.start)), ...lots.map((l) => mins(l.end)), ...stops.map((s) => mins(s.time))]
  const from = Math.floor(Math.min(...all) / 60) * 60
  const to = Math.max(from + 60, Math.ceil(Math.max(...all) / 60) * 60)
  const pct = (m) => ((m - from) / (to - from)) * 100
  const hours = []
  for (let m = from; m <= to; m += 60) hours.push(m)

  return (
    <section aria-label="Lot timeline" className="timeline-strip">
      <h3>{machine}, {day}</h3>
      <div aria-hidden="true" style={{ position: 'relative', height: HEIGHT, margin: '0 24px' }}>
        {hours.map((m, i) => (
          <span key={m} style={{ position: 'absolute', left: `${pct(m)}%`, top: HOUR_ROWS[i % 2], fontSize: 12, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            {String(m / 60).padStart(2, '0')}:00
          </span>
        ))}
        {[...stops].sort((x, y) => mins(x.time) - mins(y.time)).map((s, i) => (
          <span key={i} data-testid="stop" style={{ position: 'absolute', left: `${pct(mins(s.time))}%`, top: STOP_ROWS[i % 2], transform: 'translateX(-50%)', fontSize: 12, lineHeight: '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            stop {stopNumber(s.code)}<br />&#9660;
            {/* A thin line from the arrow down to the blocks. */}
            <span style={{ display: 'block', margin: '0 auto', width: 1, height: BLOCK_TOP - STOP_ROWS[i % 2] - 30, background: 'currentColor', opacity: 0.5 }} />
          </span>
        ))}
        {onStrip.map((l, i) => {
          const left = pct(mins(l.start))
          const width = pct(mins(l.end)) - left
          const dark = l.role === 'this'
          return (
            <div key={l.lot} data-testid={`block-${l.lot}`} className={`tl-block${dark ? ' tl-this' : ''}${dark && width <= 12 ? ' tl-narrow' : ''}`} style={{ position: 'absolute', top: BLOCK_TOP, height: BLOCK_H, left: `${left}%`, width: `${width}%`, boxSizing: 'border-box', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', background: dark ? '#161616' : 'transparent', border: '2px solid #161616' }}>
              <span className="tl-label" style={{ position: 'absolute', top: 4, fontWeight: dark ? 600 : 400, left: 2, whiteSpace: 'nowrap', fontSize: 12, color: dark && width > 12 ? '#fff' : '#161616', transform: dark && width <= 12 ? `translateY(${BLOCK_H - 2}px)` : 'none' }}>
                {l.lot}
              </span>
            </div>
          )
        })}
      </div>
      <details className="timeline-list">
        <summary>Read this as a list</summary>
        <ul>
        {lots.map((l) => (
          <li key={l.lot}>Lot {l.lot}: {hhmm(l.start)} to {hhmm(l.end)}, {ROLE_WORDS[l.role]}</li>
        ))}
        {stops.map((s, i) => (
          <li key={`s${i}`}>Machine stop {stopNumber(s.code)} at {hhmm(s.time)}</li>
        ))}
        </ul>
      </details>
    </section>
  )
}

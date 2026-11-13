const mins = (t) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16))
const hhmm = (t) => t.slice(11, 16)
const stopNumber = (code) => String(parseInt(String(code).replace(/\D/g, '') || '0', 10))
const ROLE_WORDS = { this: 'this lot', worth_checking: 'worth checking', other: 'not linked by machine or stop' }

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
    <section aria-label="Lot timeline">
      <p>{machine}, {day}</p>
      <div aria-hidden="true" style={{ position: 'relative', height: 96, margin: '0 24px' }}>
        {hours.map((m) => (
          <span key={m} style={{ position: 'absolute', left: `${pct(m)}%`, bottom: 0, fontSize: 12, transform: 'translateX(-50%)' }}>
            {String(m / 60).padStart(2, '0')}:00
          </span>
        ))}
        {stops.map((s, i) => (
          <span key={i} data-testid="stop" style={{ position: 'absolute', left: `${pct(mins(s.time))}%`, top: 0, transform: 'translateX(-50%)', fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>
            stop {stopNumber(s.code)}<br />&#9660;
          </span>
        ))}
        {onStrip.map((l, i) => {
          const left = pct(mins(l.start))
          const width = pct(mins(l.end)) - left
          const dark = l.role === 'this'
          return (
            <div key={l.lot} data-testid={`block-${l.lot}`} style={{ position: 'absolute', top: 36, height: 28, left: `${left}%`, width: `${width}%`, boxSizing: 'border-box', background: dark ? '#161616' : 'transparent', border: '2px solid #161616' }}>
              <span style={{ position: 'absolute', top: dark ? 4 : 4, left: 2, whiteSpace: 'nowrap', fontSize: 12, color: dark && width > 12 ? '#fff' : '#161616', transform: dark && width <= 12 ? 'translateY(-34px)' : 'none' }}>
                {l.lot}
              </span>
            </div>
          )
        })}
      </div>
      <ul>
        {lots.map((l) => (
          <li key={l.lot}>Lot {l.lot}: {hhmm(l.start)} to {hhmm(l.end)}, {ROLE_WORDS[l.role]}</li>
        ))}
        {stops.map((s, i) => (
          <li key={`s${i}`}>Machine stop {stopNumber(s.code)} at {hhmm(s.time)}</li>
        ))}
      </ul>
    </section>
  )
}

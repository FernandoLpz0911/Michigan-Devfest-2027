import './SwitchCell.css'

// One cell that changes when the Your file / Cleaned switch flips.
// Unchanged cells (no clean value, or same as raw) render plain text and never move.
// play: true after a flip, so the fade and slide run; index: column number for the stagger.
// Stored times (2021-05-03T00:10) are shown the way people write them.
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const readable = (v) => {
  const m = typeof v === 'string' && v.match(ISO)
  if (!m) return v
  const [, y, mo, d, h, mi] = m.map(Number)
  return new Date(y, mo - 1, d, h, mi).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function SwitchCell({ raw, clean, cleaned, play = false, index = 0 }) {
  const changed = clean !== null && clean !== undefined && clean !== raw
  if (!changed) return raw
  const style = { '--col': index }
  return (
    <span className={play ? 'sw-play' : ''} style={style}>
      <span className="sw-new">{cleaned ? readable(clean) : raw}</span>
      {cleaned && (
        // Not struck through: the original was not wrong, only written another way.
        <s className="sw-old seefile-old">was {raw}</s>
      )}
    </span>
  )
}

// For tables whose columns differ between the two views: the whole cell fades in, staggered by column.
export function FadeCell({ play, index, children }) {
  if (!play) return children
  return <span className="sw-play" style={{ '--col': index }}><span className="sw-new">{children}</span></span>
}

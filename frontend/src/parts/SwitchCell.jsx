import './SwitchCell.css'

// One cell that changes when the Your file / Cleaned switch flips.
// Unchanged cells (no clean value, or same as raw) render plain text and never move.
// play: true after a flip, so the fade and slide run; index: column number for the stagger.
export default function SwitchCell({ raw, clean, cleaned, play = false, index = 0 }) {
  const changed = clean !== null && clean !== undefined && clean !== raw
  if (!changed) return raw
  const style = { '--col': index }
  return (
    <span className={play ? 'sw-play' : ''} style={style}>
      <span className="sw-new">{cleaned ? clean : raw}</span>
      {cleaned && (
        <s className="sw-old seefile-old"><span className="cds--visually-hidden">was </span>{raw}</s>
      )}
    </span>
  )
}

// For tables whose columns differ between the two views: the whole cell fades in, staggered by column.
export function FadeCell({ play, index, children }) {
  if (!play) return children
  return <span className="sw-play" style={{ '--col': index }}><span className="sw-new">{children}</span></span>
}

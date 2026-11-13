import React from 'react'

// toolSeconds: the app's own timer (paste or typed lot to reply shown).
// handTimeMinutes: from the Settings value; null or '' hides the hand time.
export default function TimeSavedLine({ toolSeconds, handTimeMinutes }) {
  const hasHand = handTimeMinutes !== null && handTimeMinutes !== undefined && handTimeMinutes !== ''
  return (
    <div className="time-saved-line" style={{ display: 'flex', gap: '3rem' }}>
      <div>
        <div style={{ fontSize: '2.5rem' }}>{toolSeconds} s</div>
        <div>to answer with this tool</div>
      </div>
      {hasHand && (
        <div>
          <div style={{ fontSize: '2.5rem' }}>{handTimeMinutes} min</div>
          <div>by hand, timed on Friday</div>
        </div>
      )}
    </div>
  )
}

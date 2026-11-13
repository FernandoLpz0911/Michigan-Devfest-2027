// One question: a group of choices, Granite's guess pre-selected and named as a guess.
// Native radio buttons give arrow keys inside the card and Tab between cards.
export default function QuestionCard({ question, value, onChange }) {
  const { question_id: id, title, sentence, choices } = question
  return (
    <fieldset className="question-card" style={{ border: 0, padding: 0, margin: '2rem 0' }}>
      <legend style={{ fontWeight: 600, fontSize: '1.25rem' }}>{title}</legend>
      <p>{sentence}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {choices.map((c) => {
          const checked = value === c.value
          return (
            <label key={c.value} className="choice"
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minHeight: '3rem', padding: '0 1rem',
                border: checked ? '2px solid #161616' : '1px solid #8d8d8d', cursor: 'pointer' }}>
              <input type="radio" name={id} value={c.value} checked={checked} onChange={() => onChange(c.value)} />
              <span>{c.text}</span>
              {c.samples.length > 0 && <span style={{ fontFamily: 'monospace' }}>{c.samples.join(', ')}</span>}
              {c.granite_guess && <span style={{ marginLeft: 'auto' }}>Granite's guess</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

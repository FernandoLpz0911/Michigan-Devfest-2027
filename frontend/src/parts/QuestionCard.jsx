import './QuestionCard.css'

// One question: a group of choices, Granite's guess pre-selected and named as a guess.
// Native radio buttons give arrow keys inside the card and Tab between cards.
export default function QuestionCard({ question, value, onChange }) {
  const { question_id: id, title, sentence, choices } = question
  return (
    <fieldset className="question-card">
      <legend className="question-title">{title}</legend>
      <p>{sentence}</p>
      <div className="choices">
        {choices.map((c) => {
          const checked = value === c.value
          return (
            <label key={c.value} className={checked ? 'choice choice-checked' : 'choice'}>
              <input type="radio" name={id} value={c.value} checked={checked} onChange={() => onChange(c.value)} />
              <span className="choice-body">
                <span className="choice-text">{c.text}</span>
                {c.samples.length > 0 && <span className="choice-samples">{c.samples.join(', ')}</span>}
              </span>
              {c.granite_guess && <span className="choice-guess">Granite's guess</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

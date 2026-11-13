const MARK = { done: '✓', current: '●', waiting: '○', not_needed: '○' }
const WORD = { done: 'Done', current: 'Working now', waiting: 'Waiting', not_needed: 'Not needed' }

export default function StepCard({ step }) {
  return (
    <li className={`step-card step-${step.state}`}>
      <span className="step-mark" aria-hidden="true">{MARK[step.state]}</span>
      <div>
        <strong>{step.title}</strong> <span className="step-state">({WORD[step.state]})</span>
        <div>{step.detail}</div>
      </div>
    </li>
  )
}

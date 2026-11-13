import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import StepCard from './StepCard.jsx'

test('shows title, detail and a word for the state', () => {
  render(<ul><StepCard step={{ step: 'granite', state: 'not_needed', title: 'Asked IBM Granite', detail: 'Skipped.' }} /></ul>)
  expect(screen.getByText('Asked IBM Granite')).toBeTruthy()
  expect(screen.getByText('(Not needed)')).toBeTruthy()
})

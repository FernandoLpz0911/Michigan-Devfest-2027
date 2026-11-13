import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('app shell renders the header and the Files screen', () => {
  render(<App />)
  expect(screen.getByText('Data Wrapper')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import canned from '../../../fixtures/canned/file_view.json'
import App from '../App.jsx'
import SeeFile from '../screens/SeeFile.jsx'
import { useShopFloor } from './ShopFloorToggle.jsx'

vi.mock('../api.js', () => ({
  api: {
    listFiles: vi.fn(() => new Promise(() => {})),
    fileView: vi.fn(() => Promise.resolve(canned)),
  },
}))
afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear() })

function Probe() { const [on] = useShopFloor(); return <p>{on ? 'dark' : 'light'}</p> }

describe('ShopFloorToggle', () => {
  it('has a name, works by keyboard, and is remembered', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const t = screen.getByRole('switch', { name: /shop-floor mode/i })
    expect(container.querySelector('.shop-floor')).toBeNull()
    t.focus()
    await user.keyboard(' ')
    expect(container.querySelector('.shop-floor')).not.toBeNull()
    expect(window.localStorage.getItem('datawrapper.shopFloor')).toBe('1')
  })
  it('starts dark when remembered', () => {
    window.localStorage.setItem('datawrapper.shopFloor', '1')
    render(<Probe />)
    expect(screen.getByText('dark')).toBeTruthy()
  })
  it('falls back to light when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('no') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('no') })
    const user = userEvent.setup()
    const { container } = render(<App />)
    expect(container.querySelector('.shop-floor')).toBeNull()
    await user.click(screen.getByRole('switch', { name: /shop-floor mode/i }))
    expect(container.querySelector('.shop-floor')).not.toBeNull()
  })
  it('passes axe in shop-floor mode (Files and See the file)', async () => {
    window.localStorage.setItem('datawrapper.shopFloor', '1')
    const { container } = render(<App />)
    expect((await axe(container)).violations).toEqual([])
    const see = render(<div className="shop-floor"><SeeFile go={vi.fn()} params={{ fileId: 'f1' }} /></div>)
    await screen.findByRole('heading', { name: 'shift1_log.csv' })
    expect((await axe(see.container)).violations).toEqual([])
  })
})

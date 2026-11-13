import { useState } from 'react'
import { Toggle } from '@carbon/react'
import './shopfloor.css'

const KEY = 'datawrapper.shopFloor'

export function useShopFloor() {
  const [on, setOn] = useState(() => {
    try { return window.localStorage.getItem(KEY) === '1' } catch { return false }
  })
  const set = (value) => {
    setOn(value)
    try { window.localStorage.setItem(KEY, value ? '1' : '0') } catch { /* stays for this visit only */ }
  }
  return [on, set]
}

export default function ShopFloorToggle({ on, onChange }) {
  return (
    <div className="shopfloor-toggle">
      <Toggle id="shop-floor" size="sm" labelText="Shop-floor mode" hideLabel
        toggled={!!on} onToggle={(checked) => onChange(checked)} />
    </div>
  )
}

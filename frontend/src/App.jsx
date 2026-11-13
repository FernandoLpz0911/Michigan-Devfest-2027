import { useState } from 'react'
import { Header, HeaderName, HeaderNavigation, HeaderMenuItem, HeaderGlobalBar, Theme } from '@carbon/react'
import Files from './screens/Files.jsx'
import Check from './screens/Check.jsx'
import FindRecord from './screens/FindRecord.jsx'
import SeeFile from './screens/SeeFile.jsx'
import AllRecords from './screens/AllRecords.jsx'
import ShopFloorToggle, { useShopFloor } from './theme/ShopFloorToggle.jsx'

// Screens are chosen by plain state, no router. Every screen gets { go, params }.
// go('files') | go('check', { fileId, result }) | go('find', { lot }) | go('seefile', { fileId }) | go('records')
// Grid screens need more room than the reading column.
const WIDE = new Set(['seefile', 'records'])
const SCREENS = { files: Files, check: Check, find: FindRecord, seefile: SeeFile, records: AllRecords }

const VIEW_KEY = 'dw.view'

function loadView() {
  try {
    const v = JSON.parse(sessionStorage.getItem(VIEW_KEY))
    if (v && SCREENS[v.screen]) return { screen: v.screen, params: v.params || {} }
  } catch { /* storage blocked or unreadable: start on Files */ }
  return { screen: 'files', params: {} }
}

function saveView(view) {
  try {
    // A Check result is kept by api.js under its file id, so only the id is stored here.
    const { result, ...params } = view.params
    if (result?.file_id) params.fileId = result.file_id
    sessionStorage.setItem(VIEW_KEY, JSON.stringify({ screen: view.screen, params }))
  } catch { /* storage blocked: the app works as before */ }
}

export default function App() {
  const [view, setView] = useState(loadView)
  const [shopFloor, setShopFloor] = useShopFloor()
  const go = (screen, params = {}) => {
    const next = { screen, params }
    saveView(next)
    setView(next)
  }
  const Screen = SCREENS[view.screen]

  return (
    <Theme theme={shopFloor ? 'g100' : 'white'} className={shopFloor ? 'shop-floor' : ''}>
      <Header aria-label="LotTrail" className="app-header">
        <HeaderName prefix="" href="#" onClick={(e) => { e.preventDefault(); go('files') }}>
          LotTrail
        </HeaderName>
        <HeaderGlobalBar>
          <ShopFloorToggle on={shopFloor} onChange={setShopFloor} />
        </HeaderGlobalBar>
        <HeaderNavigation aria-label="Screens">
          <HeaderMenuItem href="#" isActive={['files', 'check', 'seefile'].includes(view.screen)} onClick={(e) => { e.preventDefault(); go('files') }}>
            Files
          </HeaderMenuItem>
          <HeaderMenuItem href="#" isActive={view.screen === 'records'} onClick={(e) => { e.preventDefault(); go('records') }}>
            All records
          </HeaderMenuItem>
          <HeaderMenuItem href="#" isActive={view.screen === 'find'} onClick={(e) => { e.preventDefault(); go('find') }}>
            Find a record
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>
      <main className={`app-main${WIDE.has(view.screen) ? ' wide' : ''}`} id="main">
        <Screen go={go} params={view.params} />
      </main>
    </Theme>
  )
}

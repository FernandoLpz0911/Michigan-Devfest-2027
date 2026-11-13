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
const SCREENS = { files: Files, check: Check, find: FindRecord, seefile: SeeFile, records: AllRecords }

export default function App() {
  const [view, setView] = useState({ screen: 'files', params: {} })
  const [shopFloor, setShopFloor] = useShopFloor()
  const go = (screen, params = {}) => setView({ screen, params })
  const Screen = SCREENS[view.screen]
  const onFind = view.screen === 'find'

  return (
    <Theme theme={shopFloor ? 'g100' : 'white'} className={shopFloor ? 'shop-floor' : ''}>
      <Header aria-label="Data Wrapper">
        <HeaderName prefix="" href="#" onClick={(e) => { e.preventDefault(); go('files') }}>
          Data Wrapper
        </HeaderName>
        <HeaderNavigation aria-label="Screens">
          <HeaderMenuItem href="#" isActive={!onFind} onClick={(e) => { e.preventDefault(); go('files') }}>
            Files
          </HeaderMenuItem>
          <HeaderMenuItem href="#" isActive={onFind} onClick={(e) => { e.preventDefault(); go('find') }}>
            Find a record
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <ShopFloorToggle on={shopFloor} onChange={setShopFloor} />
        </HeaderGlobalBar>
      </Header>
      <main className="app-main" id="main">
        <Screen go={go} params={view.params} />
      </main>
    </Theme>
  )
}

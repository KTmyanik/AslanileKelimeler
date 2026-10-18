import { useState } from 'react'
import { BadgeToast } from './components/BadgeToast'
import { Cards } from './screens/Cards'
import { DailyMission } from './screens/DailyMission'
import { HintGame } from './screens/HintGame'
import { Home } from './screens/Home'
import { ListenPick } from './screens/ListenPick'
import { MatchGame } from './screens/MatchGame'
import { MemoryGame } from './screens/MemoryGame'
import { ParentArea } from './screens/parent/ParentArea'
import { RecordGame } from './screens/RecordGame'
import { SentenceGame } from './screens/SentenceGame'
import { SpellGame } from './screens/SpellGame'
import { Rewards } from './screens/Rewards'
import type { Screen } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const home = () => setScreen('home')

  return (
    <div className="min-h-dvh">
      {screen === 'home' && <Home go={setScreen} />}
      {screen === 'cards' && <Cards onHome={home} />}
      {screen === 'listen' && <ListenPick onHome={home} />}
      {screen === 'match' && <MatchGame onHome={home} />}
      {screen === 'memory' && <MemoryGame onHome={home} />}
      {screen === 'spell' && <SpellGame onHome={home} />}
      {screen === 'sentence' && <SentenceGame onHome={home} />}
      {screen === 'daily' && <DailyMission onHome={home} />}
      {screen === 'hint' && <HintGame onHome={home} />}
      {screen === 'record' && <RecordGame onHome={home} />}
      {screen === 'rewards' && <Rewards onHome={home} />}
      {screen === 'parent' && <ParentArea onExit={home} />}
      {screen !== 'parent' && <BadgeToast />}
    </div>
  )
}

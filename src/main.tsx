import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { restoreFromToken } from './migrate'

void restoreFromToken().finally(async () => {
  const { default: App } = await import('./App.tsx')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

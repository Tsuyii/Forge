import { useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { initTheme } from './store/themeStore'

export default function App() {
  useEffect(() => {
    initTheme()
  }, [])

  return <AppLayout />
}

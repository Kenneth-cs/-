import { useEffect, useState } from 'react'
import MainPanel from './windows/MainPanel'
import NoteWindow from './windows/NoteWindow'
import ReviewWindow from './windows/ReviewWindow'

export type MainView = 'main' | 'stats' | 'editor'

// 根据 URL hash 决定渲染哪个独立窗口（note / review）
// 主窗口内部通过 view state 切换 main / stats / editor
export default function App() {
  const [windowType, setWindowType] = useState<'main' | 'note' | 'review'>('main')
  const [mainView, setMainView] = useState<MainView>('main')

  useEffect(() => {
    const detect = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '')
      if (hash === 'note') setWindowType('note')
      else if (hash === 'review') setWindowType('review')
      else setWindowType('main')
    }
    detect()
    window.addEventListener('hashchange', detect)
    return () => window.removeEventListener('hashchange', detect)
  }, [])

  if (windowType === 'note') return <NoteWindow />
  if (windowType === 'review') return <ReviewWindow />
  return <MainPanel view={mainView} onNavigate={setMainView} />
}

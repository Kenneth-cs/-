import { useEffect, useState } from 'react'
import MainPanel from './windows/MainPanel'
import NoteWindow from './windows/NoteWindow'
import ReviewWindow from './windows/ReviewWindow'

export type MainView = 'main' | 'stats' | 'editor' | 'notes'

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

  // 监听主进程推送的 navigate 事件（如「从笔记窗口跳到历史笔记」）
  useEffect(() => {
    window.api.on('navigate', (view) => {
      setMainView(view as MainView)
    })
    return () => window.api.off('navigate')
  }, [])

  if (windowType === 'note') return <NoteWindow />
  if (windowType === 'review') return <ReviewWindow />
  return <MainPanel view={mainView} onNavigate={setMainView} />
}

import { useState, useRef, useEffect } from 'react'

export default function NoteWindow() {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = async () => {
    if (!content.trim()) return
    await window.api.notes.save(content.trim())
    setSaved(true)
    setTimeout(() => {
      setContent('')
      setSaved(false)
      window.api.window.hide()
    }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      window.api.window.hide()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest text-on-surface select-none">
      {/* 标题栏 */}
      <div className="flex items-center px-4 py-2.5 border-b border-outline-variant/30 bg-surface-bright">
        <span className="text-sm font-semibold tracking-tight">📝 快速笔记</span>
        <button
          onClick={() => window.api.window.hide()}
          className="ml-auto text-outline hover:text-on-surface transition-colors text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container"
        >
          ×
        </button>
      </div>

      {/* 输入区 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写点什么..."
        className="flex-1 bg-transparent text-on-surface text-sm px-4 py-3 resize-none outline-none placeholder-outline"
      />

      {/* 底部操作 */}
      <div className="flex items-center px-4 py-2.5 border-t border-outline-variant/30 bg-surface-container-low">
        <button
          onClick={() => window.api.window.openNotes()}
          className="text-xs text-on-surface-variant hover:text-primary transition-colors"
        >
          📋 历史笔记
        </button>
        <span className="text-outline text-xs mx-3 ml-auto">Esc 取消</span>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="px-3 py-1 text-xs text-on-primary bg-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
        >
          {saved ? '已保存 ✓' : '保存  ⌘↩'}
        </button>
      </div>
    </div>
  )
}

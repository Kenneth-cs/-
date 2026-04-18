import { useState, useEffect, useRef } from 'react'

function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y} 年 ${Number(m)} 月 ${Number(day)} 日`
}

export default function ReviewWindow() {
  const [done, setDone] = useState('')
  const [next, setNext] = useState('')
  const [saved, setSaved] = useState(false)
  const [scheduleId, setScheduleId] = useState('')
  const doneRef = useRef<HTMLTextAreaElement>(null)
  const today = todayDate()

  useEffect(() => {
    // 加载已有复盘（如果有）
    Promise.all([
      window.api.daily.get(today),
      window.api.schedules.getActiveId()
    ]).then(([record, activeId]) => {
      setScheduleId(activeId)
      if (record?.review) {
        setDone(record.review.done)
        setNext(record.review.next)
      }
    })
    doneRef.current?.focus()
  }, [today])

  const handleSave = async () => {
    if (!done.trim() && !next.trim()) return
    await window.api.daily.saveReview(today, scheduleId, done.trim(), next.trim())
    setSaved(true)
    setTimeout(() => {
      window.api.window.hide()
    }, 800)
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
    <div className="flex flex-col h-screen bg-surface-container-lowest text-on-surface select-none rounded-xl overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center px-4 h-14 border-b border-outline-variant/30 bg-surface-bright flex-shrink-0">
        <div>
          <p className="text-sm font-semibold tracking-tight">📝 今日复盘</p>
          <p className="text-[10px] text-on-surface-variant">{formatDate(today)}</p>
        </div>
        <button
          onClick={() => window.api.window.hide()}
          className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition-colors text-lg"
        >
          ×
        </button>
      </div>

      {/* 输入区 */}
      <div className="flex-1 flex flex-col gap-0 overflow-hidden">
        <div className="flex flex-col px-4 pt-4 pb-2 gap-1">
          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
            今天完成了什么
          </label>
          <textarea
            ref={doneRef}
            value={done}
            onChange={(e) => setDone(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下今天的成果..."
            rows={3}
            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none resize-none placeholder-outline focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col px-4 pt-2 pb-4 gap-1">
          <label className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
            明天先做什么
          </label>
          <textarea
            value={next}
            onChange={(e) => setNext(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="最重要的一件事是..."
            rows={3}
            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none resize-none placeholder-outline focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-outline-variant/30 bg-surface-container-low flex-shrink-0">
        <span className="text-outline text-xs mr-3">Esc 关闭</span>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-xs text-on-primary bg-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          disabled={!done.trim() && !next.trim()}
        >
          {saved ? '已保存 ✓' : '保存  ⌘↩'}
        </button>
      </div>
    </div>
  )
}

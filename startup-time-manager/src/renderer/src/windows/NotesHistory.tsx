import { useEffect, useState } from 'react'
import type { Note } from '../../../main/types'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return `${date}  ${time}`
}

// 按日期分组
function groupByDate(notes: Note[]): { date: string; items: Note[] }[] {
  const map = new Map<string, Note[]>()
  for (const n of notes) {
    const d = new Date(n.createdAt).toLocaleDateString('sv-SE')
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(n)
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
}

function formatDateLabel(d: string): string {
  const today = new Date().toLocaleDateString('sv-SE')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE')
  if (d === today) return '今天'
  if (d === yesterday) return '昨天'
  const [y, m, day] = d.split('-')
  return `${Number(m)} 月 ${Number(day)} 日`
}

export default function NotesHistory({ onBack }: { onBack: () => void }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.notes.getAll().then((data) => {
      setNotes(data)
      setLoading(false)
    })
  }, [])

  const groups = groupByDate(notes)

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest select-none text-sm overflow-hidden rounded-xl">
      {/* 顶部 */}
      <div className="bg-surface-bright flex items-center px-4 h-14 flex-shrink-0 relative">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors text-base mr-2"
        >
          ←
        </button>
        <span className="text-sm font-semibold tracking-tight text-on-surface">📋 历史笔记</span>
        <span className="ml-2 text-xs text-on-surface-variant">共 {notes.length} 条</span>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-surface-container-low" />
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-on-surface-variant text-xs">
            加载中…
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span className="text-3xl opacity-30">📝</span>
            <p className="text-on-surface-variant text-xs">还没有笔记</p>
            <p className="text-outline text-xs">用 ⌘⇧N 随时记录想法</p>
          </div>
        ) : (
          <div className="px-4 py-3 flex flex-col gap-4">
            {groups.map(({ date, items }) => (
              <div key={date}>
                {/* 日期分组标题 */}
                <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">
                  {formatDateLabel(date)}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((note) => (
                    <div
                      key={note.id}
                      className="bg-surface-container-low rounded-xl px-3 py-2.5 flex flex-col gap-1"
                    >
                      <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                      <p className="text-outline text-[10px]">
                        {formatTime(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

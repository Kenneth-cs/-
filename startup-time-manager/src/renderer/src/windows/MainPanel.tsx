import { useEffect, useState, useCallback } from 'react'
import type { Schedule, DailyRecord, TimeBlock } from '../../../main/types'
import type { MainView } from '../App'
import StatsPanel from './StatsPanel'
import TemplateEditor from './TemplateEditor'
import NotesHistory from './NotesHistory'

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function formatRemaining(endTime: string): string {
  const end = parseMinutes(endTime)
  const remaining = end - nowMinutes()
  if (remaining <= 0) return '0 分钟'
  const h = Math.floor(remaining / 60)
  const m = remaining % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h} 小时`
  return `${m} 分钟`
}

function calcProgress(startTime: string, endTime: string): number {
  const start = parseMinutes(startTime)
  const end = parseMinutes(endTime)
  const cur = nowMinutes()
  if (cur <= start) return 0
  if (cur >= end) return 100
  return Math.round(((cur - start) / (end - start)) * 100)
}

// ─── 主面板 ────────────────────────────────────────────────────────────────────

export default function MainPanel({
  view,
  onNavigate
}: {
  view: MainView
  onNavigate: (v: MainView) => void
}) {
  if (view === 'stats') return <StatsPanel onBack={() => onNavigate('main')} />
  if (view === 'editor') return <TemplateEditor onBack={() => onNavigate('main')} />
  if (view === 'notes') return <NotesHistory onBack={() => onNavigate('main')} />
  return <MainPanelContent onNavigate={onNavigate} />
}

function MainPanelContent({ onNavigate }: { onNavigate: (v: MainView) => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activeScheduleId, setActiveScheduleId] = useState<string>('')
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null)
  const [now, setNow] = useState(new Date())
  const [streak, setStreak] = useState(0)

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId) ?? schedules[0]
  const today = todayDate()

  // 加载数据
  const loadData = useCallback(async () => {
    const [allSchedules, activeId] = await Promise.all([
      window.api.schedules.getAll(),
      window.api.schedules.getActiveId()
    ])
    setSchedules(allSchedules)
    setActiveScheduleId(activeId)

    const schedule = allSchedules.find((s) => s.id === activeId) ?? allSchedules[0]
    if (schedule) {
      const record = await window.api.daily.getOrCreate(today, schedule.id)
      setDailyRecord(record)

      // 计算连续打卡天数（有任意一条打卡即算）
      let streakCount = 0
      const oneDay = 86400000
      for (let i = 0; i < 365; i++) {
        const d = new Date(Date.now() - i * oneDay).toLocaleDateString('sv-SE')
        const r = await window.api.daily.get(d)
        if (!r || !r.checkins.some((c) => c.completed)) break
        streakCount++
      }
      setStreak(streakCount)
    }
  }, [today])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 每 10 秒更新时间（刷新进度条）
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  // 当前区块 & 下一个区块
  const currentBlock = activeSchedule?.blocks.find((b) => {
    const cur = now.getHours() * 60 + now.getMinutes()
    return cur >= parseMinutes(b.startTime) && cur < parseMinutes(b.endTime)
  })
  const nextBlock = currentBlock
    ? activeSchedule?.blocks[activeSchedule.blocks.indexOf(currentBlock) + 1]
    : undefined

  // 打卡
  const handleCheckin = async (blockId: string) => {
    if (!activeSchedule) return
    const updated = await window.api.daily.checkin(today, activeSchedule.id, blockId)
    setDailyRecord(updated)
  }

  // 切换模板
  const handleSwitchSchedule = async (id: string) => {
    await window.api.schedules.setActiveId(id)
    setActiveScheduleId(id)
    const schedule = schedules.find((s) => s.id === id)
    if (schedule) {
      const record = await window.api.daily.getOrCreate(today, schedule.id)
      setDailyRecord(record)
    }
  }

  // 统计
  const completedCount = dailyRecord?.checkins.filter((c) => c.completed).length ?? 0
  const totalCount = activeSchedule?.blocks.length ?? 0
  const deepWorkMinutes =
    activeSchedule?.blocks
      .filter((b) => b.category === 'deep')
      .reduce((sum, b) => {
        const checkin = dailyRecord?.checkins.find((c) => c.blockId === b.id)
        if (!checkin?.completed) return sum
        return sum + (parseMinutes(b.endTime) - parseMinutes(b.startTime))
      }, 0) ?? 0
  const deepWorkHours = Math.floor(deepWorkMinutes / 60)
  const deepWorkMins = deepWorkMinutes % 60

  const progress = currentBlock
    ? calcProgress(currentBlock.startTime, currentBlock.endTime)
    : 0

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest select-none text-sm overflow-hidden rounded-xl">

      {/* ── 顶部工具栏 ── */}
      <div className="bg-surface-bright flex justify-between items-center px-4 h-14 flex-shrink-0 relative">
        <select
          value={activeScheduleId}
          onChange={(e) => handleSwitchSchedule(e.target.value)}
          className="bg-transparent text-on-surface text-sm font-semibold tracking-tight outline-none cursor-pointer hover:bg-surface-container-low rounded-lg px-2 py-1 transition-colors appearance-none pr-5"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23717786\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
        >
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              📅 {s.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors text-base"
            title="数据统计"
            onClick={() => onNavigate('stats')}
          >
            📊
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors text-base"
            title="模板编辑"
            onClick={() => onNavigate('editor')}
          >
            ⚙️
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors text-base"
            title="快速笔记 ⌘⇧N"
            onClick={() => window.api.window.openNote()}
          >
            📝
          </button>
        </div>
        {/* 分隔线 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-surface-container-low" />
      </div>

      {/* ── 当前专注区 ── */}
      <div className="px-6 py-5 bg-surface-container-lowest flex flex-col gap-4 flex-shrink-0">
        {currentBlock ? (
          <>
            {/* 标题 */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                当前专注
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2 leading-tight">
                <span>{currentBlock.emoji}</span>
                <span>{currentBlock.name}</span>
              </h1>
            </div>

            {/* 进度条 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-xs text-on-surface-variant font-medium">
                  剩余 {formatRemaining(currentBlock.endTime)}
                </span>
                <span className="text-[10px] text-outline">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #b61814, #da342a)'
                  }}
                />
              </div>
            </div>

            {/* 下一个 */}
            {nextBlock && (
              <div className="bg-surface-container-low px-3 py-2.5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                    下一个
                  </span>
                  <span className="text-sm font-medium text-on-surface">
                    {nextBlock.emoji} {nextBlock.name}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant">{nextBlock.startTime}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
              当前状态
            </span>
            <p className="text-base font-medium text-on-surface-variant">当前不在工作时段</p>
          </div>
        )}
      </div>

      {/* ── 时间表列表 ── */}
      <div
        className="flex-1 overflow-y-auto bg-surface px-4 py-2 flex flex-col gap-1 border-t border-surface-container-low"
        style={{ maxHeight: 280 }}
      >
        {activeSchedule?.blocks.map((block: TimeBlock) => {
          const checkin = dailyRecord?.checkins.find((c) => c.blockId === block.id)
          const isCurrent = currentBlock?.id === block.id
          const isDone = checkin?.completed ?? false

          // ── 进行中 ──
          if (isCurrent) {
            return (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 relative overflow-hidden group"
                style={{ boxShadow: '0 4px 12px rgba(26,28,29,0.06)' }}
              >
                {/* 左侧红色竖条 */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-lg" />
                <div className="flex items-center gap-3 pl-2">
                  <button
                    onClick={() => handleCheckin(block.id)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-secondary-container text-on-secondary flex-shrink-0"
                    title="打卡完成"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-on-surface">
                    {block.emoji} {block.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-secondary flex-shrink-0 ml-2">
                  {block.startTime} - {block.endTime}
                </span>
              </div>
            )
          }

          // ── 已完成 ──
          if (isDone) {
            return (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-default"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCheckin(block.id)}
                    className="flex-shrink-0 text-primary text-xl leading-none"
                    title="取消打卡"
                  >
                    ✅
                  </button>
                  <span className="text-sm font-medium text-on-surface-variant line-through opacity-60">
                    {block.emoji} {block.name}
                  </span>
                </div>
                <span className="text-xs text-outline group-hover:text-on-surface-variant transition-colors flex-shrink-0 ml-2">
                  {block.startTime} - {block.endTime}
                </span>
              </div>
            )
          }

          // ── 待办 ──
          return (
            <div
              key={block.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCheckin(block.id)}
                  className="flex-shrink-0 text-outline text-xl leading-none hover:text-primary transition-colors"
                  title="打卡"
                >
                  ☐
                </button>
                <span className="text-sm font-medium text-on-surface">
                  {block.emoji} {block.name}
                </span>
              </div>
              <span className="text-xs text-outline group-hover:text-on-surface-variant transition-colors flex-shrink-0 ml-2">
                {block.startTime} - {block.endTime}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── 底部统计 ── */}
      <div className="bg-surface-container-low px-6 py-3.5 flex justify-between items-center text-xs text-on-surface-variant border-t border-outline-variant/15 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>
            今日完成：
            <span className="font-semibold text-on-surface">{completedCount}/{totalCount}</span>
          </span>
          <span>
            深度工作：
            <span className="font-semibold text-on-surface">
              {deepWorkHours > 0 ? `${deepWorkHours}h ${deepWorkMins}m` : `${deepWorkMins}m`}
            </span>
          </span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 font-semibold text-secondary-container">
            🔥 连续 {streak} 天
          </div>
        )}
      </div>
    </div>
  )
}

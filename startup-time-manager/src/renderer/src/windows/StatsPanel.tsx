import { useEffect, useState } from 'react'
import type { DailyRecord } from '../../../main/types'

function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 计算一条记录的深度工作已完成分钟数
function calcDeepMinutes(record: DailyRecord): number {
  return record.checkins
    .filter((c) => c.completed)
    .reduce((sum, c) => {
      // 通过 blockId 前缀判断是否深度工作（简单约定 deep-work 开头）
      if (!c.blockId.startsWith('deep-work')) return sum
      // 从 blockId 中我们无法直接得知时长，用固定值（deep-work-1: 135min, deep-work-2: 150min）
      if (c.blockId === 'deep-work-1') return sum + 135
      if (c.blockId === 'deep-work-2') return sum + 150
      return sum + 90  // 自定义区块默认 90min
    }, 0)
}

function calcCompletionRate(record: DailyRecord): number {
  if (!record.checkins.length) return 0
  const done = record.checkins.filter((c) => c.completed).length
  return Math.round((done / record.checkins.length) * 100)
}

// 简易文字进度条
function TextBar({ percent }: { percent: number }) {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return (
    <span className="font-mono text-xs">
      <span className="text-primary">{'█'.repeat(filled)}</span>
      <span className="text-surface-container-highest">{'░'.repeat(empty)}</span>
    </span>
  )
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export default function StatsPanel({ onBack }: { onBack: () => void }) {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [streak, setStreak] = useState(0)
  const [exerciseStreak, setExerciseStreak] = useState(0)

  useEffect(() => {
    window.api.daily.getRecent(30).then((data) => {
      setRecords(data)

      // 连续打卡天数
      let s = 0
      for (const r of data) {
        if (r.checkins.some((c) => c.completed)) s++
        else break
      }
      setStreak(s)

      // 连续运动天数
      let es = 0
      for (const r of data) {
        if (r.checkins.some((c) => c.blockId === 'exercise' && c.completed)) es++
        else break
      }
      setExerciseStreak(es)
    })
  }, [])

  const today = todayDate()
  const todayRecord = records.find((r) => r.date === today)
  const todayDone = todayRecord?.checkins.filter((c) => c.completed).length ?? 0
  const todayTotal = todayRecord?.checkins.length ?? 0
  const todayDeep = calcDeepMinutes(todayRecord ?? { date: today, scheduleId: '', checkins: [] })
  const todayDeepH = Math.floor(todayDeep / 60)
  const todayDeepM = todayDeep % 60

  // 本周数据（最近 7 天）
  const weekRecords = records.slice(0, 7)
  const weekRates = weekRecords.map(calcCompletionRate)
  const avgWeekRate = weekRates.length
    ? Math.round(weekRates.reduce((a, b) => a + b, 0) / weekRates.length)
    : 0
  const weekDeep = weekRecords.reduce((sum, r) => sum + calcDeepMinutes(r), 0)
  const weekDeepH = Math.floor(weekDeep / 60)
  const weekDeepM = weekDeep % 60
  const weekExercise = weekRecords.filter((r) =>
    r.checkins.some((c) => c.blockId === 'exercise' && c.completed)
  ).length

  // 最近 7 天完成率（按星期几展示）
  const last7: { label: string; rate: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000)
    const label = WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
    const dStr = d.toLocaleDateString('sv-SE')
    const rec = records.find((r) => r.date === dStr)
    return { label, rate: rec ? calcCompletionRate(rec) : -1 }
  }).reverse()

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
        <span className="text-sm font-semibold tracking-tight text-on-surface">📊 数据统计</span>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-surface-container-low" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

        {/* 今日 */}
        <section>
          <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-3">今日</p>
          <div className="flex gap-4">
            <div className="flex-1 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] text-on-surface-variant mb-1">完成率</p>
              <p className="text-xl font-bold text-on-surface">
                {todayTotal ? `${todayDone}/${todayTotal}` : '—'}
              </p>
              {todayTotal > 0 && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {Math.round((todayDone / todayTotal) * 100)}%
                </p>
              )}
            </div>
            <div className="flex-1 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] text-on-surface-variant mb-1">深度工作</p>
              <p className="text-xl font-bold text-on-surface">
                {todayDeepH > 0 ? `${todayDeepH}h` : todayDeepM > 0 ? `${todayDeepM}m` : '—'}
              </p>
              {(todayDeepH > 0 || todayDeepM > 0) && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {todayDeepH > 0 && todayDeepM > 0 ? `${todayDeepH}h ${todayDeepM}min` : ''}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 本周 */}
        <section>
          <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-3">本周</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] text-on-surface-variant mb-1">平均完成率</p>
              <p className="text-xl font-bold text-on-surface">{avgWeekRate ? `${avgWeekRate}%` : '—'}</p>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] text-on-surface-variant mb-1">深度工作</p>
              <p className="text-xl font-bold text-on-surface">
                {weekDeepH > 0 ? `${weekDeepH}h` : weekDeepM > 0 ? `${weekDeepM}m` : '—'}
              </p>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] text-on-surface-variant mb-1">运动次数</p>
              <p className="text-xl font-bold text-on-surface">{weekExercise}/7</p>
            </div>
          </div>
        </section>

        {/* 连续记录 */}
        <section>
          <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-3">连续记录</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-[10px] text-on-surface-variant">连续打卡</p>
                <p className="text-base font-bold text-on-surface">{streak} 天</p>
              </div>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">🏃</span>
              <div>
                <p className="text-[10px] text-on-surface-variant">连续运动</p>
                <p className="text-base font-bold text-on-surface">{exerciseStreak} 天</p>
              </div>
            </div>
          </div>
        </section>

        {/* 最近 7 天 */}
        <section>
          <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-3">最近 7 天完成率</p>
          <div className="flex flex-col gap-2">
            {last7.map(({ label, rate }, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-4 text-xs text-on-surface-variant text-center flex-shrink-0">{label}</span>
                {rate >= 0 ? (
                  <>
                    <TextBar percent={rate} />
                    <span className="text-xs text-on-surface-variant w-8 text-right">{rate}%</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs text-surface-container-highest">{'░'.repeat(10)}</span>
                    <span className="text-xs text-outline w-8 text-right">—</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

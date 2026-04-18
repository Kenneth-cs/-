import { Notification } from 'electron'
import { getSchedules, getActiveScheduleId, getOrCreateDailyRecord, saveDailyRecord } from './store'

let schedulerInterval: ReturnType<typeof setInterval> | null = null
// 记录已通知过的区块，避免同一分钟重复发送
const notifiedBlocks = new Set<string>()  // key: "date_blockId"

function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 检查当前分钟是否有区块开始，有则发通知
function checkAndNotify(): void {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const today = todayDate()

  const schedules = getSchedules()
  const activeId = getActiveScheduleId()
  const schedule = schedules.find((s) => s.id === activeId) ?? schedules[0]
  if (!schedule) return

  for (const block of schedule.blocks) {
    const startMinutes = parseMinutes(block.startTime)
    const notifyKey = `${today}_${block.id}`

    // 当前分钟 == 区块开始分钟，且这分钟内还没发过
    if (currentMinutes === startMinutes && !notifiedBlocks.has(notifyKey)) {
      notifiedBlocks.add(notifyKey)
      sendBlockNotification(block.emoji, block.name, block.startTime, block.endTime, block.reminderText)

      // 找上一个区块，若未打卡则提示可以打卡
      const idx = schedule.blocks.indexOf(block)
      if (idx > 0) {
        const prevBlock = schedule.blocks[idx - 1]
        // 主动打卡：通知里的 action（macOS 支持）
        const record = getOrCreateDailyRecord(today, schedule.id)
        const prevCheckin = record.checkins.find((c) => c.blockId === prevBlock.id)
        if (!prevCheckin?.completed) {
          sendCheckinReminder(prevBlock.emoji, prevBlock.name, today, schedule.id, prevBlock.id)
        }
      }
      break
    }
  }

  // 每天凌晨清理已通知记录
  if (currentMinutes === 0) {
    for (const key of notifiedBlocks) {
      if (!key.startsWith(today)) notifiedBlocks.delete(key)
    }
  }
}

function sendBlockNotification(
  emoji: string,
  name: string,
  startTime: string,
  endTime: string,
  reminderText?: string
): void {
  if (!Notification.isSupported()) return

  const notification = new Notification({
    title: `${emoji} ${name} 开始了`,
    body: `${startTime} - ${endTime}${reminderText ? `　${reminderText}` : ''}`,
    silent: false,
    // macOS 下使用 app 图标，无需单独设置
  })

  notification.show()
}

function sendCheckinReminder(
  emoji: string,
  name: string,
  date: string,
  scheduleId: string,
  blockId: string
): void {
  if (!Notification.isSupported()) return

  const notification = new Notification({
    title: `${emoji} ${name} 结束了`,
    body: '点击打卡完成 ✅',
    silent: true,
    actions: [{ type: 'button', text: '打卡完成' }],
  })

  notification.on('action', (_event, index) => {
    if (index === 0) {
      try {
        const record = getOrCreateDailyRecord(date, scheduleId)
        const checkin = record.checkins.find((c) => c.blockId === blockId)
        if (checkin && !checkin.completed) {
          checkin.completed = true
          checkin.completedAt = new Date().toISOString()
          saveDailyRecord(record)
        }
      } catch {
        // ignore
      }
    }
  })

  notification.show()
}

// ─── 对外接口 ──────────────────────────────────────────────────────────────────

export function startNotificationScheduler(): void {
  if (schedulerInterval) return
  // 每 30 秒检查一次（精度够用，不会漏掉整点分钟）
  schedulerInterval = setInterval(checkAndNotify, 30_000)
  // 启动时立刻检查一次
  checkAndNotify()
}

export function restartNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
  notifiedBlocks.clear()
  startNotificationScheduler()
}

export function stopNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

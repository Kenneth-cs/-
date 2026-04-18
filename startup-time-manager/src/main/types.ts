// ─── 时间块类型 ────────────────────────────────────────────────────────────────

export type BlockCategory =
  | 'deep'      // 深度工作
  | 'shallow'   // 浅层工作
  | 'break'     // 休息
  | 'exercise'  // 运动
  | 'ritual'    // 仪式（开机/定锚/收工/关机）
  | 'flexible'  // 弹性时间

export interface TimeBlock {
  id: string
  name: string           // "深度工作块 ①"
  emoji: string          // "🔴"
  startTime: string      // "10:45"  HH:mm
  endTime: string        // "13:00"  HH:mm
  category: BlockCategory
  description?: string   // 这个时段做什么（内容）
  reminderText?: string  // 执行规则（通知提示语）
}

// ─── 时间表模板 ────────────────────────────────────────────────────────────────

export interface Schedule {
  id: string
  name: string           // "工作日版" / "周末版"
  blocks: TimeBlock[]
}

// ─── 每日打卡记录 ──────────────────────────────────────────────────────────────

export interface CheckinRecord {
  blockId: string
  completed: boolean
  completedAt?: string   // ISO 8601
}

export interface DailyReview {
  done: string           // 今天完成了什么
  next: string           // 明天先做什么
}

export interface DailyRecord {
  date: string           // "2025-01-18"
  scheduleId: string
  checkins: CheckinRecord[]
  review?: DailyReview
}

// ─── 笔记 ──────────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  content: string
  createdAt: string      // ISO 8601
}

// ─── IPC 通信类型 ──────────────────────────────────────────────────────────────

export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { Schedule, DailyRecord, Note } from './types'
import { DEFAULT_SCHEDULES } from './defaultData'

// ─── 数据目录 ──────────────────────────────────────────────────────────────────

function getDataDir(): string {
  return path.join(app.getPath('home'), '.startup-time-manager')
}

function ensureDataDir(): void {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const dailyDir = path.join(dir, 'daily-records')
  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true })
  }
}

// ─── 通用读写 ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── 时间表 ────────────────────────────────────────────────────────────────────

export function getSchedules(): Schedule[] {
  ensureDataDir()
  const filePath = path.join(getDataDir(), 'schedules.json')
  const schedules = readJson<Schedule[]>(filePath, [])
  if (schedules.length === 0) {
    writeJson(filePath, DEFAULT_SCHEDULES)
    return DEFAULT_SCHEDULES
  }
  // 自动回填：老数据缺少 description / reminderText 时，从默认数据补全
  let dirty = false
  for (const schedule of schedules) {
    const def = DEFAULT_SCHEDULES.find((d) => d.id === schedule.id)
    if (!def) continue
    for (const block of schedule.blocks) {
      const defBlock = def.blocks.find((b) => b.id === block.id)
      if (!defBlock) continue
      if (!block.description && defBlock.description) {
        block.description = defBlock.description
        dirty = true
      }
      if (!block.reminderText && defBlock.reminderText) {
        block.reminderText = defBlock.reminderText
        dirty = true
      }
    }
  }
  if (dirty) writeJson(filePath, schedules)
  return schedules
}

export function saveSchedules(schedules: Schedule[]): void {
  ensureDataDir()
  writeJson(path.join(getDataDir(), 'schedules.json'), schedules)
}

export function getScheduleById(id: string): Schedule | undefined {
  return getSchedules().find((s) => s.id === id)
}

// ─── 每日记录 ──────────────────────────────────────────────────────────────────

export function getDailyRecord(date: string): DailyRecord | null {
  ensureDataDir()
  const filePath = path.join(getDataDir(), 'daily-records', `${date}.json`)
  return readJson<DailyRecord | null>(filePath, null)
}

export function saveDailyRecord(record: DailyRecord): void {
  ensureDataDir()
  const filePath = path.join(getDataDir(), 'daily-records', `${record.date}.json`)
  writeJson(filePath, record)
}

export function getOrCreateDailyRecord(date: string, scheduleId: string): DailyRecord {
  const existing = getDailyRecord(date)
  if (existing) return existing

  const schedule = getScheduleById(scheduleId)
  const newRecord: DailyRecord = {
    date,
    scheduleId,
    checkins: (schedule?.blocks ?? []).map((b) => ({
      blockId: b.id,
      completed: false
    }))
  }
  saveDailyRecord(newRecord)
  return newRecord
}

// ─── 笔记 ──────────────────────────────────────────────────────────────────────

export function getNotes(): Note[] {
  ensureDataDir()
  return readJson<Note[]>(path.join(getDataDir(), 'notes.json'), [])
}

export function saveNote(note: Note): void {
  ensureDataDir()
  const notes = getNotes()
  notes.unshift(note)
  writeJson(path.join(getDataDir(), 'notes.json'), notes)
}

// ─── 当前选中的模板 ID ─────────────────────────────────────────────────────────

export function getActiveScheduleId(): string {
  ensureDataDir()
  const filePath = path.join(getDataDir(), 'settings.json')
  const settings = readJson<{ activeScheduleId?: string }>(filePath, {})
  return settings.activeScheduleId ?? DEFAULT_SCHEDULES[0].id
}

export function setActiveScheduleId(id: string): void {
  ensureDataDir()
  const filePath = path.join(getDataDir(), 'settings.json')
  const settings = readJson<{ activeScheduleId?: string }>(filePath, {})
  settings.activeScheduleId = id
  writeJson(filePath, settings)
}

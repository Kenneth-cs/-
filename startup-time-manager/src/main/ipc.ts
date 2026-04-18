import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import type { IpcResponse, Note, DailyRecord, CheckinRecord } from './types'
import {
  getSchedules,
  saveSchedules,
  getDailyRecord,
  saveDailyRecord,
  getOrCreateDailyRecord,
  getNotes,
  saveNote,
  getActiveScheduleId,
  setActiveScheduleId
} from './store'

// 注册所有 IPC 处理器
export function registerIpcHandlers(): void {

  // ── 时间表 ──────────────────────────────────────────────────────────────────

  ipcMain.handle('schedules:getAll', (): IpcResponse => {
    try {
      return { success: true, data: getSchedules() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('schedules:save', (_event, schedules): IpcResponse => {
    try {
      saveSchedules(schedules)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('schedules:getActiveId', (): IpcResponse<string> => {
    try {
      return { success: true, data: getActiveScheduleId() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('schedules:setActiveId', (_event, id: string): IpcResponse => {
    try {
      setActiveScheduleId(id)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // ── 每日记录 ────────────────────────────────────────────────────────────────

  ipcMain.handle(
    'daily:getOrCreate',
    (_event, date: string, scheduleId: string): IpcResponse<DailyRecord> => {
      try {
        return { success: true, data: getOrCreateDailyRecord(date, scheduleId) }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  ipcMain.handle('daily:get', (_event, date: string): IpcResponse<DailyRecord | null> => {
    try {
      return { success: true, data: getDailyRecord(date) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('daily:save', (_event, record: DailyRecord): IpcResponse => {
    try {
      saveDailyRecord(record)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(
    'daily:checkin',
    (_event, date: string, scheduleId: string, blockId: string): IpcResponse<DailyRecord> => {
      try {
        const record = getOrCreateDailyRecord(date, scheduleId)
        const checkin = record.checkins.find((c: CheckinRecord) => c.blockId === blockId)
        if (checkin) {
          checkin.completed = true
          checkin.completedAt = new Date().toISOString()
        }
        saveDailyRecord(record)
        return { success: true, data: record }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  ipcMain.handle(
    'daily:saveReview',
    (_event, date: string, scheduleId: string, done: string, next: string): IpcResponse => {
      try {
        const record = getOrCreateDailyRecord(date, scheduleId)
        record.review = { done, next }
        saveDailyRecord(record)
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  ipcMain.handle('daily:getRecent', (_event, days: number): IpcResponse<DailyRecord[]> => {
    try {
      const results: DailyRecord[] = []
      const oneDay = 86400000
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.now() - i * oneDay).toLocaleDateString('sv-SE')
        const r = getDailyRecord(d)
        if (r) results.push(r)
      }
      return { success: true, data: results }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // ── 笔记 ────────────────────────────────────────────────────────────────────

  ipcMain.handle('notes:getAll', (): IpcResponse<Note[]> => {
    try {
      return { success: true, data: getNotes() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('notes:save', (_event, content: string): IpcResponse<Note> => {
    try {
      const note: Note = {
        id: randomUUID(),
        content,
        createdAt: new Date().toISOString()
      }
      saveNote(note)
      return { success: true, data: note }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}

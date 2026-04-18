import { contextBridge, ipcRenderer } from 'electron'
import type { Schedule, DailyRecord, Note } from '../main/types'

const api = {
  // ── 时间表 ────────────────────────────────────────────────────────────────
  schedules: {
    getAll: (): Promise<Schedule[]> =>
      ipcRenderer.invoke('schedules:getAll').then((r) => r.data ?? []),
    save: (schedules: Schedule[]): Promise<void> =>
      ipcRenderer.invoke('schedules:save', schedules),
    getActiveId: (): Promise<string> =>
      ipcRenderer.invoke('schedules:getActiveId').then((r) => r.data),
    setActiveId: (id: string): Promise<void> =>
      ipcRenderer.invoke('schedules:setActiveId', id)
  },

  // ── 每日记录 ──────────────────────────────────────────────────────────────
  daily: {
    getOrCreate: (date: string, scheduleId: string): Promise<DailyRecord> =>
      ipcRenderer.invoke('daily:getOrCreate', date, scheduleId).then((r) => r.data),
    get: (date: string): Promise<DailyRecord | null> =>
      ipcRenderer.invoke('daily:get', date).then((r) => r.data),
    save: (record: DailyRecord): Promise<void> =>
      ipcRenderer.invoke('daily:save', record),
    checkin: (date: string, scheduleId: string, blockId: string): Promise<DailyRecord> =>
      ipcRenderer.invoke('daily:checkin', date, scheduleId, blockId).then((r) => r.data),
    saveReview: (date: string, scheduleId: string, done: string, next: string): Promise<void> =>
      ipcRenderer.invoke('daily:saveReview', date, scheduleId, done, next),
    // 批量获取最近 N 天记录（统计面板用）
    getRecent: (days: number): Promise<DailyRecord[]> =>
      ipcRenderer.invoke('daily:getRecent', days).then((r) => r.data ?? [])
  },

  // ── 笔记 ──────────────────────────────────────────────────────────────────
  notes: {
    getAll: (): Promise<Note[]> =>
      ipcRenderer.invoke('notes:getAll').then((r) => r.data ?? []),
    save: (content: string): Promise<Note> =>
      ipcRenderer.invoke('notes:save', content).then((r) => r.data)
  },

  // ── 窗口控制 ──────────────────────────────────────────────────────────────
  window: {
    hide: (): void => ipcRenderer.send('window:hide'),
    close: (): void => ipcRenderer.send('window:close'),
    resize: (height: number): void => ipcRenderer.send('window:resize', height),
    openNote: (): void => ipcRenderer.send('window:openNote'),
    openReview: (): void => ipcRenderer.send('window:openReview'),
  },

  // ── 调度器控制 ────────────────────────────────────────────────────────────
  scheduler: {
    reload: (): void => ipcRenderer.send('scheduler:reload')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api

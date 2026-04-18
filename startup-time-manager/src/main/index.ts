import { app, BrowserWindow, Tray, nativeImage, globalShortcut, shell, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { getSchedules, getActiveScheduleId, getOrCreateDailyRecord } from './store'
import { startNotificationScheduler, restartNotificationScheduler } from './notificationScheduler'

// ─── 全局引用（防 GC） ─────────────────────────────────────────────────────────
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let noteWindow: BrowserWindow | null = null
let reviewWindow: BrowserWindow | null = null

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function createTrayIcon(): nativeImage {
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const r = 6
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const inside = dx * dx + dy * dy <= r * r
      const idx = (y * size + x) * 4
      canvas[idx] = 0
      canvas[idx + 1] = 0
      canvas[idx + 2] = 0
      canvas[idx + 3] = inside ? 255 : 0
    }
  }
  const img = nativeImage.createFromBuffer(canvas, { width: size, height: size })
  img.setTemplateImage(true)
  return img
}

// ─── 窗口工厂 ──────────────────────────────────────────────────────────────────

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 380,
    height: 600,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  loadRenderer(win, '')
  win.on('blur', () => win.hide())
  return win
}

function createNoteWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 240,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  loadRenderer(win, 'note')
  win.on('blur', () => win.hide())
  return win
}

function createReviewWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  loadRenderer(win, 'review')
  win.on('blur', () => win.hide())
  return win
}

function loadRenderer(win: BrowserWindow, hash: string): void {
  const url = process.env['ELECTRON_RENDERER_URL']
  if (url) {
    win.loadURL(hash ? `${url}#/${hash}` : url)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), hash ? { hash } : undefined)
  }
}

// ─── 托盘 ──────────────────────────────────────────────────────────────────────

function setupTray(): void {
  tray = new Tray(createTrayIcon())
  updateTrayTitle()

  // 左键：显示/隐藏主面板
  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      showMainWindow()
    }
  })

  // 右键：上下文菜单
  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      {
        label: '打开面板',
        click: () => showMainWindow()
      },
      {
        label: '快速笔记  ⌘⇧N',
        click: () => {
          noteWindow?.center()
          noteWindow?.show()
          noteWindow?.focus()
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit()
      }
    ])
    tray!.popUpContextMenu(menu)
  })

  setInterval(updateTrayTitle, 1000)
}

function showMainWindow(): void {
  if (!mainWindow) return
  const { x, y, width } = tray!.getBounds()
  const { width: winW } = mainWindow.getBounds()
  const posX = Math.round(x + width / 2 - winW / 2)
  const posY = Math.round(y + 24)
  mainWindow.setPosition(posX, posY)
  mainWindow.show()
  mainWindow.focus()
}

function updateTrayTitle(): void {
  if (!tray) return
  const schedules = getSchedules()
  const activeId = getActiveScheduleId()
  const schedule = schedules.find((s) => s.id === activeId) ?? schedules[0]
  if (!schedule) { tray.setTitle('  —'); return }

  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const block = schedule.blocks.find((b) => {
    const [sh, sm] = b.startTime.split(':').map(Number)
    const [eh, em] = b.endTime.split(':').map(Number)
    return cur >= sh * 60 + sm && cur < eh * 60 + em
  })

  if (!block) { tray.setTitle('  —'); return }

  const [eh, em] = block.endTime.split(':').map(Number)
  const remaining = eh * 60 + em - cur
  const rh = Math.floor(remaining / 60)
  const rm = remaining % 60
  const timeStr = rh > 0 ? `${rh}:${String(rm).padStart(2, '0')}` : `${rm}m`
  tray.setTitle(`  ${block.emoji} ${timeStr}`)
}

// ─── 全局快捷键 ────────────────────────────────────────────────────────────────

function registerShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (!noteWindow) return
    if (noteWindow.isVisible()) {
      noteWindow.hide()
    } else {
      noteWindow.center()
      noteWindow.show()
      noteWindow.focus()
    }
  })
}

// ─── IPC 窗口控制 ─────────────────────────────────────────────────────────────

function registerWindowIpc(): void {
  ipcMain.on('window:hide', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })

  // 主面板调整高度（统计/编辑器视图切换时用）
  ipcMain.on('window:resize', (_event, height: number) => {
    if (!mainWindow) return
    const [x, y] = mainWindow.getPosition()
    mainWindow.setBounds({ x, y, width: 380, height }, true)
  })

  // 从主面板打开笔记窗口
  ipcMain.on('window:openNote', () => {
    if (!noteWindow) return
    noteWindow.center()
    noteWindow.show()
    noteWindow.focus()
  })

  // 打开复盘窗口
  ipcMain.on('window:openReview', () => {
    if (!reviewWindow) return
    reviewWindow.center()
    reviewWindow.show()
    reviewWindow.focus()
  })

  // 模板保存后热重载通知调度器
  ipcMain.on('scheduler:reload', () => {
    restartNotificationScheduler()
  })
}

// ─── App 生命周期 ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide()

  registerIpcHandlers()
  registerWindowIpc()

  mainWindow = createMainWindow()
  noteWindow = createNoteWindow()
  reviewWindow = createReviewWindow()

  setupTray()
  registerShortcuts()
  startNotificationScheduler()

  getOrCreateDailyRecord(todayDate(), getActiveScheduleId())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 菜单栏应用不随窗口关闭退出
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})

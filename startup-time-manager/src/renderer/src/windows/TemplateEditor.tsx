import { useEffect, useState } from 'react'
import type { Schedule, TimeBlock, BlockCategory } from '../../../main/types'

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  deep: '深度工作',
  shallow: '浅层工作',
  break: '休息',
  exercise: '运动',
  ritual: '仪式',
  flexible: '弹性'
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [BlockCategory, string][]

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function emptyBlock(): TimeBlock {
  return {
    id: genId(),
    name: '',
    emoji: '🔲',
    startTime: '09:00',
    endTime: '10:00',
    category: 'deep',
    reminderText: ''
  }
}

export default function TemplateEditor({ onBack }: { onBack: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TimeBlock | null>(null)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [showNewTemplate, setShowNewTemplate] = useState(false)

  useEffect(() => {
    window.api.schedules.getAll().then((data) => {
      setSchedules(data)
    })
  }, [])

  const currentSchedule = schedules[activeTab]

  const handleEditBlock = (block: TimeBlock) => {
    setEditingId(block.id)
    setEditForm({ ...block })
  }

  const handleSaveBlock = () => {
    if (!editForm || !currentSchedule) return
    const updated = schedules.map((s, i) =>
      i !== activeTab
        ? s
        : {
            ...s,
            blocks: s.blocks.map((b) => (b.id === editForm.id ? editForm : b))
          }
    )
    setSchedules(updated)
    setEditingId(null)
    setEditForm(null)
  }

  const handleAddBlock = () => {
    if (!currentSchedule) return
    const nb = emptyBlock()
    const updated = schedules.map((s, i) =>
      i !== activeTab ? s : { ...s, blocks: [...s.blocks, nb] }
    )
    setSchedules(updated)
    setEditingId(nb.id)
    setEditForm(nb)
  }

  const handleDeleteBlock = (blockId: string) => {
    const updated = schedules.map((s, i) =>
      i !== activeTab ? s : { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) }
    )
    setSchedules(updated)
    if (editingId === blockId) {
      setEditingId(null)
      setEditForm(null)
    }
  }

  const handleAddTemplate = () => {
    if (!newName.trim()) return
    const ns: Schedule = { id: genId(), name: newName.trim(), blocks: [] }
    setSchedules([...schedules, ns])
    setActiveTab(schedules.length)
    setNewName('')
    setShowNewTemplate(false)
  }

  const handleDeleteTemplate = (idx: number) => {
    if (schedules.length <= 1) return
    const updated = schedules.filter((_, i) => i !== idx)
    setSchedules(updated)
    setActiveTab(Math.min(activeTab, updated.length - 1))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    await window.api.schedules.save(schedules)
    window.api.scheduler.reload()
    setSaving(false)
    onBack()
  }

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
        <span className="text-sm font-semibold tracking-tight text-on-surface">⚙️ 模板编辑</span>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="ml-auto px-3 py-1 text-xs text-on-primary bg-primary hover:bg-primary-container disabled:opacity-50 rounded-lg transition-colors font-medium"
        >
          {saving ? '保存中…' : '保存'}
        </button>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-surface-container-low" />
      </div>

      {/* 模板标签栏 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-container-low bg-surface flex-shrink-0 overflow-x-auto">
        {schedules.map((s, i) => (
          <div key={s.id} className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => { setActiveTab(i); setEditingId(null); setEditForm(null) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                i === activeTab
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s.name}
            </button>
            {schedules.length > 1 && (
              <button
                onClick={() => handleDeleteTemplate(i)}
                className="text-outline hover:text-error transition-colors text-xs px-1"
                title="删除模板"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {showNewTemplate ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTemplate()
                if (e.key === 'Escape') { setShowNewTemplate(false); setNewName('') }
              }}
              placeholder="模板名称"
              className="text-xs border border-outline-variant/50 rounded px-2 py-1 outline-none w-24 bg-surface-container-lowest"
            />
            <button onClick={handleAddTemplate} className="text-xs text-primary font-medium">确定</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTemplate(true)}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors px-2 flex-shrink-0"
          >
            + 新建
          </button>
        )}
      </div>

      {/* 时间块列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
        {currentSchedule?.blocks.map((block) => (
          <div key={block.id}>
            {editingId === block.id && editForm ? (
              /* 内联编辑表单 */
              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-outline-variant/20">
                <div className="flex gap-2">
                  <input
                    value={editForm.emoji}
                    onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                    className="w-10 text-center bg-surface-container rounded px-1 py-1 text-base outline-none border border-outline-variant/30"
                    maxLength={2}
                  />
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="区块名称"
                    className="flex-1 bg-surface-container rounded px-2 py-1 text-sm outline-none border border-outline-variant/30"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-on-surface-variant w-6">开始</span>
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="flex-1 bg-surface-container rounded px-2 py-1 text-xs outline-none border border-outline-variant/30"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-on-surface-variant w-6">结束</span>
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      className="flex-1 bg-surface-container rounded px-2 py-1 text-xs outline-none border border-outline-variant/30"
                    />
                  </div>
                </div>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as BlockCategory })}
                  className="bg-surface-container rounded px-2 py-1 text-xs outline-none border border-outline-variant/30"
                >
                  {CATEGORY_OPTIONS.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <input
                  value={editForm.reminderText ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, reminderText: e.target.value })}
                  placeholder="通知提示语（可选）"
                  className="bg-surface-container rounded px-2 py-1 text-xs outline-none border border-outline-variant/30"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setEditingId(null); setEditForm(null) }}
                    className="text-xs text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveBlock}
                    className="text-xs text-on-primary bg-primary hover:bg-primary-container rounded-lg px-3 py-1 transition-colors"
                  >
                    完成
                  </button>
                </div>
              </div>
            ) : (
              /* 普通行 */
              <div className="flex items-center p-2.5 rounded-lg hover:bg-surface-container-low transition-colors group">
                <span className="mr-2">{block.emoji}</span>
                <span className="flex-1 text-on-surface font-medium">{block.name || <span className="text-outline italic">未命名</span>}</span>
                <span className="text-xs text-outline mr-3">{block.startTime}–{block.endTime}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditBlock(block)}
                    className="text-xs text-on-surface-variant hover:text-primary px-1.5 py-0.5 rounded hover:bg-surface-container transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-xs text-on-surface-variant hover:text-error px-1.5 py-0.5 rounded hover:bg-surface-container transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 添加区块按钮 */}
        <button
          onClick={handleAddBlock}
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-primary w-full text-left"
        >
          <span className="text-base">＋</span>
          <span className="text-xs">添加时间块</span>
        </button>
      </div>
    </div>
  )
}

import type { Schedule } from './types'

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'weekday',
    name: '工作日版',
    blocks: [
      {
        id: 'morning-ritual',
        name: '开机仪式',
        emoji: '☀️',
        startTime: '10:00',
        endTime: '10:30',
        category: 'ritual',
        reminderText: '不碰手机，先动起来！'
      },
      {
        id: 'daily-anchor',
        name: '每日定锚',
        emoji: '🎯',
        startTime: '10:30',
        endTime: '10:45',
        category: 'ritual',
        reminderText: '今天最重要的 3 件事是什么？'
      },
      {
        id: 'deep-work-1',
        name: '深度工作块 ①',
        emoji: '🔴',
        startTime: '10:45',
        endTime: '13:00',
        category: 'deep',
        reminderText: '手机静音，全屏编辑器'
      },
      {
        id: 'lunch-break',
        name: '午休块',
        emoji: '🟢',
        startTime: '13:00',
        endTime: '14:00',
        category: 'break',
        reminderText: '吃饭休息，可以看消息了'
      },
      {
        id: 'deep-work-2',
        name: '深度工作块 ②',
        emoji: '🔴',
        startTime: '14:00',
        endTime: '16:30',
        category: 'deep',
        reminderText: '手机静音，全屏编辑器'
      },
      {
        id: 'shallow-work',
        name: '浅层工作块',
        emoji: '🟡',
        startTime: '16:30',
        endTime: '17:30',
        category: 'shallow',
        reminderText: '集中处理消息和杂务'
      },
      {
        id: 'wrap-up',
        name: '收工总结',
        emoji: '📝',
        startTime: '17:30',
        endTime: '18:00',
        category: 'ritual',
        reminderText: '记录今天完成了什么'
      },
      {
        id: 'exercise',
        name: '下班仪式',
        emoji: '🏃',
        startTime: '18:00',
        endTime: '19:00',
        category: 'exercise',
        reminderText: '去运动，今天辛苦了！'
      },
      {
        id: 'dinner',
        name: '晚餐',
        emoji: '🍽️',
        startTime: '19:00',
        endTime: '20:00',
        category: 'break',
        reminderText: '好好吃饭'
      },
      {
        id: 'flexible',
        name: '弹性时间',
        emoji: '🔵',
        startTime: '20:00',
        endTime: '21:30',
        category: 'flexible',
        reminderText: '可选，不是义务'
      },
      {
        id: 'shutdown-ritual',
        name: '关机仪式',
        emoji: '🌙',
        startTime: '21:30',
        endTime: '22:00',
        category: 'ritual',
        reminderText: '不碰电脑，准备休息'
      }
    ]
  }
]

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
        description: '起床 + 运动（跳绳 / 拉伸 / 快走都行）',
        reminderText: '不碰手机，不看消息'
      },
      {
        id: 'daily-anchor',
        name: '每日定锚',
        emoji: '🎯',
        startTime: '10:30',
        endTime: '10:45',
        category: 'ritual',
        description: '写下今天最重要的 1–3 件事',
        reminderText: '一杯咖啡 + 纸笔或简单笔记'
      },
      {
        id: 'deep-work-1',
        name: '深度工作块 ①',
        emoji: '🔴',
        startTime: '10:45',
        endTime: '13:00',
        category: 'deep',
        description: '写代码 / 产品开发',
        reminderText: '手机静音、微信关闭、全屏编辑器'
      },
      {
        id: 'lunch-break',
        name: '午休块',
        emoji: '🟢',
        startTime: '13:00',
        endTime: '14:00',
        category: 'break',
        description: '吃饭 + 回消息 + 自由时间',
        reminderText: '第一个消息窗口，可以看消息了'
      },
      {
        id: 'deep-work-2',
        name: '深度工作块 ②',
        emoji: '🔴',
        startTime: '14:00',
        endTime: '16:30',
        category: 'deep',
        description: '写代码 / 产品开发',
        reminderText: '严格无干扰，同上'
      },
      {
        id: 'shallow-work',
        name: '浅层工作块',
        emoji: '🟡',
        startTime: '16:30',
        endTime: '17:30',
        category: 'shallow',
        description: '回消息、商务沟通、行政杂务、邮件',
        reminderText: '第二个消息窗口，集中处理'
      },
      {
        id: 'wrap-up',
        name: '收工总结',
        emoji: '📝',
        startTime: '17:30',
        endTime: '18:00',
        category: 'ritual',
        description: '记录今天完成了什么、明天先做什么',
        reminderText: '给明天的自己留路标'
      },
      {
        id: 'exercise',
        name: '下班仪式',
        emoji: '🏃',
        startTime: '18:00',
        endTime: '19:00',
        category: 'exercise',
        description: '运动',
        reminderText: '运动 = 打卡下班，心理边界'
      },
      {
        id: 'dinner',
        name: '晚餐',
        emoji: '🍽️',
        startTime: '19:00',
        endTime: '20:00',
        category: 'break',
        description: '吃饭、休息',
        reminderText: '放松'
      },
      {
        id: 'flexible',
        name: '弹性时间',
        emoji: '🔵',
        startTime: '20:00',
        endTime: '21:30',
        category: 'flexible',
        description: '学习 / 策略思考 / 轻量工作',
        reminderText: '可选，不是义务'
      },
      {
        id: 'shutdown-ritual',
        name: '关机仪式',
        emoji: '🌙',
        startTime: '21:30',
        endTime: '22:00',
        category: 'ritual',
        description: '放松、阅读、准备睡觉',
        reminderText: '不碰电脑、不看工作消息'
      }
    ]
  }
]

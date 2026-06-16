import type { Task, Timer } from './types'

const KEYS = {
  tasks: 'grad-party-tasks-v1',
  timers: 'grad-party-timers-v1',
  dark: 'grad-party-dark-v1',
}

export function loadTasks(): Task[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEYS.tasks)
    return raw ? (JSON.parse(raw) as Task[]) : null
  } catch { return null }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks))
}

export function loadTimers(): Timer[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEYS.timers)
    return raw ? (JSON.parse(raw) as Timer[]) : null
  } catch { return null }
}

export function saveTimers(timers: Timer[]) {
  localStorage.setItem(KEYS.timers, JSON.stringify(timers))
}

export function loadDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(KEYS.dark) === 'true'
}

export function saveDarkMode(v: boolean) {
  localStorage.setItem(KEYS.dark, String(v))
}

export function exportJSON(tasks: Task[], timers: Timer[]) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), tasks, timers }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grad-party-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function resetToDefaults(defaultTasks: Task[], defaultTimers: Timer[]) {
  saveTasks(defaultTasks)
  saveTimers(defaultTimers)
}

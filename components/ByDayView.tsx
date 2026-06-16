'use client'
import { useState } from 'react'
import type { Task, TaskStatus, TaskCategory, AppAction } from '@/lib/types'
import TaskRow from './TaskRow'

const DAYS = [
  { key: 'mon', short: 'Mon', label: 'Mon Jun 15', date: '2026-06-15', theme: 'Order & Inventory' },
  { key: 'tue', short: 'Tue', label: 'Tue Jun 16', date: '2026-06-16', theme: 'Confirm & Organize' },
  { key: 'wed', short: 'Wed', label: 'Wed Jun 17', date: '2026-06-17', theme: 'Fresh Grocery + Prep' },
  { key: 'thu', short: 'Thu', label: 'Thu Jun 18', date: '2026-06-18', theme: 'Setup + Bean Soak' },
  { key: 'fri', short: 'Fri', label: 'Fri Jun 19', date: '2026-06-19', theme: 'Pork Cook + Final Shop' },
  { key: 'sat', short: 'Sat', label: 'Sat Jun 20', date: '2026-06-20', theme: 'Party Day 🎉' },
]

const CATS: { key: TaskCategory; label: string }[] = [
  { key: 'shopping',  label: 'Shopping' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'prep',      label: 'Prep' },
  { key: 'cooking',   label: 'Cooking' },
  { key: 'setup',     label: 'Setup' },
  { key: 'serving',   label: 'Serving' },
  { key: 'cleanup',   label: 'Cleanup' },
]

interface Props {
  tasks: Task[]
  dispatch: (a: AppAction) => void
  dark: boolean
}

export default function ByDayView({ tasks, dispatch, dark: _ }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultDay = DAYS.find(d => d.date >= today)?.key ?? 'sat'
  const [activeDay, setActiveDay] = useState(defaultDay)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat] = useState<TaskCategory>('prep')

  const dayConf = DAYS.find(d => d.key === activeDay)!
  const allDay = tasks.filter(t => t.dueDate === dayConf.date)
  const done = allDay.filter(t => t.status === 'completed' || t.status === 'skipped').length

  function toggle(id: string, current: TaskStatus) {
    dispatch({ type: 'UPDATE_STATUS', id, status: current === 'completed' ? 'not_started' : 'completed' })
  }

  function addTask() {
    if (!newTitle.trim()) return
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: `custom-${Date.now()}`,
        title: newTitle.trim(),
        category: newCat,
        dueDate: dayConf.date,
        status: 'not_started',
        store: 'Home',
        priority: 'medium',
        isCustom: true,
      }
    })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {DAYS.map(d => {
          const dt = tasks.filter(t => t.dueDate === d.date)
          const dc = dt.filter(t => t.status === 'completed' || t.status === 'skipped').length
          const isToday = d.date === today
          const isPast = d.date < today
          const isActive = d.key === activeDay
          const allDone = dt.length > 0 && dc === dt.length
          return (
            <button
              key={d.key}
              onClick={() => setActiveDay(d.key)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer min-w-[52px] ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : allDone
                  ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                  : isToday
                  ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 ring-1 ring-orange-300 dark:ring-orange-800'
                  : isPast
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{d.short}</span>
              <span className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>{dc}/{dt.length}</span>
            </button>
          )
        })}
      </div>

      {/* Day header */}
      <div>
        <div className="flex items-center justify-between px-1 mb-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{dayConf.label}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{dayConf.theme}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-orange-500">{Math.round(done / Math.max(allDay.length, 1) * 100)}%</p>
            <p className="text-xs text-slate-400">{done}/{allDay.length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} className="accent-orange-500 w-4 h-4" />
            Hide done
          </label>
          <button
            onClick={() => setAdding(p => !p)}
            className="ml-auto text-sm bg-orange-500 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-orange-600 cursor-pointer"
          >
            + Add task
          </button>
        </div>
      </div>

      {/* Add task */}
      {adding && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-orange-300 dark:border-orange-700 p-4 space-y-3">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Task description…"
            className="w-full text-[15px] border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex gap-2">
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value as TaskCategory)}
              className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              {CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button onClick={addTask} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">Add</button>
            <button onClick={() => setAdding(false)} className="text-slate-400 px-3 py-2 text-sm cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {/* Task sections */}
      {CATS.map(({ key: cat, label }) => {
        let catTasks = allDay.filter(t => t.category === cat)
        if (hideCompleted) catTasks = catTasks.filter(t => t.status !== 'completed' && t.status !== 'skipped')
        if (catTasks.length === 0) return null
        const catDone = allDay.filter(t => t.category === cat && (t.status === 'completed' || t.status === 'skipped')).length
        const catTotal = allDay.filter(t => t.category === cat).length
        return (
          <div key={cat}>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</h3>
              <span className="text-xs text-slate-400">{catDone}/{catTotal}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {catTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggle}
                  onNotesChange={(id, notes) => dispatch({ type: 'UPDATE_NOTES', id, notes })}
                  onDelete={id => dispatch({ type: 'DELETE_TASK', id })}
                  showStore={cat === 'shopping'}
                />
              ))}
            </div>
          </div>
        )
      })}

      {allDay.length === 0 && (
        <p className="text-center text-slate-400 py-12">No tasks for this day</p>
      )}
    </div>
  )
}

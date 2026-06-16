'use client'
import { useState } from 'react'
import type { Task, TaskStatus, TaskStore, AppAction } from '@/lib/types'
import TaskRow from './TaskRow'

const STORES: { key: TaskStore; label: string; icon: string }[] = [
  { key: 'Amazon',  label: 'Amazon',  icon: '📦' },
  { key: 'Butcher', label: 'Butcher', icon: '🥩' },
  { key: 'Bakery',  label: 'Bakery',  icon: '🍞' },
  { key: 'Grocery', label: 'Grocery', icon: '🥬' },
  { key: 'Liquor',  label: 'Liquor',  icon: '🍾' },
  { key: 'Costco',  label: 'Costco',  icon: '🏪' },
  { key: 'Walmart', label: 'Walmart', icon: '🛒' },
]

const DONE: TaskStatus[] = ['completed', 'purchased', 'ordered', 'skipped']

interface Props {
  tasks: Task[]
  dispatch: (a: AppAction) => void
}

export default function ShoppingView({ tasks, dispatch }: Props) {
  const [activeStore, setActiveStore] = useState<TaskStore | 'all'>('all')
  const [hideCompleted, setHideCompleted] = useState(false)

  const shopping = tasks.filter(t => t.category === 'shopping')
  const storesWithItems = STORES.filter(s => shopping.some(t => t.store === s.key))

  function toggle(id: string, current: TaskStatus) {
    dispatch({ type: 'UPDATE_STATUS', id, status: current === 'completed' ? 'not_started' : 'completed' })
  }

  function markAllDone(store: TaskStore) {
    shopping.filter(t => t.store === store).forEach(t => {
      dispatch({ type: 'UPDATE_STATUS', id: t.id, status: 'purchased' })
    })
  }

  const totalDone = shopping.filter(t => DONE.includes(t.status)).length
  const pct = Math.round(totalDone / shopping.length * 100)

  // Which stores to show
  const storesToShow = activeStore === 'all' ? storesWithItems : storesWithItems.filter(s => s.key === activeStore)

  return (
    <div className="space-y-5">

      {/* Overall progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">All shopping</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">{totalDone}/{shopping.length}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Store filter */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveStore('all')}
          className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
            activeStore === 'all' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          All stores
        </button>
        {storesWithItems.map(s => {
          const remaining = shopping.filter(t => t.store === s.key && !DONE.includes(t.status)).length
          const isActive = activeStore === s.key
          return (
            <button
              key={s.key}
              onClick={() => setActiveStore(s.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                isActive ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {remaining > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
                  {remaining}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Hide done toggle */}
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer px-1">
        <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} className="accent-orange-500 w-4 h-4" />
        Hide secured items
      </label>

      {/* Lists per store */}
      {storesToShow.map(s => {
        let items = shopping.filter(t => t.store === s.key)
        if (hideCompleted) items = items.filter(t => !DONE.includes(t.status))
        if (items.length === 0) return null
        const storeDone = shopping.filter(t => t.store === s.key && DONE.includes(t.status)).length
        const storeTotal = shopping.filter(t => t.store === s.key).length
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {s.icon} {s.label}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{storeDone}/{storeTotal}</span>
                <button
                  onClick={() => markAllDone(s.key)}
                  className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline cursor-pointer"
                >
                  Mark all ✓
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {items.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggle}
                  onNotesChange={(id, notes) => dispatch({ type: 'UPDATE_NOTES', id, notes })}
                />
              ))}
            </div>
          </div>
        )
      })}

      {shopping.filter(t => !DONE.includes(t.status)).length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl">🎉</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">All shopping done!</p>
        </div>
      )}
    </div>
  )
}

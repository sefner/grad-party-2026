'use client'
import { useState } from 'react'
import type { Task, TaskStatus } from '@/lib/types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  ordered: 'Ordered',
  purchased: 'Purchased',
  in_progress: 'In Progress',
  completed: 'Completed',
  skipped: 'Skipped',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  purchased: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  skipped: 'bg-red-100 text-red-400 dark:bg-red-950 dark:text-red-400',
}

const CAT_COLORS: Record<string, string> = {
  shopping: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  prep: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  cooking: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  setup: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  serving: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  cleanup: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  equipment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-slate-300 dark:bg-slate-600',
}

interface Props {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export default function TaskCard({ task, onStatusChange, onNotesChange, onDelete, compact }: Props) {
  const [showNotes, setShowNotes] = useState(false)
  const [editNotes, setEditNotes] = useState(task.notes ?? '')

  const done = task.status === 'completed' || task.status === 'skipped'

  function saveNotes() {
    onNotesChange(task.id, editNotes)
    setShowNotes(false)
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${done ? 'opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={e => onStatusChange(task.id, e.target.checked ? 'completed' : 'not_started')}
          className="w-4 h-4 accent-orange-500 shrink-0 cursor-pointer"
        />
        <span className={`flex-1 text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {task.title}
        </span>
        {task.quantity && <span className="text-xs text-slate-400 shrink-0">{task.quantity}</span>}
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 transition-all ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={e => onStatusChange(task.id, e.target.checked ? 'completed' : 'not_started')}
          className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
            <p className={`text-sm font-medium flex-1 min-w-0 ${done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {task.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CAT_COLORS[task.category]}`}>
              {task.category}
            </span>
            {task.store && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                {task.store}
              </span>
            )}
            {task.quantity && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {task.quantity}
              </span>
            )}
            {task.dueTime && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                {task.dueTime}
              </span>
            )}
          </div>

          {task.notes && !showNotes && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 italic">{task.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`text-xs px-1.5 py-0.5 rounded-lg border-0 font-medium cursor-pointer ${STATUS_COLORS[task.status]}`}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <button
            onClick={() => { setShowNotes(p => !p); setEditNotes(task.notes ?? '') }}
            className="text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 text-xs px-1"
            title="Notes"
          >
            ✎
          </button>

          {onDelete && task.isCustom && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-slate-300 hover:text-red-500 text-xs px-1"
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showNotes && (
        <div className="mt-2 ml-7">
          <textarea
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            rows={2}
            placeholder="Add notes…"
            className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <div className="flex gap-2 mt-1">
            <button onClick={saveNotes} className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-lg">Save</button>
            <button onClick={() => setShowNotes(false)} className="text-xs text-slate-500 px-2 py-0.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

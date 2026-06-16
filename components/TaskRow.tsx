'use client'
import { useState } from 'react'
import type { Task, TaskStatus } from '@/lib/types'

interface Props {
  task: Task
  onToggle: (id: string, current: TaskStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onDelete?: (id: string) => void
  showStore?: boolean
}

export default function TaskRow({ task, onToggle, onNotesChange, onDelete, showStore }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(task.notes ?? '')
  const done = task.status === 'completed' || task.status === 'skipped'

  return (
    <div className={`transition-colors ${done ? 'bg-transparent' : ''}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.status)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
            done
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-500'
          }`}
        >
          {done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Text */}
        <div className="flex-1 min-w-0" onClick={() => onToggle(task.id, task.status)}>
          <p className={`text-sm leading-snug cursor-pointer select-none ${
            done ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'
          }`}>
            {task.title}
          </p>
          {!done && (task.quantity || (showStore && task.store) || task.dueTime) && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              {[
                task.dueTime,
                showStore && task.store !== 'Home' ? task.store : null,
                task.quantity,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {!done && task.notes && !expanded && (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1 italic leading-snug">{task.notes}</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {task.priority === 'high' && !done && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          )}
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 text-xs px-1 cursor-pointer"
          >
            ···
          </button>
        </div>
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="px-4 pb-3 ml-8 space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={2}
            placeholder="Add a note…"
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onNotesChange(task.id, draft); setExpanded(false) }}
              className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer"
            >
              Save note
            </button>
            <button
              onClick={() => onToggle(task.id, task.status === 'skipped' ? 'not_started' : 'skipped')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              {task.status === 'skipped' ? 'Un-skip' : 'Skip'}
            </button>
            {task.priority !== 'high' && (
              <button
                onClick={() => onToggle(task.id, task.status === 'ordered' ? 'not_started' : 'ordered')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {task.status === 'ordered' ? 'Un-order' : 'Mark ordered'}
              </button>
            )}
            {onDelete && task.isCustom && (
              <button
                onClick={() => onDelete(task.id)}
                className="text-xs text-red-400 hover:text-red-600 cursor-pointer ml-auto"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

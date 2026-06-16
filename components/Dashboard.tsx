'use client'
import type { Task, AppView } from '@/lib/types'
import TaskRow from './TaskRow'
import type { AppAction } from '@/lib/types'

const PARTY = new Date('2026-06-20T15:30:00')

const TEMPS = [
  { label: 'Sous vide',      value: '132°F' },
  { label: 'Cooker',         value: '260–285°F' },
  { label: 'Pork wrap at',   value: '165–175°F' },
  { label: 'Pork done',      value: '198–205°F' },
  { label: 'Pork hold',      value: '150–170°F' },
  { label: 'Pork reheat',    value: '165°F' },
  { label: 'Beans hold',     value: '> 140°F' },
  { label: 'Reheat oven',    value: '275°F' },
]

function countdown() {
  const diff = PARTY.getTime() - Date.now()
  if (diff <= 0) return { days: 0, label: "It's party time!" }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return { days, label: `${days}d ${hours}h to party time` }
  if (hours > 0) return { days: 0, label: `${hours}h ${mins}m to go` }
  return { days: 0, label: `${mins} minutes!` }
}

interface Props {
  tasks: Task[]
  dispatch: (a: AppAction) => void
  onSetView: (v: AppView) => void
}

export default function Dashboard({ tasks, dispatch, onSetView }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const { days, label } = countdown()

  const todayTasks = tasks.filter(t => t.dueDate === today)
  const overdue = tasks.filter(t => t.dueDate < today && t.status !== 'completed' && t.status !== 'skipped')
  const todayRemaining = todayTasks.filter(t => t.status !== 'completed' && t.status !== 'skipped')
  const todayDone = todayTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length

  const total = tasks.length
  const done = tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length

  function toggle(id: string, current: string) {
    dispatch({ type: 'UPDATE_STATUS', id, status: current === 'completed' ? 'not_started' : 'completed' })
  }

  const DAY_DATES = [
    ['Mon', '2026-06-15'], ['Tue', '2026-06-16'], ['Wed', '2026-06-17'],
    ['Thu', '2026-06-18'], ['Fri', '2026-06-19'], ['Sat', '2026-06-20'],
  ]

  return (
    <div className="space-y-4">

      {/* Countdown hero */}
      <div className="bg-orange-500 rounded-2xl p-4 text-white">
        <p className="text-xs font-medium opacity-80">June 20, 2026 · 3:30 PM · 20 guests</p>
        <p className="text-5xl font-black mt-1 tracking-tight">{days > 0 ? days : '🎉'}</p>
        <p className="text-base font-medium mt-0.5 opacity-90">{label}</p>
        <div className="mt-3 bg-white/20 rounded-full h-1.5">
          <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${Math.round(done / total * 100)}%` }} />
        </div>
        <p className="text-xs opacity-70 mt-1">{done} of {total} tasks complete</p>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">⚠ {overdue.length} overdue</p>
          {overdue.slice(0, 4).map(t => (
            <p key={t.id} className="text-sm text-red-600 dark:text-red-500 truncate">• {t.title}</p>
          ))}
          {overdue.length > 4 && <p className="text-xs text-red-400 mt-0.5">+ {overdue.length - 4} more</p>}
        </div>
      )}

      {/* Today */}
      {todayTasks.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Today</h2>
            <span className="text-xs text-slate-400">{todayDone}/{todayTasks.length} done</span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
            {(todayRemaining.length > 0 ? todayRemaining : todayTasks).slice(0, 8).map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={(id, current) => toggle(id, current)}
                onNotesChange={(id, notes) => dispatch({ type: 'UPDATE_NOTES', id, notes })}
              />
            ))}
            {todayRemaining.length > 8 && (
              <button
                onClick={() => onSetView('by-day')}
                className="w-full px-4 py-3 text-sm text-orange-500 font-medium text-left hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                See {todayRemaining.length - 8} more →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Week progress */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">Week Progress</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {DAY_DATES.map(([day, date]) => {
            const dt = tasks.filter(t => t.dueDate === date)
            const dc = dt.filter(t => t.status === 'completed' || t.status === 'skipped' || t.status === 'purchased').length
            const pct = dt.length > 0 ? dc / dt.length : 0
            const isToday = date === today
            const isPast = date < today && date !== today
            return (
              <button
                key={day}
                onClick={() => onSetView('by-day')}
                className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-left"
              >
                <span className={`text-sm font-semibold w-8 flex-shrink-0 ${isToday ? 'text-orange-500' : isPast ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day}
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      pct === 1 ? 'bg-green-500' : isToday ? 'bg-orange-500' : isPast ? 'bg-red-400' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right flex-shrink-0">{dc}/{dt.length}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onSetView('shopping')} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
          <p className="text-xl mb-0.5">🛒</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Shopping</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {tasks.filter(t => t.category === 'shopping' && t.status === 'not_started').length} items left
          </p>
        </button>
        <button onClick={() => onSetView('run-sheet')} className="bg-orange-500 rounded-2xl p-3 text-left hover:bg-orange-600 cursor-pointer">
          <p className="text-xl mb-0.5">🎯</p>
          <p className="text-sm font-semibold text-white">Run Sheet</p>
          <p className="text-xs text-orange-200 mt-0.5">Party day mode</p>
        </button>
      </div>

      {/* Temperature reference */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">Temperature Reference</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {TEMPS.map(t => (
            <div key={t.label} className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t.label}</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">{t.value}</span>
            </div>
          ))}
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30">
            <p className="text-xs text-red-600 dark:text-red-400">Perishables: max 2 hrs out · Keep drink ice separate · Sauces stay on the side</p>
          </div>
        </div>
      </div>

      {/* Buffet order */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">Buffet Order (left → right)</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex flex-wrap gap-y-1.5">
            {[
              'Plates', 'Slider buns + rolls', 'Pulled pork', 'Tri-tip',
              'Sweet BBQ', 'Tangy BBQ', 'Chimichurri', 'Vinegar slaw',
              'Dill pickles', 'Pickled red onions', 'Jalapeños', 'Cherry peppers',
              'Potato salad', 'Pinquito beans', 'Forks + napkins',
            ].map((item, i) => (
              <span key={item} className="text-sm text-slate-600 dark:text-slate-400 mr-3">
                <span className="text-slate-300 dark:text-slate-600 mr-1">{i + 1}.</span>{item}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

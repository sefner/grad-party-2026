'use client'
import { useState, useEffect } from 'react'
import type { Task, TaskStatus, Timer, AppAction } from '@/lib/types'
import { INITIAL_TIMERS } from '@/lib/data'

const TIME_BLOCKS = [
  'Morning', '5:00 AM', '5:30 AM', '9:30 AM', '10:30 AM', '11:00 AM',
  '12:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:10 PM', '3:15 PM', '3:20 PM', '3:30 PM', 'After Party',
]

const TEMPS = [
  { label: 'Sous vide',    value: '132°F' },
  { label: 'Cooker',       value: '260–285°F' },
  { label: 'Pork wrap',    value: '165–175°F' },
  { label: 'Pork done',    value: '198–205°F' },
  { label: 'Pork hold',    value: '150–170°F' },
  { label: 'Pork reheat',  value: '165°F' },
  { label: 'Beans hold',   value: '> 140°F' },
  { label: 'Oven',         value: '275°F' },
]

function getAutoBlock(): string {
  const now = new Date()
  const t = now.getHours() * 60 + now.getMinutes()
  if (t < 5 * 60 + 30) return '5:00 AM'
  if (t < 9 * 60 + 30) return '5:30 AM'
  if (t < 10 * 60 + 30) return '9:30 AM'
  if (t < 11 * 60) return '10:30 AM'
  if (t < 12 * 60) return '11:00 AM'
  if (t < 13 * 60 + 30) return '12:00 PM'
  if (t < 14 * 60) return '1:30 PM'
  if (t < 14 * 60 + 30) return '2:00 PM'
  if (t < 14 * 60 + 45) return '2:30 PM'
  if (t < 15 * 60) return '2:45 PM'
  if (t < 15 * 60 + 10) return '3:00 PM'
  if (t < 15 * 60 + 15) return '3:10 PM'
  if (t < 15 * 60 + 20) return '3:15 PM'
  if (t < 15 * 60 + 30) return '3:20 PM'
  if (t < 17 * 60) return '3:30 PM'
  return 'After Party'
}

function fmtTime(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSecs = Math.ceil(ms / 1000)
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface Props {
  tasks: Task[]
  timers: Timer[]
  dispatch: (a: AppAction) => void
  dark: boolean
}

export default function RunSheet({ tasks, timers, dispatch, dark: _ }: Props) {
  const satTasks = tasks.filter(t => t.dueDate === '2026-06-20')
  const [now, setNow] = useState(new Date())
  const [activeBlock, setActiveBlock] = useState(getAutoBlock)
  const [tick, setTick] = useState(0)
  const [showTemps, setShowTemps] = useState(false)

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setTick(p => p + 1) }, 1000)
    return () => clearInterval(id)
  }, [])

  const blockTasks = satTasks.filter(t => t.timeBlock === activeBlock)
  const blockDone = blockTasks.filter(t => t.status === 'completed').length
  const autoBlock = getAutoBlock()
  const nextBlockIdx = TIME_BLOCKS.indexOf(autoBlock) + 1
  const nextBlock = TIME_BLOCKS[nextBlockIdx]
  const nextTasks = nextBlock ? satTasks.filter(t => t.timeBlock === nextBlock) : []

  function toggle(id: string, current: TaskStatus) {
    dispatch({ type: 'UPDATE_STATUS', id, status: current === 'completed' ? 'not_started' : 'completed' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none">

      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Run Sheet · Jun 20</p>
          <p className="text-3xl font-black tabular-nums text-white mt-0.5">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-orange-400 mt-0.5">
            {String(now.getSeconds()).padStart(2, '0')}s · auto: {autoBlock}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Party at</p>
          <p className="text-2xl font-black text-orange-400">3:30 PM</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {satTasks.filter(t => t.status === 'completed').length}/{satTasks.length} done
          </p>
        </div>
      </div>

      {/* Block tabs - scrollable */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 border-b border-slate-800 flex-shrink-0">
        {TIME_BLOCKS.map(b => {
          const bt = satTasks.filter(t => t.timeBlock === b)
          const bd = bt.filter(t => t.status === 'completed').length
          const isCurrent = b === autoBlock
          const isActive = b === activeBlock
          const allDone = bt.length > 0 && bd === bt.length
          return (
            <button
              key={b}
              onClick={() => setActiveBlock(b)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : allDone
                  ? 'bg-green-900/50 text-green-400 border border-green-800'
                  : isCurrent
                  ? 'bg-slate-700 text-orange-300 ring-1 ring-orange-500'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{b}</span>
              {bt.length > 0 && <span className="opacity-60">{bd}/{bt.length}</span>}
            </button>
          )
        })}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Main: tasks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Block heading */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
            <h2 className="text-2xl font-black text-white">{activeBlock}</h2>
            <div className="flex items-center gap-3">
              {blockTasks.length > 0 && (
                <span className={`text-sm font-bold ${blockDone === blockTasks.length ? 'text-green-400' : 'text-slate-400'}`}>
                  {blockDone}/{blockTasks.length}
                </span>
              )}
              <button
                onClick={() => setShowTemps(p => !p)}
                className="text-xs text-slate-500 hover:text-white cursor-pointer lg:hidden"
              >
                🌡 Temps
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {blockTasks.length === 0 ? (
              <p className="text-slate-600 text-center py-16 text-lg">No tasks in this block</p>
            ) : (
              blockTasks.map(task => {
                const done = task.status === 'completed'
                return (
                  <button
                    key={task.id}
                    onClick={() => toggle(task.id, task.status)}
                    className={`w-full text-left rounded-2xl px-5 py-4 transition-all cursor-pointer ${
                      done
                        ? 'bg-slate-800/30 border border-slate-800'
                        : task.priority === 'high'
                        ? 'bg-slate-800 border border-orange-500/40 hover:border-orange-400/60 active:scale-[0.99]'
                        : 'bg-slate-800 border border-slate-700 hover:border-slate-600 active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        done ? 'bg-green-500 border-green-500' : 'border-slate-500'
                      }`}>
                        {done && (
                          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                            <path d="M1 4.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg font-medium leading-tight ${done ? 'line-through text-slate-600' : 'text-white'}`}>
                          {task.title}
                        </p>
                        {task.notes && !done && (
                          <p className="text-sm text-amber-400 mt-2 leading-snug bg-amber-950/40 rounded-xl px-3 py-2">{task.notes}</p>
                        )}
                      </div>
                      {task.priority === 'high' && !done && (
                        <span className="flex-shrink-0 text-xs font-bold text-red-400 bg-red-950/50 border border-red-900 px-2 py-0.5 rounded-lg mt-0.5">!</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Next block preview */}
          {nextTasks.length > 0 && (
            <div className="border-t border-slate-800 px-5 py-3 flex-shrink-0">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-2">Up next: {nextBlock}</p>
              {nextTasks.slice(0, 3).map(t => (
                <p key={t.id} className="text-sm text-slate-500 truncate">→ {t.title}</p>
              ))}
              {nextTasks.length > 3 && <p className="text-xs text-slate-700 mt-0.5">+ {nextTasks.length - 3} more</p>}
            </div>
          )}
        </div>

        {/* Sidebar: timers + temps */}
        <div className={`lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto flex-shrink-0 ${showTemps ? '' : 'hidden lg:block'}`}>
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Timers</h3>
            {timers.map(timer => {
              void tick
              const elapsed = timer.isRunning && timer.startedAt ? Date.now() - timer.startedAt : 0
              const totalMs = timer.durationMinutes * 60000
              const remaining = Math.max(0, totalMs - elapsed)
              const pct = Math.min(100, elapsed / totalMs * 100)
              const done = timer.isRunning && remaining === 0

              return (
                <div key={timer.id} className={`rounded-2xl p-3.5 border ${
                  done ? 'border-green-600 bg-green-950/30' :
                  timer.isRunning ? 'border-orange-600/50 bg-slate-800' :
                  'border-slate-700 bg-slate-800/50'
                }`}>
                  <p className="text-xs font-semibold text-slate-300 leading-tight mb-1">{timer.label}</p>
                  <p className={`text-3xl font-black tabular-nums ${done ? 'text-green-400' : timer.isRunning ? 'text-orange-400' : 'text-slate-600'}`}>
                    {fmtTime(remaining)}
                  </p>
                  {timer.isRunning && (
                    <div className="w-full bg-slate-700 rounded-full h-1 mt-2">
                      <div className={`h-1 rounded-full ${done ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {timer.notes && <p className="text-xs text-slate-600 mt-1.5 leading-tight">{timer.notes}</p>}
                  {done && <p className="text-sm font-bold text-green-400 mt-1 animate-pulse">DONE!</p>}
                  <div className="flex gap-2 mt-2.5">
                    {!timer.isRunning ? (
                      <button
                        onClick={() => dispatch({ type: 'START_TIMER', id: timer.id })}
                        className="flex-1 text-sm bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-xl font-semibold cursor-pointer"
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={() => dispatch({ type: 'STOP_TIMER', id: timer.id })}
                        className="flex-1 text-sm bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded-xl font-semibold cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => dispatch({ type: 'RESET_TIMER', id: timer.id })}
                      className="text-sm border border-slate-700 text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      ↺
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 pb-4 space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Temperatures</h3>
            {TEMPS.map(t => (
              <div key={t.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{t.label}</span>
                <span className="font-bold tabular-nums text-orange-400">{t.value}</span>
              </div>
            ))}
            <div className="mt-3 rounded-xl border border-red-900 bg-red-950/30 px-3 py-2.5">
              <p className="text-xs text-red-500 font-semibold">Food Safety</p>
              <p className="text-xs text-red-600 mt-0.5">Max 2 hrs out (less in sun)</p>
              <p className="text-xs text-red-600">Drink ice separate from bottle ice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

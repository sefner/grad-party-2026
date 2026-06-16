'use client'
import { useReducer, useEffect, useState, useRef, useCallback } from 'react'
import type { Task, Timer, AppView, AppAction } from '@/lib/types'
import { INITIAL_TASKS, INITIAL_TIMERS, RECIPES } from '@/lib/data'
import { loadTasks, saveTasks, loadTimers, saveTimers, loadDarkMode, saveDarkMode, exportJSON, resetToDefaults } from '@/lib/storage'
import type { SyncConfig, SyncState } from '@/lib/sync'
import { loadSyncConfig, saveGist } from '@/lib/sync'
import Dashboard from '@/components/Dashboard'
import ByDayView from '@/components/ByDayView'
import ShoppingView from '@/components/ShoppingView'
import RecipeView from '@/components/RecipeView'
import RunSheet from '@/components/RunSheet'
import SyncPanel from '@/components/SyncPanel'

interface State { tasks: Task[]; timers: Timer[] }

function reducer(state: State, action: AppAction): State {
  switch (action.type) {
    case 'UPDATE_STATUS':
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, status: action.status } : t) }
    case 'UPDATE_NOTES':
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, notes: action.notes } : t) }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) }
    case 'LOAD_TASKS':
      return { ...state, tasks: action.tasks }
    case 'LOAD_TIMERS':
      return { ...state, timers: action.timers }
    case 'START_TIMER':
      return { ...state, timers: state.timers.map(t => t.id === action.id ? { ...t, isRunning: true, startedAt: Date.now() } : t) }
    case 'STOP_TIMER': {
      return {
        ...state, timers: state.timers.map(t => {
          if (t.id !== action.id || !t.isRunning || !t.startedAt) return t
          const elapsed = (Date.now() - t.startedAt) / 60000
          return { ...t, isRunning: false, durationMinutes: Math.max(0, t.durationMinutes - elapsed), startedAt: undefined }
        })
      }
    }
    case 'RESET_TIMER':
      return {
        ...state, timers: state.timers.map(t => {
          if (t.id !== action.id) return t
          const orig = INITIAL_TIMERS.find(o => o.id === t.id)
          return { ...t, isRunning: false, startedAt: undefined, durationMinutes: orig?.durationMinutes ?? t.durationMinutes }
        })
      }
    default:
      return state
  }
}

const NAV: { view: AppView; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '🏠', label: 'Home' },
  { view: 'by-day',    icon: '📅', label: 'Days' },
  { view: 'shopping',  icon: '🛒', label: 'Shop' },
  { view: 'recipes',   icon: '📋', label: 'Recipes' },
  { view: 'run-sheet', icon: '🎯', label: 'Run' },
]

function syncDot(status: SyncState['status']) {
  if (status === 'syncing') return 'bg-yellow-400 animate-pulse'
  if (status === 'synced')  return 'bg-green-500'
  if (status === 'error')   return 'bg-red-500'
  return 'bg-slate-400'
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, { tasks: INITIAL_TASKS, timers: INITIAL_TIMERS })
  const [view, setView]   = useState<AppView>('dashboard')
  const [dark, setDark]   = useState(false)
  const [hydrated, setHydrated]   = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showSync, setShowSync]   = useState(false)
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null)
  const [syncState, setSyncState]   = useState<SyncState>({ status: 'idle', lastSynced: null, error: null })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced auto-save to Gist
  const debouncedSave = useCallback((cfg: SyncConfig, tasks: Task[], timers: Timer[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncState(s => ({ ...s, status: 'syncing', error: null }))
      try {
        await saveGist(cfg, tasks, timers)
        setSyncState({ status: 'synced', lastSynced: Date.now(), error: null })
      } catch (e) {
        setSyncState(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Sync failed' }))
      }
    }, 2000)
  }, [])

  // Hydrate from localStorage and optionally Gist
  useEffect(() => {
    const t = loadTasks(); const ti = loadTimers()
    if (t?.length) dispatch({ type: 'LOAD_TASKS', tasks: t })
    if (ti?.length) dispatch({ type: 'LOAD_TIMERS', timers: ti })
    setDark(loadDarkMode())

    const cfg = loadSyncConfig()
    if (cfg?.gistId) {
      setSyncConfig(cfg)
      // Pull fresh state from Gist on startup (async, non-blocking)
      setSyncState(s => ({ ...s, status: 'syncing' }))
      import('@/lib/sync').then(({ loadGist }) =>
        loadGist(cfg).then(remote => {
          if (remote?.tasks?.length) {
            dispatch({ type: 'LOAD_TASKS', tasks: remote.tasks })
            saveTasks(remote.tasks)
          }
          if (remote?.timers?.length) {
            dispatch({ type: 'LOAD_TIMERS', timers: remote.timers })
            saveTimers(remote.timers)
          }
          setSyncState({ status: 'synced', lastSynced: Date.now(), error: null })
        }).catch(e => {
          setSyncState({ status: 'error', lastSynced: null, error: e instanceof Error ? e.message : 'Load failed' })
        })
      )
    }
    setHydrated(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveTasks(state.tasks)
    if (syncConfig) debouncedSave(syncConfig, state.tasks, state.timers)
  }, [state.tasks, hydrated, syncConfig, debouncedSave]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated) return
    saveTimers(state.timers)
    if (syncConfig) debouncedSave(syncConfig, state.tasks, state.timers)
  }, [state.timers, hydrated, syncConfig, debouncedSave]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    if (hydrated) saveDarkMode(dark)
  }, [dark, hydrated])

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400">Loading…</p>
    </div>
  )

  // Run sheet gets its own full-screen layout
  if (view === 'run-sheet') {
    return (
      <div className="min-h-screen">
        <button
          onClick={() => setView('dashboard')}
          className="fixed top-3 right-3 z-20 text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-700 cursor-pointer no-print"
        >
          ← Exit
        </button>
        <RunSheet tasks={state.tasks} timers={state.timers} dispatch={dispatch} dark={dark} />
      </div>
    )
  }

  const bg = dark ? 'bg-slate-900' : 'bg-slate-50'
  const borderColor = dark ? 'border-slate-700' : 'border-slate-200'
  const navBg = dark ? 'bg-slate-900' : 'bg-white'

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* Top bar */}
      <header className={`sticky top-0 z-10 ${navBg} border-b ${borderColor} no-print`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
            🎓 Grad Party
          </span>
          <div className="flex items-center gap-1">
            {/* Sync button with status dot */}
            <button
              onClick={() => setShowSync(true)}
              title="Sync settings"
              className={`relative p-2 rounded-lg text-sm cursor-pointer ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              ☁
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${syncDot(syncConfig ? syncState.status : 'idle')}`} />
            </button>

            <button
              onClick={() => setDark(p => !p)}
              className={`p-2 rounded-lg text-sm cursor-pointer ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => exportJSON(state.tasks, state.timers)}
              className={`p-2 rounded-lg text-sm cursor-pointer ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              title="Export JSON"
            >
              ⬇
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className={`p-2 rounded-lg text-sm cursor-pointer ${dark ? 'text-slate-600 hover:text-red-400' : 'text-slate-300 hover:text-red-400'}`}
              title="Reset all"
            >
              ↺
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-xl mx-auto px-4 pt-5 pb-28">
        {view === 'dashboard' && <Dashboard tasks={state.tasks} dispatch={dispatch} onSetView={setView} />}
        {view === 'by-day'    && <ByDayView tasks={state.tasks} dispatch={dispatch} dark={dark} />}
        {view === 'shopping'  && <ShoppingView tasks={state.tasks} dispatch={dispatch} />}
        {view === 'recipes'   && <RecipeView recipes={RECIPES} />}
      </main>

      {/* Bottom tab bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-10 ${navBg} border-t ${borderColor} no-print`}>
        <div className="flex">
          {NAV.map(n => (
            <button
              key={n.view}
              onClick={() => setView(n.view)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 cursor-pointer transition-colors ${
                view === n.view
                  ? 'text-orange-500'
                  : dark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span className="text-[22px] leading-none">{n.icon}</span>
              <span className="text-[10px] font-medium mt-0.5 tracking-wide">{n.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Sync panel */}
      {showSync && (
        <SyncPanel
          syncConfig={syncConfig}
          syncState={syncState}
          tasks={state.tasks}
          timers={state.timers}
          dark={dark}
          onClose={() => setShowSync(false)}
          onConnected={(cfg, tasks, timers) => {
            setSyncConfig(cfg)
            dispatch({ type: 'LOAD_TASKS', tasks })
            dispatch({ type: 'LOAD_TIMERS', timers })
            setSyncState({ status: 'synced', lastSynced: Date.now(), error: null })
            setShowSync(false)
          }}
          onDisconnect={() => {
            setSyncConfig(null)
            setSyncState({ status: 'idle', lastSynced: null, error: null })
          }}
        />
      )}

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirmReset(false)}>
          <div
            className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl ${dark ? 'bg-slate-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`font-bold text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>Reset all data?</h3>
            <p className={`text-sm mt-1 mb-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Restores every task to not-started and clears timer state. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetToDefaults(INITIAL_TASKS, INITIAL_TIMERS)
                  dispatch({ type: 'LOAD_TASKS', tasks: INITIAL_TASKS })
                  dispatch({ type: 'LOAD_TIMERS', timers: INITIAL_TIMERS })
                  setConfirmReset(false)
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold cursor-pointer ${dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

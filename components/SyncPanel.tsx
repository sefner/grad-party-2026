'use client'
import { useState } from 'react'
import type { SyncConfig, SyncState } from '@/lib/sync'
import { saveSyncConfig, clearSyncConfig, createGist, loadGist } from '@/lib/sync'
import type { Task, Timer } from '@/lib/types'

interface Props {
  syncConfig: SyncConfig | null
  syncState: SyncState
  tasks: Task[]
  timers: Timer[]
  onConnected: (cfg: SyncConfig, tasks: Task[], timers: Timer[]) => void
  onDisconnect: () => void
  onClose: () => void
  dark: boolean
}

export default function SyncPanel({ syncConfig, syncState, tasks, timers, onConnected, onDisconnect, onClose, dark }: Props) {
  const [token, setToken]   = useState(syncConfig?.token ?? '')
  const [gistId, setGistId] = useState(syncConfig?.gistId ?? '')
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  const label = dark ? 'text-slate-300' : 'text-slate-700'
  const input = `w-full text-sm font-mono border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 ${dark ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`

  async function connect() {
    if (!token.trim()) return setErr('Paste your GitHub token.')
    setBusy(true); setErr('')
    try {
      let gist = gistId.trim()
      let loadedTasks = tasks
      let loadedTimers = timers

      if (gist) {
        // Existing gist — pull data from it
        const cfg = { token: token.trim(), gistId: gist }
        const remote = await loadGist(cfg)
        if (remote) { loadedTasks = remote.tasks; loadedTimers = remote.timers }
      } else {
        // New gist — create with current data
        gist = await createGist(token.trim(), tasks, timers)
      }
      const cfg: SyncConfig = { token: token.trim(), gistId: gist }
      saveSyncConfig(cfg)
      onConnected(cfg, loadedTasks, loadedTimers)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Connection failed. Check your token.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className={`rounded-2xl border p-5 w-full max-w-sm shadow-2xl space-y-4 ${card}`} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Sync via GitHub Gist</h2>
          <button onClick={onClose} className={`text-sm cursor-pointer ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>✕</button>
        </div>

        {syncConfig ? (
          /* Already connected */
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-sm ${syncState.status === 'error' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              <span>{syncState.status === 'syncing' ? '⟳' : syncState.status === 'error' ? '⚠' : '✓'}</span>
              <span className="capitalize">{syncState.status === 'idle' ? 'Connected' : syncState.status}</span>
              {syncState.lastSynced && <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>· {new Date(syncState.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            {syncState.error && <p className="text-sm text-red-500">{syncState.error}</p>}

            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Gist ID — paste this on a new device</p>
              <div className="flex gap-2">
                <code className={`flex-1 text-xs font-mono border rounded-xl px-3 py-2 truncate ${dark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {syncConfig.gistId}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(syncConfig.gistId)}
                  className={`text-xs px-3 py-2 rounded-xl border cursor-pointer ${dark ? 'border-slate-600 text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:text-slate-700'}`}
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => { clearSyncConfig(); onDisconnect() }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Disconnect
            </button>
          </div>
        ) : (
          /* Setup form */
          <div className="space-y-3">
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Uses a private GitHub Gist to sync across all your devices. Your data never touches any third-party server.
            </p>

            <div>
              <label className={`text-xs font-semibold uppercase tracking-wide block mb-1 ${label}`}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setErr('') }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className={input}
              />
              <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Needs <code>gist</code> scope · Settings → Developer settings → Tokens (classic)
              </p>
            </div>

            <div>
              <label className={`text-xs font-semibold uppercase tracking-wide block mb-1 ${label}`}>
                Gist ID <span className={`font-normal normal-case ${dark ? 'text-slate-500' : 'text-slate-400'}`}>(leave blank to create new)</span>
              </label>
              <input
                type="text"
                value={gistId}
                onChange={e => { setGistId(e.target.value); setErr('') }}
                placeholder="Paste from another device to sync existing data"
                className={input}
              />
            </div>

            {err && <p className="text-sm text-red-500">{err}</p>}

            <button
              onClick={connect}
              disabled={busy}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Connecting…' : gistId ? 'Connect & sync from Gist' : 'Connect & create Gist'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

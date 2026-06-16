import type { Task, Timer } from './types'

const FILENAME = 'grad-party-2026.json'

export interface SyncConfig {
  token: string
  gistId: string
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error'
  lastSynced: number | null
  error: string | null
}

export const SYNC_TOKEN_KEY = 'gp-sync-token'
export const SYNC_GIST_KEY  = 'gp-sync-gist'

export function loadSyncConfig(): SyncConfig | null {
  if (typeof window === 'undefined') return null
  const token  = localStorage.getItem(SYNC_TOKEN_KEY)
  const gistId = localStorage.getItem(SYNC_GIST_KEY)
  if (!token) return null
  return { token, gistId: gistId ?? '' }
}

export function saveSyncConfig(cfg: SyncConfig) {
  localStorage.setItem(SYNC_TOKEN_KEY, cfg.token)
  if (cfg.gistId) localStorage.setItem(SYNC_GIST_KEY, cfg.gistId)
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_TOKEN_KEY)
  localStorage.removeItem(SYNC_GIST_KEY)
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  }
}

function body(tasks: Task[], timers: Timer[]) {
  return JSON.stringify({ tasks, timers, savedAt: new Date().toISOString() })
}

export async function createGist(token: string, tasks: Task[], timers: Timer[]): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: 'Grad Party 2026 — app state (do not edit manually)',
      public: false,
      files: { [FILENAME]: { content: body(tasks, timers) } },
    }),
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json() as { id: string }
  return data.id
}

export async function loadGist(cfg: SyncConfig): Promise<{ tasks: Task[]; timers: Timer[] } | null> {
  if (!cfg.gistId) return null
  const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
    headers: headers(cfg.token),
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json() as { files: Record<string, { content: string }> }
  const content = data.files[FILENAME]?.content
  if (!content) return null
  return JSON.parse(content) as { tasks: Task[]; timers: Timer[] }
}

export async function saveGist(cfg: SyncConfig, tasks: Task[], timers: Timer[]): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
    method: 'PATCH',
    headers: headers(cfg.token),
    body: JSON.stringify({ files: { [FILENAME]: { content: body(tasks, timers) } } }),
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
}

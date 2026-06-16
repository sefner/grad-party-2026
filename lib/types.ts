export type TaskStatus = 'not_started' | 'ordered' | 'purchased' | 'in_progress' | 'completed' | 'skipped'
export type TaskCategory = 'shopping' | 'prep' | 'cooking' | 'setup' | 'serving' | 'cleanup' | 'equipment'
export type TaskStore = 'Amazon' | 'Walmart' | 'Costco' | 'Grocery' | 'Butcher' | 'Bakery' | 'Home' | 'Liquor'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  dueDate: string // YYYY-MM-DD
  dueTime?: string // HH:mm
  status: TaskStatus
  store?: TaskStore
  notes?: string
  quantity?: string
  priority: TaskPriority
  timeBlock?: string // For Saturday run-sheet grouping e.g. "9:30 AM"
  groceryDept?: string // Sub-group within Grocery store
  isCustom?: boolean
  recipe?: string // linked recipe name
}

export interface Timer {
  id: string
  label: string
  durationMinutes: number
  startedAt?: number // Date.now()
  isRunning: boolean
  notes?: string
}

export interface Recipe {
  id: string
  name: string
  ingredients: string[]
  steps: string[]
  notes?: string
}

export type AppView = 'dashboard' | 'by-day' | 'shopping' | 'recipes' | 'run-sheet'

export type AppAction =
  | { type: 'UPDATE_STATUS'; id: string; status: TaskStatus }
  | { type: 'UPDATE_NOTES'; id: string; notes: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'LOAD_TASKS'; tasks: Task[] }
  | { type: 'LOAD_TIMERS'; timers: Timer[] }
  | { type: 'START_TIMER'; id: string }
  | { type: 'STOP_TIMER'; id: string }
  | { type: 'RESET_TIMER'; id: string }

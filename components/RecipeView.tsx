'use client'
import { useState } from 'react'
import type { Recipe } from '@/lib/types'

interface Props { recipes: Recipe[] }

export default function RecipeView({ recipes }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tap a recipe to expand</p>
      {recipes.map(r => (
        <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setOpen(open === r.id ? null : r.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.name}</span>
            <span className="text-slate-400 text-xs">{open === r.id ? '▲' : '▼'}</span>
          </button>

          {open === r.id && (
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
              {r.notes && (
                <p className="mt-3 text-xs italic text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 rounded-lg px-3 py-2">
                  {r.notes}
                </p>
              )}

              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-4 mb-2">Ingredients</h4>
              <ul className="space-y-1">
                {r.ingredients.map((ing, i) => (
                  <li key={i} className={`text-sm ${ing.startsWith('──') ? 'font-semibold text-slate-700 dark:text-slate-300 mt-3 first:mt-0' : 'text-slate-600 dark:text-slate-400 flex gap-2'}`}>
                    {ing.startsWith('──') ? ing : <><span className="text-slate-300 dark:text-slate-600">•</span>{ing}</>}
                  </li>
                ))}
              </ul>

              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-4 mb-2">Method</h4>
              <ol className="space-y-1.5">
                {r.steps.map((step, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                    <span className="text-orange-500 font-bold shrink-0 w-5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

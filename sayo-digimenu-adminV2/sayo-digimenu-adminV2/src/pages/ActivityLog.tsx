import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import { MODULE_LABELS, ACTION_LABELS, getModuleLabel } from '@/lib/activityModules'
import type { ActivityLogEntry } from '@/types'

const ACTION_BADGE_CLASSES: Record<string, string> = {
  view: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  login: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  login_failed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

function describeEntry(entry: ActivityLogEntry): string {
  const name = (entry.meta?.name_en as string) || (entry.meta?.label_en as string) || (entry.meta?.title as string)
  if (name) return name
  if (entry.action === 'login' || entry.action === 'login_failed') return ''
  return entry.entityId || ''
}

export function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const toast = useToast()

  const load = async (pageToLoad = 1) => {
    setIsLoading(true)
    try {
      const response = await adminAPI.getActivityLog({
        page: pageToLoad,
        pageSize,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
      })
      setEntries(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
      setPage(response.meta.page)
    } catch (error) {
      console.error('Load activity log failed', error)
      toast('Failed to fetch activity log', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, moduleFilter, actionFilter])

  const handleModuleFilterChange = (value: string) => {
    setModuleFilter(value)
    setPage(1)
  }

  const handleActionFilterChange = (value: string) => {
    setActionFilter(value)
    setPage(1)
  }

  const moduleOptions = Object.keys(MODULE_LABELS).sort((a, b) => MODULE_LABELS[a].localeCompare(MODULE_LABELS[b]))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Who logged in, which menu they used, and what they did — views, additions, edits, and deletions.
      </p>

      <div className="flex flex-wrap gap-3">
        <select
          value={moduleFilter}
          onChange={(e) => handleModuleFilterChange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All menus</option>
          {moduleOptions.map((slug) => (
            <option key={slug} value={slug}>{MODULE_LABELS[slug]}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => handleActionFilterChange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--card-bg)] p-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <p>No activity recorded yet.</p>
        ) : (
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-[var(--color-text-secondary)] uppercase">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Menu</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{entry.userEmail}</td>
                  <td className="px-3 py-2">{getModuleLabel(entry.module)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ACTION_BADGE_CLASSES[entry.action] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-secondary)]">{describeEntry(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <small className="text-[var(--color-text-secondary)]">
          Page {page} of {totalPages} ({total} records total)
        </small>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded border px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded border px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

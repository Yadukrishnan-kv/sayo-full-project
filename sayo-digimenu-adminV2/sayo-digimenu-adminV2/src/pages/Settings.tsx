import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { adminAPI } from '@/lib/adminAPI'

const schema = z.object({
  restaurant_name: z.string().min(1, 'Restaurant name required'),
  theme_mode: z.enum(['light', 'dark', 'system']),
})

type FormData = z.infer<typeof schema>

export function SettingsPage() {
  const { settings, setSettings, exportData, importData } = useStore()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      restaurant_name: settings.restaurant_name,
      theme_mode: settings.theme_mode,
    },
  })

  const onSave = async (data: FormData) => {
    try {
      const id = settings.id
      const updated = id ? await adminAPI.updateSettings(id, data) : await adminAPI.getSettings()
      setSettings(updated)
      toast('Settings saved', 'success')
    } catch (error) {
      console.error(error)
      toast('Failed to save settings', 'error')
    }
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sayo-menu-export.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('Data exported')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const json = reader.result as string
      if (importData(json)) toast('Data imported', 'success')
      else toast('Invalid file', 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <Header title="Settings" subtitle="Global restaurant and app settings" />

      <Card className="mt-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSave)} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Restaurant name
            </label>
            <input
              {...register('restaurant_name')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Logo
            </label>
            <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
              Default: assets (Logo_lgt_EN.svg / Logo_lgt_AR.svg for sidebar). Upload to override.
            </p>
            <ImageUpload
              value={settings.logo_url}
              onChange={(url) => setSettings({ logo_url: url })}
              placeholder="Upload logo or use default from assets"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSettings({ logo_url: '/assets/Logo_lgt_EN.svg' })}
              >
                Use default (EN)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSettings({ logo_url: '/assets/Logo_lgt_AR.svg' })}
              >
                Use default (AR)
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Favicon
            </label>
            <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
              Default: assets/Favicon.svg. Upload to override.
            </p>
            <ImageUpload
              value={settings.favicon_url}
              onChange={(url) => setSettings({ favicon_url: url })}
              placeholder="Upload favicon or use default from assets"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setSettings({ favicon_url: '/assets/Favicon.svg' })}
            >
              Use default favicon
            </Button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Default theme
            </label>
            <select
              {...register('theme_mode')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <Button type="submit" disabled={!isDirty}>
            Save settings
          </Button>
        </form>
      </Card>

      <Card className="mt-8 max-w-2xl">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Data</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Export your menu data to use in the frontend or backup. Import to restore.
        </p>
      </Card>
    </>
  )
}

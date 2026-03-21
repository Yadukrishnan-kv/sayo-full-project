import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { SubCategory } from '@/types'

const schema = z.object({
  category_id: z.string().min(1, 'Category required'),
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string().min(1, 'Name (AR) required'),
  visible: z.boolean(),
})

type FormData = z.infer<typeof schema>

const defaultValues: FormData = {
  category_id: '',
  name_en: '',
  name_ar: '',
  visible: true,
}

export function SubCategoriesPage() {
  const categories = useStore((s) => s.categories)
  const subcategories = useStore((s) => s.subcategories)
  const addSubCategory = useStore((s) => s.addSubCategory)
  const updateSubCategory = useStore((s) => s.updateSubCategory)
  const deleteSubCategory = useStore((s) => s.deleteSubCategory)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SubCategory | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const openCreate = () => {
    setEditing(null)
    reset(defaultValues)
    setModalOpen(true)
  }

  const openEdit = (sc: SubCategory) => {
    setEditing(sc)
    reset({
      category_id: sc.category_id,
      name_en: sc.name_en,
      name_ar: sc.name_ar,
      visible: sc.visible,
    })
    setModalOpen(true)
  }

  const onSave = async (data: FormData) => {
    try {
      const payload = {
        category_id: data.category_id,
        name_en: data.name_en,
        name_ar: data.name_ar,
        visible: data.visible,
        order: subcategories.filter((item) => item.category_id === data.category_id).length,
      }

      if (editing) {
        const updated = await adminAPI.updateSubCategory(editing.id, payload)
        updateSubCategory(editing.id, updated)
        toast('Sub-category updated')
      } else {
        const created = await adminAPI.createSubCategory(payload)
        addSubCategory(created)
        toast('Sub-category added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save sub-category', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this sub-category? Menu items referencing it will not break but field may become empty.')) {
      try {
        await adminAPI.deleteSubCategory(id)
        deleteSubCategory(id)
        toast('Sub-category deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete sub-category', 'error')
      }
    }
  }

  return (
    <>
      <Header
        title="Sub-Categories"
        subtitle="Manage sub-category groups used by menu items"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add sub-category
          </Button>
        }
      />

      <Card className="mt-6">
        {subcategories.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No sub-categories yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                <th className="py-2">Category</th>
                <th className="py-2">Name (EN)</th>
                <th className="py-2">Name (AR)</th>
                <th className="py-2">Visible</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((sc) => {
                const cat = categories.find((c) => c.id === sc.category_id)
                return (
                  <tr key={sc.id} className="border-b border-[var(--color-border)]">
                    <td className="py-2">{cat?.name_en ?? '–'}</td>
                    <td className="py-2">{sc.name_en}</td>
                    <td className="py-2">{sc.name_ar}</td>
                    <td className="py-2">{sc.visible ? 'Yes' : 'No'}</td>
                    <td className="py-2 space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(sc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(sc.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit sub-category' : 'Add sub-category'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSave)}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select {...register('category_id')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name (EN)</label>
            <input {...register('name_en')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            {errors.name_en && <p className="mt-1 text-sm text-red-600">{errors.name_en.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name (AR)</label>
            <input {...register('name_ar')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            {errors.name_ar && <p className="mt-1 text-sm text-red-600">{errors.name_ar.message}</p>}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('visible')} />
            Visible
          </label>
        </form>
      </Modal>
    </>
  )
}

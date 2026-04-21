import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Plus, Copy, Eye, EyeOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { MenuItem as MenuItemType } from '@/types'

const schema = z.object({
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string(),
  description_en: z.string(),
  description_ar: z.string(),
  price: z.coerce.number().min(0),
  category_id: z.string().min(1, 'Category required'),
  subcategory_id: z.string().min(1, 'Sub-category is required'),
  country_id: z.string(),
  tags: z.string(),
  calories: z.union([z.string().min(0), z.number()]).transform((v) => (v === '' ? null : v)),
  allergens: z.string(),
  visible: z.boolean(),
  chef_special: z.boolean(),
  popular: z.boolean(),
  recommended: z.boolean(),
  available_from: z.string().nullable(),
  available_to: z.string().nullable(),
  available_days: z.string(),
})

type FormData = z.infer<typeof schema>

function SortableMenuItemRow({
  item,
  categoryName,
  subcategoryName,
  countryName,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisible,
}: {
  item: MenuItemType
  categoryName: string
  subcategoryName: string
  countryName: string
  onEdit: (i: MenuItemType) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisible: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[var(--color-border)] ${isDragging ? 'opacity-50' : ''} ${!item.visible ? 'opacity-60' : ''}`}
    >
      <td className="w-10 cursor-grab py-3" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
      </td>
      <td className="py-3">
        {item.image ? (
          <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-[var(--color-border)]" />
        )}
      </td>
      <td className="py-3 font-medium text-[var(--color-text-primary)]">{item.name_en}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{categoryName}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{subcategoryName}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{countryName}</td>
      <td className="py-3 font-mono text-[var(--color-text-secondary)]">{item.price}</td>
      <td className="py-3">
        <div className="flex gap-1">
          {item.chef_special && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/30">Chef</span>
          )}
          {item.popular && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs dark:bg-blue-900/30">Popular</span>
          )}
          {item.recommended && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs dark:bg-emerald-900/30">Rec</span>
          )}
        </div>
      </td>
      <td className="py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(item.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleVisible(item.id)}>
            {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function MenuItemsPage() {
  const { categories, subcategories, countries, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } = useStore()
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItemType | null>(null)
  const [image, setImage] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name_en ?? '–'
  const getSubCategoryName = (id: string | null) =>
    id ? subcategories.find((c) => c.id === id)?.name_en ?? '–' : '–'
  const getCountryName = (id: string | null) =>
    id ? countries.find((c) => c.id === id)?.name_en ?? '–' : '–'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      category_id: categories[0]?.id ?? '',
      subcategory_id: (() => {
        const cid = categories[0]?.id ?? ''
        const subs = subcategories.filter((cl) => cl.category_id === cid).sort((a, b) => a.order - b.order)
        return subs[0]?.id ?? ''
      })(),
      country_id: '',
      tags: '',
      calories: null,
      allergens: '',
      visible: true,
      chef_special: false,
      popular: false,
      recommended: false,
      available_from: null,
      available_to: null,
      available_days: '',
    },
  })

  const selectedCategoryId = watch('category_id')
  const subcategoriesForCategory = subcategories
    .filter((cl) => cl.category_id === selectedCategoryId)
    .sort((a, b) => a.order - b.order)

  const openCreate = () => {
    setEditing(null)
    setImage('')
    const firstCategoryId = categories[0]?.id ?? ''
    const firstSubs = subcategories.filter((cl) => cl.category_id === firstCategoryId).sort((a, b) => a.order - b.order)
    reset({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      category_id: firstCategoryId,
      subcategory_id: firstSubs[0]?.id ?? '',
      country_id: '',
      tags: '',
      calories: '' as unknown as number | null,
      allergens: '',
      visible: true,
      chef_special: false,
      popular: false,
      recommended: false,
      available_from: null,
      available_to: null,
      available_days: '',
    })
    setModalOpen(true)
  }

  const openEdit = (item: MenuItemType) => {
    setEditing(item)
    setImage(item.image)
    const subsForCat = subcategories.filter((cl) => cl.category_id === item.category_id).sort((a, b) => a.order - b.order)
    const defaultSubId = item.subcategory_id && subsForCat.some((cl) => cl.id === item.subcategory_id)
      ? item.subcategory_id
      : item.classification_id && subsForCat.some((cl) => cl.id === item.classification_id)
      ? item.classification_id
      : subsForCat[0]?.id ?? ''
    reset({
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en,
      description_ar: item.description_ar,
      price: item.price,
      category_id: item.category_id,
      subcategory_id: defaultSubId,
      country_id: item.country_id ?? '',
      tags: item.tags.join(', '),
      calories: item.calories,
      allergens: item.allergens.join(', '),
      visible: item.visible,
      chef_special: item.chef_special,
      popular: item.popular,
      recommended: item.recommended,
      available_from: item.available_from,
      available_to: item.available_to,
      available_days: item.available_days.join(','),
    })
    setModalOpen(true)
  }

  const onSave = async (data: FormData) => {
    const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const allergens = data.allergens ? data.allergens.split(',').map((a) => a.trim()).filter(Boolean) : []
    const available_days = data.available_days
      ? data.available_days.split(',').map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6)
      : []

    if (subcategoriesForCategory.length === 0) {
      toast('This category has no sub-categories. Add sub-categories first.', 'error')
      return
    }
    const subcategoryId = data.subcategory_id && subcategoriesForCategory.some((cl) => cl.id === data.subcategory_id)
      ? data.subcategory_id
      : subcategoriesForCategory[0]?.id ?? null
    if (!subcategoryId) {
      toast('Please select a sub-category', 'error')
      return
    }

    const countryId = data.country_id || null

    try {
      const payload = {
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        price: data.price,
        category_id: data.category_id,
        subcategory_id: subcategoryId,
        classification_id: null,
        country_id: countryId,
        image,
        tags,
        calories: data.calories ?? null,
        allergens,
        visible: data.visible,
        chef_special: data.chef_special,
        popular: data.popular,
        recommended: data.recommended,
        available_from: data.available_from || null,
        available_to: data.available_to || null,
        available_days,
        order: editing
          ? editing.order
          : menuItems.filter((m) => m.category_id === data.category_id).length,
      }

      if (editing) {
        const updated = await adminAPI.updateMenuItem(editing.id, payload)
        updateMenuItem(editing.id, updated)
        toast('Dish updated')
      } else {
        const created = await adminAPI.createMenuItem(payload)
        addMenuItem(created)
        toast('Dish added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save dish', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this dish?')) {
      try {
        await adminAPI.deleteMenuItem(id)
        deleteMenuItem(id)
        toast('Dish deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete dish', 'error')
      }
    }
  }

  const onDuplicate = async (id: string) => {
    const item = menuItems.find((m) => m.id === id)
    if (!item) return

    try {
      const duplicate = {
        ...item,
        name_en: `${item.name_en} (Copy)`,
        name_ar: `${item.name_ar} (نسخة)`,
        order: menuItems.filter((m) => m.category_id === item.category_id).length,
      }
      const created = await adminAPI.createMenuItem(duplicate)
      addMenuItem(created)
      toast('Dish duplicated')
    } catch (error) {
      console.error(error)
      toast('Failed to duplicate dish', 'error')
    }
  }

  const onToggleVisible = async (id: string) => {
    const item = menuItems.find((m) => m.id === id)
    if (!item) return

    try {
      const updated = await adminAPI.updateMenuItem(id, { visible: !item.visible })
      updateMenuItem(id, updated)
    } catch (error) {
      console.error(error)
      toast('Failed to update visibility', 'error')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeItem = menuItems.find((m) => m.id === active.id)
    const overItem = menuItems.find((m) => m.id === over.id)
    if (!activeItem || !overItem || activeItem.category_id !== overItem.category_id) return

    const inCategory = menuItems
      .filter((m) => m.category_id === activeItem.category_id)
      .sort((a, b) => a.order - b.order)

    const oldIndex = inCategory.findIndex((m) => m.id === active.id)
    const newIndex = inCategory.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const updatedList = [...inCategory]
    const [moved] = updatedList.splice(oldIndex, 1)
    updatedList.splice(newIndex, 0, moved)

    reorderMenuItems(activeItem.category_id, oldIndex, newIndex)

    try {
      await Promise.all(
        updatedList.map((m, idx) =>
          adminAPI.updateMenuItem(m.id, { order: idx })
        )
      )
    } catch (error) {
      console.error(error)
      toast('Failed to save dish order', 'error')
    }
  }

  const filteredItems = filterCategory
    ? menuItems.filter((m) => m.category_id === filterCategory)
    : menuItems
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.category_id !== b.category_id) return 0
    return a.order - b.order
  })

  return (
    <>
      <Header
        title="Menu Items"
        subtitle="Manage dishes and their order"
        action={
          <Button onClick={() => openCreate()} disabled={categories.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add dish
          </Button>
        }
      />

      {categories.length === 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
          <p className="text-amber-800 dark:text-amber-200">Create at least one category before adding dishes.</p>
        </Card>
      )}

      <Card className="mt-8">
        <div className="mb-4 flex gap-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>
        {sortedItems.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No dishes yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="w-10 py-3"></th>
                  <th className="py-3">Image</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Sub-category</th>
                  <th className="py-3">Country</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Badges</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={sortedItems.map((m) => m.id)}>
                  {sortedItems.map((item) => (
                    <SortableMenuItemRow
                      key={item.id}
                      item={item}
                      categoryName={getCatName(item.category_id)}
                      subcategoryName={getSubCategoryName(item.subcategory_id ?? item.classification_id ?? null)}
                      countryName={getCountryName(item.country_id ?? null)}
                      onEdit={openEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onToggleVisible={onToggleVisible}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit dish' : 'Add dish'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSave)}>Save</Button>
          </div>
        }
      >
        <form id="dish-form" onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name (EN)</label>
              <input {...register('name_en')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              {errors.name_en && <p className="mt-1 text-sm text-red-600">{errors.name_en.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Name (AR)</label>
              <input {...register('name_ar')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Description (EN)</label>
              <textarea {...register('description_en')} rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description (AR)</label>
              <textarea {...register('description_ar')} rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input type="number" step="0.01" {...register('price')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                {...register('category_id', {
                  onChange: () => {
                    const next = watch('category_id')
                    const nextSubs = subcategories.filter((cl) => cl.category_id === next).sort((a, b) => a.order - b.order)
                    setValue('subcategory_id', nextSubs[0]?.id ?? '')
                  },
                })}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sub-category (required)</label>
              <select
                {...register('subcategory_id')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                {subcategoriesForCategory.length === 0 ? (
                  <option value="">— Add sub-categories first —</option>
                ) : (
                  subcategoriesForCategory.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name_en}</option>
                  ))
                )}
              </select>
              {subcategoriesForCategory.length === 0 && (
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                  Add sub-categories in Sub-Categories section first.
                </p>
              )}
              {errors.subcategory_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subcategory_id.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country (optional)</label>
              <select
                {...register('country_id')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Dish image</label>
            <ImageUpload value={image} onChange={setImage} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
              <input {...register('tags')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. Spicy, Vegan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Calories</label>
              <input type="text" {...register('calories')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. 100 or 100-200" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Allergens (comma-separated)</label>
            <input {...register('allergens')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. Nuts, Dairy" />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('visible')} className="h-4 w-4 rounded" />
              Visible
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('chef_special')} className="h-4 w-4 rounded" />
              Chef Special
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('popular')} className="h-4 w-4 rounded" />
              Popular
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('recommended')} className="h-4 w-4 rounded" />
              Recommended
            </label>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="mb-2 text-sm font-medium">Availability (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm">Available from (time)</label>
                <input type="time" {...register('available_from')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Available to (time)</label>
                <input type="time" {...register('available_to')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Available days: 0=Sun, 1=Mon, ... 6=Sat (comma-separated, e.g. 1,2,3,4,5)</p>
            <input {...register('available_days')} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. 1,2,3,4,5" />
          </div>
        </form>
      </Modal>
    </>
  )
}

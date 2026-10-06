import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { MenuItem as MenuItemType } from '@/types'
import * as XLSX from 'xlsx'

// Fixed, canonical tag options — picked from a dropdown so they always match exactly
// what the customer site looks for (no more typos like "Veg"/"Extra spicy " mismatching).
const TAG_OPTIONS = [
  { value: 'Vegan', label: 'Vegan' },
  { value: 'Mild', label: 'Mild' },
  { value: 'Spicy', label: 'Spicy (Hot)' },
  { value: 'Extra Spicy', label: 'Extra Spicy' },
]

function normalizeTagToken(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '')
}

const CANONICAL_TAG_TOKENS = new Set(TAG_OPTIONS.map((o) => normalizeTagToken(o.value)))

// Legacy dishes (created before the dedicated Dietary type field existed) only have this
// info sitting in their free-text Tags. Infer it so editing an already-tagged old dish
// doesn't force the admin to re-enter something the data already implies. Non-veg wins if
// a dish is contradictorily tagged both ways, matching the customer site's own priority.
const LEGACY_NON_VEGETARIAN_ALIASES = ['nonvegetarian', 'nonveg', 'nveg', 'nv']
const LEGACY_VEGETARIAN_ALIASES = ['vegetarian', 'veg', 'vegan']
const LEGACY_EGG_ALIASES = ['containsegg', 'egg', 'eggs']

function inferDietaryTypeFromTags(tags: string[]): 'vegetarian' | 'nonVegetarian' | 'egg' | '' {
  const tokens = new Set(tags.map((t) => normalizeTagToken(t)))
  if (LEGACY_NON_VEGETARIAN_ALIASES.some((a) => tokens.has(a))) return 'nonVegetarian'
  if (LEGACY_VEGETARIAN_ALIASES.some((a) => tokens.has(a))) return 'vegetarian'
  if (LEGACY_EGG_ALIASES.some((a) => tokens.has(a))) return 'egg'
  return ''
}

// Must match the customer site's DietaryTag union exactly (dairy/nuts/gluten/honey) —
// anything else typed into a free-text box silently fell back to a generic icon.
const ALLERGEN_OPTIONS = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'honey', label: 'Honey' },
]

const CANONICAL_ALLERGEN_TOKENS = new Set(ALLERGEN_OPTIONS.map((o) => normalizeTagToken(o.value)))

const schema = z.object({
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string(),
  description_en: z.string(),
  description_ar: z.string(),
  price: z.coerce.number().min(0),
  category_id: z.string().min(1, 'Category required'),
  subcategory_id: z.string().min(1, 'Sub-category is required'),
  country_id: z.string(),
  tags: z.array(z.string()),
  dietary_type: z.enum(['vegetarian', 'nonVegetarian', 'egg', '']),
  calories: z
    .union([z.string().min(0), z.number()])
    .nullable()
    .transform((v) => (v === '' || v === null || v === undefined ? null : v)),
  allergens: z.array(z.string()),
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
        {item.dietary_type === 'vegetarian' && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs dark:bg-green-900/30">Veg</span>
        )}
        {item.dietary_type === 'nonVegetarian' && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/30">Non-Veg</span>
        )}
        {item.dietary_type === 'egg' && (
          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs dark:bg-yellow-900/30">Egg</span>
        )}
        {!item.dietary_type && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800">Not set</span>
        )}
      </td>
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
    control,
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
      tags: [],
      dietary_type: '',
      calories: null,
      allergens: [],
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
      tags: [],
      dietary_type: '',
      calories: '' as unknown as number | null,
      allergens: [],
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
      tags: TAG_OPTIONS.filter((opt) =>
        item.tags.some((tg) => normalizeTagToken(tg) === normalizeTagToken(opt.value))
      ).map((opt) => opt.value),
      dietary_type: item.dietary_type ?? inferDietaryTypeFromTags(item.tags),
      calories: item.calories,
      allergens: ALLERGEN_OPTIONS.filter((opt) =>
        item.allergens.some((a) => normalizeTagToken(a) === normalizeTagToken(opt.value))
      ).map((opt) => opt.value),
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
    // Carry forward any tag the dish already had that isn't one of our dropdown's canonical
    // options (e.g. the Chef Special/Popular/Recommended tags the backend manages itself) so
    // saving from this dropdown can't silently delete tags this form doesn't manage.
    const otherTags = editing
      ? editing.tags.filter((tg) => !CANONICAL_TAG_TOKENS.has(normalizeTagToken(tg)))
      : []
    const tags = [...data.tags, ...otherTags]
    const otherAllergens = editing
      ? editing.allergens.filter((a) => !CANONICAL_ALLERGEN_TOKENS.has(normalizeTagToken(a)))
      : []
    const allergens = [...data.allergens, ...otherAllergens]
    const available_days = data.available_days
      ? data.available_days.split(',').map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6)
      : []

    if (!data.dietary_type) {
      toast('Please select a dietary type (Vegetarian / Non-Vegetarian / Contains Egg)', 'error')
      return
    }

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
        classification_id: editing ? editing.classification_id ?? null : null,
        country_id: countryId,
        image,
        tags,
        dietary_type: data.dietary_type || null,
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
      const { id: _omitId, _id: _omitMongoId, ...rest } = item as MenuItemType & { _id?: string }
      const duplicate = {
        ...rest,
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


  // Export handler
  const handleExport = () => {
    // Export all fields from menuItems, using names for category, subcategory, and country
    const spiceOrder = ['mild', 'spicy', 'extra spicy'];
    const data = menuItems.map((item) => {
      const category = categories.find((c) => c.id === item.category_id)
      const subcategory = subcategories.find((sc) => sc.id === item.subcategory_id)
      const country = countries.find((co) => co.id === item.country_id)
      // Only include spice tags, sort as Mild, Spicy, Extra Spicy
      const spiceTags = (item.tags || [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => spiceOrder.includes(tag))
        .sort((a, b) => spiceOrder.indexOf(a) - spiceOrder.indexOf(b))
        .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));

      // Highlights column: Chef Special, Popular, Recommended
      const highlights = [];
      if (item.chef_special) highlights.push('Chef Special');
      if (item.popular) highlights.push('Popular');
      if (item.recommended) highlights.push('Recommended');

      return {
        id: item.id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        description_en: item.description_en,
        description_ar: item.description_ar,
        price: item.price,
        category: category ? category.name_en : item.category_id,
        subcategory: subcategory ? subcategory.name_en : item.subcategory_id,
        country: country ? country.name_en : item.country_id,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
        'Spice level': spiceTags.join(', '),
        Highlights: highlights.join(', '),
        calories: item.calories,
        allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens,
        visible: item.visible,
        chef_special: item.chef_special,
        popular: item.popular,
        recommended: item.recommended,
        available_from: item.available_from,
        available_to: item.available_to,
        available_days: Array.isArray(item.available_days) ? item.available_days.join(',') : item.available_days,
        image: item.image,
        order: item.order,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MenuItems')
    XLSX.writeFile(wb, 'menu_items_export.xlsx')
  }

  return (
    <>
      <Header
        title="Menu Items"
        subtitle="Manage dishes and their order"
        action={
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="primary" type="button">
              Export
            </Button>
            <Button onClick={() => openCreate()} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add dish
            </Button>
          </div>
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
                  <th className="py-3">Diet</th>
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
              <label className="mb-1 block text-sm font-medium">Dietary type (required)</label>
              <select
                {...register('dietary_type')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                <option value="">— Select —</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="nonVegetarian">Non-Vegetarian</option>
                <option value="egg">Contains Egg</option>
              </select>
              {errors.dietary_type && <p className="mt-1 text-sm text-red-600">{errors.dietary_type.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Calories</label>
              <input type="text" {...register('calories')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. 100 or 100-200" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <MultiSelectDropdown
                  options={TAG_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select tags"
                />
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Allergens</label>
            <Controller
              name="allergens"
              control={control}
              render={({ field }) => (
                <MultiSelectDropdown
                  options={ALLERGEN_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select allergens"
                />
              )}
            />
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

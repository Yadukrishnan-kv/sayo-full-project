import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import { ImageIcon, Pencil, UtensilsCrossed, Plus, Layout, Trash2 } from 'lucide-react'
import type { MenuSection } from '@/types'

function OurMenuCardEditor() {
  const ourMenuCard = useStore((s) => s.ourMenuCard)
  const setOurMenuCard = useStore((s) => s.setOurMenuCard)
  const toast = useToast()

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      title: ourMenuCard.title,
      title_ar: ourMenuCard.title_ar,
      description: ourMenuCard.description,
      description_ar: ourMenuCard.description_ar,
    },
  })

  const onSubmit = async (data: {
    title: string
    title_ar: string
    description: string
    description_ar: string
  }) => {
    try {
      const id = ourMenuCard.id
      const payload = { ...data, image: ourMenuCard.image }
      const updated = id ? await adminAPI.updateOurMenuCard(id, payload) : await adminAPI.getOurMenuCard()
      setOurMenuCard(updated)
      toast('Our Menu card saved', 'success')
    } catch (error) {
      console.error(error)
      toast('Failed to save Our Menu card', 'error')
    }
  }

  return (
    <Card className="mt-8">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <ImageIcon className="h-5 w-5" />
        Our Menu card
      </h3>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        The single entry card shown on the homepage that links visitors to the full menu.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Title (English)
            </label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Title (Arabic)
            </label>
            <input
              {...register('title_ar')}
              dir="rtl"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Description (English)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Description (Arabic)
            </label>
            <textarea
              {...register('description_ar')}
              dir="rtl"
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Image
          </label>
          <ImageUpload
            value={ourMenuCard.image}
            onChange={(url) => setOurMenuCard({ ...ourMenuCard, image: url })}
          />
        </div>
        <Button type="submit">
          Save Our Menu card
        </Button>
      </form>
    </Card>
  )
}

export function MenuLayoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { sections, categories, addSection, updateSection, deleteSection } = useStore()
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [addNameEn, setAddNameEn] = useState('')
  const [addNameAr, setAddNameAr] = useState('')
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null)
  const [editNameEn, setEditNameEn] = useState('')
  const [editNameAr, setEditNameAr] = useState('')
  const [editVisible, setEditVisible] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const categoriesBySection = (sectionId: string) =>
    categories.filter((c) => c.section_id === sectionId).sort((a, b) => a.order - b.order)

  const handleAddCategory = (sectionId: string) => {
    navigate('/categories', { state: { addForSectionId: sectionId } })
  }

  const handleOpenAddSection = () => {
    setAddNameEn('')
    setAddNameAr('')
    setAddSectionOpen(true)
  }

  const handleSaveAddSection = async () => {
    const name = addNameEn.trim()
    if (!name) {
      toast('Enter a section name (English).', 'error')
      return
    }

    try {
      const created = await adminAPI.createMenuSection({
        name_en: name,
        name_ar: addNameAr.trim(),
        order: sections.length,
        visible: true,
      })
      addSection(created)
      toast('Section added.')
      setAddSectionOpen(false)
    } catch (error) {
      console.error(error)
      toast('Failed to add section', 'error')
    }
  }

  const handleOpenEditSection = (section: MenuSection) => {
    setEditingSection(section)
    setEditNameEn(section.name_en)
    setEditNameAr(section.name_ar)
    setEditVisible(section.visible)
  }

  const handleSaveEditSection = async () => {
    if (!editingSection) return
    const name = editNameEn.trim()
    if (!name) {
      toast('Enter a section name (English).', 'error')
      return
    }

    try {
      const updated = await adminAPI.updateMenuSection(editingSection.id, {
        name_en: name,
        name_ar: editNameAr.trim(),
        visible: editVisible,
      })
      updateSection(editingSection.id, updated)
      toast('Section updated.')
      setEditingSection(null)
    } catch (error) {
      console.error(error)
      toast('Failed to update section', 'error')
    }
  }

  const handleDeleteSection = async (id: string) => {
    const cats = categoriesBySection(id)
    if (cats.length > 0) {
      toast(
        `Unlinking ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'} from this section. You can reassign them from Categories.`,
        'info'
      )
    }

    try {
      await adminAPI.deleteMenuSection(id)
      deleteSection(id)
      setDeleteConfirmId(null)
      toast('Section removed.')
    } catch (error) {
      console.error(error)
      toast('Failed to remove section', 'error')
    }
  }

  return (
    <>
      <Header
        title="Menu layout"
        subtitle="Where to add each part of your menu (hero, intro, sections, categories, items)"
      />

      <Card className="mt-8">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
          <ImageIcon className="h-5 w-5" />
          Top of menu page
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/banner"
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-elevated)]"
          >
            <span className="font-medium text-[var(--color-text-primary)]">Hero slider</span>
            <span className="text-sm text-[var(--color-text-secondary)]">Edit →</span>
          </Link>
          <Link
            to="/story"
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-elevated)]"
          >
            <span className="font-medium text-[var(--color-text-primary)]">SAYO intro</span>
            <span className="text-sm text-[var(--color-text-secondary)]">Edit →</span>
          </Link>
        </div>
      </Card>

      <OurMenuCardEditor />

      <div className="mt-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
            <Layout className="h-5 w-5" />
            Menu section headings & categories
          </h3>
          <Button variant="secondary" size="sm" onClick={handleOpenAddSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add section heading
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add section headings (e.g. Main Menu, Special Menu, Breakfast, Happy Hour), then add categories under each.
        </p>
        {sortedSections.map((section) => {
          const cats = categoriesBySection(section.id)
          const isDeleteConfirm = deleteConfirmId === section.id
          return (
            <Card key={section.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {section.name_en}
                    {!section.visible && (
                      <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">(hidden)</span>
                    )}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditSection(section)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!isDeleteConfirm ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(section.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-sm">
                      <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </Button>
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddCategory(section.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add category
                </Button>
              </div>
              <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                Categories listed under this heading (e.g. Food Menu | Beverages | Desserts)
              </p>
              {cats.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-text-secondary)]">
                  No categories yet. Add one above, then edit it to add sub-categories (Soup, Main, etc.).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cats.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2"
                    >
                      <span className="font-medium text-[var(--color-text-primary)]">{cat.name_en}</span>
                      <Link
                        to="/categories"
                        state={{ editCategoryId: cat.id }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        to={`/menu-items?category=${cat.id}`}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[var(--color-accent-primary)] hover:bg-[var(--color-border)]"
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        Manage items
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleOpenAddSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add section heading
          </Button>
          <Button variant="ghost" to="/categories">
            Manage all categories
          </Button>
        </div>
      </div>

      {/* Add section modal */}
      <Modal
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        title="Add section heading"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAddSection}>Add section</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
              Name (English) *
            </label>
            <input
              type="text"
              value={addNameEn}
              onChange={(e) => setAddNameEn(e.target.value)}
              placeholder="e.g. Breakfast, Happy Hour"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
              Name (Arabic)
            </label>
            <input
              type="text"
              value={addNameAr}
              onChange={(e) => setAddNameAr(e.target.value)}
              placeholder="اختياري"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-[var(--color-text-primary)]"
            />
          </div>
        </div>
      </Modal>

      {/* Edit section modal */}
      <Modal
        open={!!editingSection}
        onClose={() => setEditingSection(null)}
        title="Edit section heading"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditSection}>Save</Button>
          </div>
        }
      >
        {editingSection && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                Name (English) *
              </label>
              <input
                type="text"
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                Name (Arabic)
              </label>
              <input
                type="text"
                value={editNameAr}
                onChange={(e) => setEditNameAr(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-[var(--color-text-primary)]"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editVisible}
                onChange={(e) => setEditVisible(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">Visible on menu</span>
            </label>
          </div>
        )}
      </Modal>
    </>
  )
}

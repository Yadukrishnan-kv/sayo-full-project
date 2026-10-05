// Shared slug -> friendly label mapping for the Activity Log. Page-view tracking derives
// its slug from the route path; create/update/delete events use whatever module string that
// resource's API route already logs under. Both pass through this table for display.
export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'menu-layout': 'Menu Layout',
  'menu-sections': 'Menu Layout',
  banner: 'Banner',
  story: 'Story Section',
  categories: 'Categories',
  subcategories: 'Sub-Categories',
  countries: 'Countries',
  'menu-items': 'Menu Items',
  featured: 'Featured Dishes',
  filters: 'Filters & Tags',
  'filter-tags': 'Filters & Tags',
  media: 'Media Library',
  scheduling: 'Menu Scheduling',
  translations: 'Translations',
  customers: 'Customers',
  settings: 'Settings',
  'activity-log': 'Activity Log',
  auth: 'Login',
}

export function getModuleLabel(slug: string): string {
  if (MODULE_LABELS[slug]) return MODULE_LABELS[slug]
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// `pathname` here is react-router's location.pathname, which is already relative to the
// router's `basename` — no need to strip it again.
export function getModuleSlugFromPath(pathname: string): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return firstSegment || 'dashboard'
}

export const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Add',
  update: 'Edit',
  delete: 'Delete',
  login: 'Login',
  login_failed: 'Login Failed',
}

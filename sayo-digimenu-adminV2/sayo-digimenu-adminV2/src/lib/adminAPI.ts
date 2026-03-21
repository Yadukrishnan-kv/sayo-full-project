import axios, { AxiosInstance, AxiosError } from 'axios'
import type { MenuSection, Category, Classification, SubCategory, Country, MenuItem, Banner, StorySection, FilterTag, Settings, MediaItem } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class AdminAPIClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor(baseURL = API_BASE_URL) {
    this.loadToken()

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: Add auth token to every request
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`
      }
      return config
    })

    // Response interceptor: Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
        }
        throw error
      }
    )
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  }

  // ============ AUTHENTICATION ============

  async login(email: string, password: string) {
    const response = await this.client.post<{ token: string; user: { id: string; email: string } }>(
      '/api/auth/login',
      { email, password }
    )
    this.setToken(response.data.token)
    return response.data
  }

  // ============ MENU SECTIONS ============

  async getMenuSections() {
    const response = await this.client.get<MenuSection[]>('/api/menu-sections')
    return response.data
  }

  async createMenuSection(section: Omit<MenuSection, 'id'>) {
    const response = await this.client.post<MenuSection>('/api/menu-sections', section)
    return response.data
  }

  async updateMenuSection(id: string, section: Partial<MenuSection>) {
    const response = await this.client.put<MenuSection>(`/api/menu-sections/${id}`, section)
    return response.data
  }

  async deleteMenuSection(id: string) {
    await this.client.delete(`/api/menu-sections/${id}`)
  }

  // ============ CATEGORIES ============

  async getCategories() {
    const response = await this.client.get<Category[]>('/api/categories')
    return response.data
  }

  async createCategory(category: Omit<Category, 'id'>) {
    const response = await this.client.post<Category>('/api/categories', category)
    return response.data
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const response = await this.client.put<Category>(`/api/categories/${id}`, category)
    return response.data
  }

  async deleteCategory(id: string) {
    await this.client.delete(`/api/categories/${id}`)
  }

  // ============ CLASSIFICATIONS ============

  async getClassifications() {
    const response = await this.client.get<Classification[]>('/api/classifications')
    return response.data
  }

  async createClassification(classification: Omit<Classification, 'id'>) {
    const response = await this.client.post<Classification>('/api/classifications', classification)
    return response.data
  }

  async updateClassification(id: string, classification: Partial<Classification>) {
    const response = await this.client.put<Classification>(`/api/classifications/${id}`, classification)
    return response.data
  }

  async deleteClassification(id: string) {
    await this.client.delete(`/api/classifications/${id}`)
  }

  // ============ SUBCATEGORIES ============

  async getSubCategories() {
    const response = await this.client.get<SubCategory[]>('/api/subcategories')
    return response.data
  }

  async createSubCategory(subcategory: Omit<SubCategory, 'id'>) {
    const response = await this.client.post<SubCategory>('/api/subcategories', subcategory)
    return response.data
  }

  async updateSubCategory(id: string, subcategory: Partial<SubCategory>) {
    const response = await this.client.put<SubCategory>(`/api/subcategories/${id}`, subcategory)
    return response.data
  }

  async deleteSubCategory(id: string) {
    await this.client.delete(`/api/subcategories/${id}`)
  }

  // ============ COUNTRIES ============

  async getCountries() {
    const response = await this.client.get<Country[]>('/api/countries')
    return response.data
  }

  async createCountry(country: Omit<Country, 'id'>) {
    const response = await this.client.post<Country>('/api/countries', country)
    return response.data
  }

  async updateCountry(id: string, country: Partial<Country>) {
    const response = await this.client.put<Country>(`/api/countries/${id}`, country)
    return response.data
  }

  async deleteCountry(id: string) {
    await this.client.delete(`/api/countries/${id}`)
  }

  // ============ MENU ITEMS ============

  async getMenuItems() {
    const response = await this.client.get<MenuItem[]>('/api/menu-items')
    return response.data
  }

  async getMenuItem(id: string) {
    const response = await this.client.get<MenuItem>(`/api/menu-items/${id}`)
    return response.data
  }

  async createMenuItem(item: Omit<MenuItem, 'id'>) {
    const response = await this.client.post<MenuItem>('/api/menu-items', item)
    return response.data
  }

  async updateMenuItem(id: string, item: Partial<MenuItem>) {
    const response = await this.client.put<MenuItem>(`/api/menu-items/${id}`, item)
    return response.data
  }

  async deleteMenuItem(id: string) {
    await this.client.delete(`/api/menu-items/${id}`)
  }

  // ============ FILTER TAGS ============

  async getFilterTags() {
    const response = await this.client.get<FilterTag[]>('/api/filter-tags')
    return response.data
  }

  async createFilterTag(tag: Omit<FilterTag, 'id'>) {
    const response = await this.client.post<FilterTag>('/api/filter-tags', tag)
    return response.data
  }

  async updateFilterTag(id: string, tag: Partial<FilterTag>) {
    const response = await this.client.put<FilterTag>(`/api/filter-tags/${id}`, tag)
    return response.data
  }

  async deleteFilterTag(id: string) {
    await this.client.delete(`/api/filter-tags/${id}`)
  }

  // ============ BANNER & STORY ============

  async getBanner() {
    const response = await this.client.get<Banner>('/api/banner')
    return response.data
  }

  async updateBanner(id: string, banner: Partial<Banner>) {
    const response = await this.client.put<Banner>(`/api/banner/${id}`, banner)
    return response.data
  }

  async getStory() {
    const response = await this.client.get<StorySection>('/api/story')
    return response.data
  }

  async updateStory(id: string, story: Partial<StorySection>) {
    const response = await this.client.put<StorySection>(`/api/story/${id}`, story)
    return response.data
  }

  // ============ SETTINGS ============

  async getSettings() {
    const response = await this.client.get<Settings>('/api/settings')
    return response.data
  }

  async updateSettings(id: string, settings: Partial<Settings>) {
    const response = await this.client.put<Settings>(`/api/settings/${id}`, settings)
    return response.data
  }

  // ============ MEDIA / UPLOADS ============

  async getMedia() {
    const response = await this.client.get<MediaItem[]>('/api/media')
    return response.data
  }

  async uploadMedia(dataUrl: string, name?: string, size?: number) {
    const response = await this.client.post<MediaItem>('/api/media', {
      dataUrl,
      name,
      size,
    })
    return response.data
  }

  async deleteMedia(id: string) {
    await this.client.delete(`/api/media/${id}`)
  }

  // ============ ACTIVITY LOG ============

  async getCustomers(page: number = 1, pageSize: number = 20) {
    const response = await this.client.get<{ data: any[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/customers?page=${page}&pageSize=${pageSize}`
    )
    return response.data
  }

  async createCustomer(customer: { fullName: string; contactNumber: string; email: string; dateOfBirth?: string; anniversaryDate?: string }) {
    const response = await this.client.post('/api/customers', customer)
    return response.data
  }
}

export const adminAPI = new AdminAPIClient()
export default AdminAPIClient

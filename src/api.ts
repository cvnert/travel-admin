import axios from 'axios'
import type { HomeBanner, HomeBannerPayload, OrderStatus, ProductPayload, TravelOrder, TravelProduct } from './types'

const TOKEN_KEY = 'travel_admin_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(username: string, password: string) {
  const { data } = await api.post('/api/admin/login', { username, password })
  return data as { token: string; admin: { id: string; username: string } }
}

export async function listProducts(params: {
  page: number
  pageSize: number
  keyword?: string
}) {
  const { data } = await api.get('/api/admin/products', { params })
  return data as { productList: TravelProduct[]; total: number }
}

export async function getProduct(id: string) {
  const { data } = await api.get(`/api/admin/products/${id}`)
  return data.productDetail as TravelProduct
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post('/api/admin/products', payload)
  return data.product as TravelProduct
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const { data } = await api.put(`/api/admin/products/${id}`, payload)
  return data.product as TravelProduct
}

export async function updateProductStatus(id: string, status: string) {
  const { data } = await api.patch(`/api/admin/products/${id}/status`, {
    status,
  })
  return data.product as TravelProduct
}

export async function listHomeBanners() {
  const { data } = await api.get('/api/admin/home-banners')
  return data.bannerList as HomeBanner[]
}

export async function getHomeBanner(id: string) {
  const { data } = await api.get(`/api/admin/home-banners/${id}`)
  return data.banner as HomeBanner
}

export async function createHomeBanner(payload: HomeBannerPayload) {
  const { data } = await api.post('/api/admin/home-banners', payload)
  return data.banner as HomeBanner
}

export async function updateHomeBanner(id: string, payload: HomeBannerPayload) {
  const { data } = await api.put(`/api/admin/home-banners/${id}`, payload)
  return data.banner as HomeBanner
}

export async function updateHomeBannerStatus(id: string, status: string) {
  const { data } = await api.patch(`/api/admin/home-banners/${id}/status`, {
    status,
  })
  return data.banner as HomeBanner
}

export async function listOrders(params: {
  page: number
  pageSize: number
  keyword?: string
  status?: OrderStatus | ''
}) {
  const { data } = await api.get('/api/admin/orders', { params })
  return data as { orderList: TravelOrder[]; total: number }
}

export async function getOrder(id: string) {
  const { data } = await api.get(`/api/admin/orders/${id}`)
  return data.order as TravelOrder
}

export async function signImageUrls(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (uniqueKeys.length === 0) return {}

  const { data } = await api.post('/api/admin/uploads/sign', { keys: uniqueKeys })
  return data.urls as Record<string, string>
}

export function uploadImageUrl() {
  return `${api.defaults.baseURL || ''}/api/admin/uploads/images`
}

export function authUploadHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function assetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${api.defaults.baseURL || ''}${url}`
}

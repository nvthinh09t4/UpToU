import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5070/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue: Array<() => void> = []

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(apiClient(original)))
        })
      }
      original._retry = true
      refreshing = true
      try {
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const token = res.data.accessToken as string
        useAuthStore.getState().setAccessToken(token)
        queue.forEach((fn) => fn())
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

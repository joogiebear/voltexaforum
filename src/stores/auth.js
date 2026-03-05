import { defineStore } from 'pinia'
import { getUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('voltexahub_token') || null,
    loading: false,
    error: null,
    initialized: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.roles?.some(r => r.name === 'admin') || false,
    isModerator: (state) => state.user?.roles?.some(r => r.name === 'moderator' || r.name === 'admin') || false,
    username: (state) => state.user?.username || '',
    credits: (state) => state.user?.credits || 0,
    avatarColor: (state) => state.user?.avatar_color || '#7c3aed',
    avatarUrl: (state) => state.user?.avatar_url || null,
    perks: (state) => state.user?.perks ?? [],
  },
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const res = await apiLogin(credentials)
        this.token = res.data.data.token
        this.user = res.data.data.user
        localStorage.setItem('voltexahub_token', this.token)
        return true
      } catch (e) {
        this.error = e.response?.data?.message || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },
    async register(data) {
      this.loading = true
      this.error = null
      try {
        const res = await apiRegister(data)
        this.token = res.data.data.token
        this.user = res.data.data.user
        localStorage.setItem('voltexahub_token', this.token)
        return true
      } catch (e) {
        this.error = e.response?.data?.errors || e.response?.data?.message || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try { await apiLogout() } catch {}
      this.token = null
      this.user = null
      localStorage.removeItem('voltexahub_token')
    },
    hasPerk(type) {
      return this.perks.includes(type)
    },
    setAvatarUrl(url) {
      if (this.user) this.user = { ...this.user, avatar_url: url }
    },
    async fetchUser() {
      if (!this.token) return
      try {
        const res = await getUser()
        this.user = res.data.data
      } catch (e) {
        // Only clear token on explicit 401 — not network errors or 500s
        if (e.response?.status === 401) {
          this.token = null
          localStorage.removeItem('voltexahub_token')
        }
      } finally {
        this.initialized = true
      }
    },
  },
})

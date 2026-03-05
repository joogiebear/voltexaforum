import axios from 'axios'
import router from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voltexahub_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('voltexahub_token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const logout = () => api.post('/auth/logout')
export const getUser = () => api.get('/user')
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (data) => api.post('/auth/reset-password', data)

// Forum
export const getForumConfig = () => api.get('/forum/config')
export const getCategories = () => api.get('/categories')
export const getForums = () => api.get('/forums')
export const getForumThreads = (slug, page = 1, search = '') => api.get('/forums/' + slug + '/threads', { params: { page, ...(search ? { search } : {}) } })
export const getThread = (id) => api.get('/threads/' + id)
export const getThreadPosts = (id, page = 1) => api.get('/threads/' + id + '/posts', { params: { page } })
export const createThread = (data) => api.post('/threads', data)
export const createPost = (threadId, data) => api.post('/threads/' + threadId + '/posts', data)
export const reactToPost = (postId, type) => api.post('/posts/' + postId + '/react', { type })
export const deletePost = (postId) => api.delete('/posts/' + postId)
export const updatePost = (id, data) => api.put('/posts/' + id, data)
export const updateThread = (id, data) => api.put('/threads/' + id, data)
export const likeThread = (id) => api.post('/threads/' + id + '/like')
export const likePost = (id) => api.post('/posts/' + id + '/like')

// Search
export const search = (query, type = 'all', page = 1) => api.get('/search', { params: { q: query, type, page } })

// User
export const uploadAvatar = (formData) => api.post('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const uploadPostbitBg = (formData) => api.post('/user/postbit-bg', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const removePostbitBg = () => api.delete('/user/postbit-bg')
export const getUserProfile = (username) => api.get('/users/' + username + '/profile')
export const updateProfile = (data) => api.put('/user/profile', data)
export const updateAccount = (data) => api.put('/user/account', data)
export const getUserCredits = () => api.get('/user/credits')
export const getCreditsEarningInfo = () => api.get('/credits/earning-info')
export const getUserAchievements = () => api.get('/user/achievements')
export const getUserAwards = () => api.get('/user/awards')
export const getUserNotifications = () => api.get('/user/notifications')
export const getUserCosmetics = () => api.get('/user/cosmetics')
export const toggleCosmetic = (id) => api.put('/user/cosmetics/' + id + '/toggle')
export const updateNotificationSettings = (data) => api.put('/user/settings/notifications', data)
export const updatePrivacySettings = (data) => api.put('/user/settings/privacy', data)
export const getUserSessions = () => api.get('/user/sessions')
export const deleteSession = (id) => api.delete('/user/sessions/' + id)

// Store
export const getStoreItems = (params) => api.get('/store/items', { params })
export const purchaseWithCredits = (data) => api.post('/store/purchase', data)
export const createCheckout = (data) => api.post('/store/checkout', data)

// Notifications
export const getNotifications = () => api.get('/notifications')
export const markNotificationRead = (id) => api.post('/notifications/' + id + '/read')
export const markAllNotificationsRead = () => api.post('/notifications/read-all')
export const deleteNotification = (id) => api.delete('/notifications/' + id)

// Conversations / DMs
export const getConversations = () => api.get('/conversations')
export const startConversation = (payload) => api.post('/conversations', payload)
export const getConversation = (id) => api.get('/conversations/' + id)
export const sendMessage = (id, body) => api.post('/conversations/' + id + '/messages', { body })
export const getDMUnreadCount = () => api.get('/conversations/unread-count')

// Online Users
export const getOnlineUsers = () => api.get('/users/online')

// Achievements
export const getAchievements = () => api.get('/achievements')

// Admin - Dashboard
export const getAdminDashboard = () => api.get('/admin/dashboard')

// Admin - Users
export const getAdminUsers = (params) => api.get('/admin/users', { params })
export const getAdminUser = (id) => api.get('/admin/users/' + id)
export const updateAdminUser = (id, data) => api.put('/admin/users/' + id, data)
export const banUser = (id, data) => api.post('/admin/users/' + id + '/ban', data)
export const unbanUser = (id) => api.delete('/admin/users/' + id + '/ban')
export const adjustUserCredits = (id, data) => api.post('/admin/users/' + id + '/credits', data)
export const grantAward = (id, data) => api.post('/admin/users/' + id + '/awards', data)
export const revokeAward = (id, awardId) => api.delete('/admin/users/' + id + '/awards/' + awardId)

// Admin - Forums
export const getAdminForumTree = () => api.get('/admin/forums/tree')
export const createAdminCategory = (data) => api.post('/admin/categories', data)
export const updateAdminCategory = (id, data) => api.put('/admin/categories/' + id, data)
export const deleteAdminCategory = (id) => api.delete('/admin/categories/' + id)
export const createAdminForum = (data) => api.post('/admin/forums', data)
export const updateAdminForum = (id, data) => api.put('/admin/forums/' + id, data)
export const deleteAdminForum = (id) => api.delete('/admin/forums/' + id)
export const reorderCategories = (items) => api.post('/admin/categories/reorder', { items })
export const reorderForums = (items) => api.post('/admin/forums/reorder', { items })

// Admin - Moderation
export const getAdminThreads = (params) => api.get('/admin/threads', { params })
export const pinThread = (id) => api.put('/admin/threads/' + id + '/pin')
export const lockThread = (id) => api.put('/admin/threads/' + id + '/lock')
export const solveThread = (id) => api.put('/admin/threads/' + id + '/solve')
export const adminDeletePost = (id) => api.delete('/admin/posts/' + id)
export const deleteThread = (id) => api.delete('/admin/threads/' + id)
export const moveThread = (id, forumId) => api.put('/admin/threads/' + id + '/move', { forum_id: forumId })

// Admin - Store
export const getAdminStoreItems = (params) => api.get('/admin/store/items', { params })
export const createAdminStoreItem = (data) => api.post('/admin/store/items', data)
export const updateAdminStoreItem = (id, data) => api.put('/admin/store/items/' + id, data)
export const deleteAdminStoreItem = (id) => api.delete('/admin/store/items/' + id)
export const getAdminPurchases = (params) => api.get('/admin/store/purchases', { params })
export const deliverPurchase = (id) => api.post('/admin/store/purchases/' + id + '/deliver')

// Admin - Achievements & Awards
export const getAdminAchievements = () => api.get('/admin/achievements')
export const createAdminAchievement = (data) => api.post('/admin/achievements', data)
export const updateAdminAchievement = (id, data) => api.put('/admin/achievements/' + id, data)
export const deleteAdminAchievement = (id) => api.delete('/admin/achievements/' + id)
export const getAdminAwards = () => api.get('/admin/awards')
export const createAdminAward = (data) =>
  api.post('/admin/awards', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
export const updateAdminAward = (id, data) =>
  data instanceof FormData
    ? api.post('/admin/awards/' + id + '?_method=PUT', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.put('/admin/awards/' + id, data)
export const deleteAdminAward = (id) => api.delete('/admin/awards/' + id)

// Admin - Groups
export const getAdminGroups = () => api.get('/admin/groups')
export const getUpgradePlans = () => api.get('/upgrade-plans')
export const getAdminUpgradePlans = () => api.get('/admin/upgrade-plans')
export const createAdminUpgradePlan = (d) => api.post('/admin/upgrade-plans', d)
export const updateAdminUpgradePlan = (id, d) => api.put('/admin/upgrade-plans/' + id, d)
export const deleteAdminUpgradePlan = (id) => api.delete('/admin/upgrade-plans/' + id)
export const createAdminGroup = (d) => api.post('/admin/groups', d)
export const updateAdminGroup = (id, d) => api.put('/admin/groups/' + id, d)
export const deleteAdminGroup = (id) => api.delete('/admin/groups/' + id)

// Admin - Plugins
export const getAdminPlugins = () => api.get('/admin/plugins')
export const installPlugin = (slug) => api.post('/admin/plugins/install', { slug })
export const togglePlugin = (slug) => api.post(`/admin/plugins/${slug}/toggle`)
export const uninstallPlugin = (slug) => api.delete(`/admin/plugins/${slug}`)

// Announcements
export const getAnnouncements = () => api.get('/announcements')
export const getAdminAnnouncements = () => api.get('/admin/announcements')
export const createAnnouncement = (data) => api.post('/admin/announcements', data)
export const updateAnnouncement = (id, data) => api.put(`/admin/announcements/${id}`, data)
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`)

// Admin - Config
export const getAdminConfig = () => api.get('/admin/config')
export const updateAdminConfig = (data) => api.put('/admin/config', data)

// Admin - Logo
export const uploadLogo = (formData) => api.post('/admin/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const removeLogo = () => api.delete('/admin/logo')
export const getMembers = (params) => api.get('/members', { params })
export const getStaff = () => api.get('/staff')
export const getForumPermissions = (forumId) => api.get(`/admin/forums/${forumId}/permissions`)
export const updateForumPermissions = (forumId, data) => api.put(`/admin/forums/${forumId}/permissions`, data)
export const getGroupPermissions = () => api.get('/admin/group-permissions')
export const updateGroupPermissions = (data) => api.put('/admin/group-permissions', data)
export const testAdminEmail = () => api.post('/admin/config/test-email')

// Reports
export const reportPost = (data) => api.post('/reports', data)
export const getAdminReports = (params) => api.get('/admin/reports', { params })
export const updateAdminReport = (id, data) => api.put(`/admin/reports/${id}`, data)

// Thread Subscriptions
export const toggleThreadSubscription = (threadId) => api.post(`/threads/${threadId}/subscribe`)
export const getThreadSubscription = (threadId) => api.get(`/threads/${threadId}/subscription`)

// Thread Solved / Best Answer
export const markSolved = (threadId, postId) => api.post(`/threads/${threadId}/solved`, { post_id: postId })
export const unmarkSolved = (threadId) => api.delete(`/threads/${threadId}/solved`)

// Leaderboard
export const getLeaderboard = (params) => api.get('/leaderboard', { params })

// Thread Prefixes
export const getThreadPrefixes = () => api.get('/thread-prefixes')
export const getAdminThreadPrefixes = () => api.get('/admin/thread-prefixes')
export const createThreadPrefix = (data) => api.post('/admin/thread-prefixes', data)
export const updateThreadPrefix = (id, data) => api.put(`/admin/thread-prefixes/${id}`, data)
export const deleteThreadPrefix = (id) => api.delete(`/admin/thread-prefixes/${id}`)
export const reorderThreadPrefixes = (items) => api.post('/admin/thread-prefixes/reorder', { items })

// Tags
export const getTags = (params) => api.get('/tags', { params })
export const getTagThreads = (slug, params) => api.get(`/tags/${slug}/threads`, { params })

// Admin Content
export const getAdminContentThreads = (params) => api.get('/admin/content/threads', { params })
export const getAdminContentPosts = (params) => api.get('/admin/content/posts', { params })

// Custom Code (public)
export const getCustomCode = () => api.get('/public/custom-code')

// Email Verification
export const verifyEmail = (params) => api.post('/email/verify', params)
export const resendVerification = () => api.post('/email/resend')

export const uploadImage = (formData) => api.post("/media/image", formData, { headers: { "Content-Type": "multipart/form-data" } })
export const previewContent = (data) => api.post("/content/preview", data)

// Ads
export const getAds = () => api.get('/ads')

// User perks
export const uploadCover = (formData) => api.post('/user/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateCoverOverlay = (opacity) => api.put('/user/cover/overlay', { opacity })
export const removeCover = () => api.delete('/user/cover')
export const saveCustomCss = (data) => api.post('/user/custom-css', data)
export const saveUsernameColor = (data) => api.post('/user/username-color', data)
export const saveUserbarHue = (data) => api.post('/user/userbar-hue', data)
export const changeUsername = (data) => api.post('/user/change-username', data)
export const saveAwardsOrder = (data) => api.post('/user/awards-order', data)

// Locked content
export const unlockContent = (data) => api.post('/locked-content/unlock', data)
export const checkUnlocked = (hash) => api.get('/locked-content/check', { params: { content_hash: hash } })
export const getContentStatus = (hash) => api.get(`/locked-content/${hash}/status`)
export const reportContent = (hash, status) => api.post(`/locked-content/${hash}/report`, { status })

// Admin - Payment Providers
export const getPaymentProviders = () => api.get('/admin/payment-providers')
export const updatePaymentProvider = (provider, data) => api.put(`/admin/payment-providers/${provider}`, data)

// Admin - Advertisements
export const getAdminAds = () => api.get('/admin/advertisements')
export const createAd = (data) => api.post('/admin/advertisements', data)
export const updateAd = (id, data) => api.put(`/admin/advertisements/${id}`, data)
export const deleteAd = (id) => api.delete(`/admin/advertisements/${id}`)
export const toggleAd = (id) => api.post(`/admin/advertisements/${id}/toggle`)

// Admin - Unlock Requirements
export const getUnlockRequirements = () => api.get('/admin/unlock-requirements')
export const updateUnlockRequirements = (data) => api.put('/admin/unlock-requirements', data)

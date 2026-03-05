<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import {
  updateProfile,
  updateAccount,
  updateNotificationSettings,
  updatePrivacySettings,
  getUserCosmetics,
  toggleCosmetic,
  getUserSessions,
  deleteSession,
  uploadAvatar,
  uploadPostbitBg,
  removePostbitBg,
  uploadCover,
  updateCoverOverlay,
  removeCover,
  saveCustomCss as apiSaveCustomCss,
  saveUsernameColor as apiSaveUsernameColor,
  saveUserbarHue as apiSaveUserbarHue,
  changeUsername as apiChangeUsername,
  saveAwardsOrder as apiSaveAwardsOrder,
  getUserAwards,
} from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const authStore = useAuthStore()

const activeSection = ref('profile')
const saving = ref(false)
const saveMessage = ref(null)
const saveError = ref(null)

const allSidebarLinks = [
  { id: 'profile', label: 'Profile', icon: 'fa-solid fa-user' },
  { id: 'account', label: 'Account', icon: 'fa-solid fa-lock' },
  { id: 'notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  { id: 'privacy', label: 'Privacy', icon: 'fa-solid fa-eye' },
  { id: 'cosmetics', label: 'Cosmetics', icon: 'fa-solid fa-palette' },
  { id: 'sessions', label: 'Sessions', icon: 'fa-solid fa-desktop' },
  { id: 'cover', label: 'Profile Cover', icon: 'fa-solid fa-image', perk: 'profile_cover' },
  { id: 'postbit', label: 'Postbit Background', icon: 'fa-solid fa-panorama', perk: null },
  { id: 'customcss', label: 'Custom CSS', icon: 'fa-solid fa-code', perk: 'custom_css' },
  { id: 'username-color', label: 'Username Color', icon: 'fa-solid fa-palette', perk: 'username_color' },
  { id: 'userbar-hue', label: 'Userbar Hue', icon: 'fa-solid fa-sliders', perk: 'userbar_hue' },
  { id: 'change-username', label: 'Change Username', icon: 'fa-solid fa-user-pen', perk: 'change_username' },
  { id: 'awards-order', label: 'Awards Order', icon: 'fa-solid fa-trophy', perk: 'awards_reorder' },
]

const sidebarLinks = computed(() =>
  allSidebarLinks.filter(link => !link.perk || authStore.hasPerk(link.perk))
)

// Avatar upload
const avatarFileInput = ref(null)
const avatarPreview = ref(null)
const avatarFile = ref(null)
const avatarUploading = ref(false)

function handleAvatarSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    saveError.value = 'Avatar must be under 2MB.'
    return
  }
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    avatarPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function handleAvatarUpload() {
  if (!avatarFile.value) return
  avatarUploading.value = true
  clearMessages()
  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)
    const res = await uploadAvatar(formData)
    const newUrl = res.data.data?.avatar_url || res.data.avatar_url
    if (newUrl) {
      authStore.setAvatarUrl(newUrl)
    }
    avatarPreview.value = null
    avatarFile.value = null
    saveMessage.value = 'Avatar uploaded successfully!'
    await authStore.fetchUser()
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to upload avatar.'
  } finally {
    avatarUploading.value = false
  }
}

// Postbit Background
const postbitBgFileInput = ref(null)
const postbitBgPreview = ref(null)
const postbitBgFile = ref(null)
const postbitBgUploading = ref(false)
const postbitBgRemoving = ref(false)
const currentPostbitBg = ref(null)

function handlePostbitBgSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'Postbit background must be under 5MB.'
    return
  }
  postbitBgFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    postbitBgPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function handlePostbitBgUpload() {
  if (!postbitBgFile.value) return
  postbitBgUploading.value = true
  clearMessages()
  try {
    const formData = new FormData()
    formData.append('image', postbitBgFile.value)
    const res = await uploadPostbitBg(formData)
    const url = res.data.data?.postbit_bg
    if (url) {
      currentPostbitBg.value = url
      authStore.user.postbit_bg = url
    }
    postbitBgPreview.value = null
    postbitBgFile.value = null
    saveMessage.value = 'Postbit background uploaded!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to upload postbit background.'
  } finally {
    postbitBgUploading.value = false
  }
}

async function handlePostbitBgRemove() {
  postbitBgRemoving.value = true
  clearMessages()
  try {
    await removePostbitBg()
    currentPostbitBg.value = null
    authStore.user.postbit_bg = null
    postbitBgPreview.value = null
    postbitBgFile.value = null
    saveMessage.value = 'Postbit background removed.'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to remove postbit background.'
  } finally {
    postbitBgRemoving.value = false
  }
}

// Profile
const avatarColors = [
  'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-red-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]
const selectedAvatar = ref('')
const userTitle = ref('')
const bio = ref('')
const signature = ref('')
const discordUsername = ref('')
const twitterHandle = ref('')
const website = ref('')

// Account
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Notifications
const notificationSettings = ref([])

// Privacy
const profileVisibility = ref('everyone')
const onlineStatus = ref('everyone')
const postHistory = ref('everyone')
const hideFromSearch = ref(false)
const allowDMs = ref(true)
const visibilityOptions = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'members', label: 'Members only' },
  { value: 'nobody', label: 'Nobody' },
]

// Cosmetics
const ownedCosmetics = ref([])

// Sessions
const sessions = ref([])

// Cover Photo
const coverFileInput = ref(null)
const coverPreview = ref(null)
const coverFile = ref(null)
const coverUploading = ref(false)
const coverRemoving = ref(false)
const coverOverlayOpacity = ref(authStore.user?.cover_overlay_opacity ?? 20)
const coverOverlaySaving = ref(false)

function handleCoverSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'Cover photo must be under 5MB.'
    return
  }
  coverFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { coverPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

async function handleCoverUpload() {
  if (!coverFile.value) return
  coverUploading.value = true
  clearMessages()
  try {
    const formData = new FormData()
    formData.append('image', coverFile.value)
    const res = await uploadCover(formData)
    authStore.user.cover_url = res.data.cover_url
    coverPreview.value = null
    coverFile.value = null
    saveMessage.value = 'Cover photo uploaded!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to upload cover photo.'
  } finally {
    coverUploading.value = false
  }
}

async function handleCoverRemove() {
  coverRemoving.value = true
  clearMessages()
  try {
    await removeCover()
    authStore.user.cover_url = null
    coverPreview.value = null
    coverFile.value = null
    saveMessage.value = 'Cover photo removed.'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to remove cover photo.'
  } finally {
    coverRemoving.value = false
  }
}

async function handleOverlaySave() {
  coverOverlaySaving.value = true
  clearMessages()
  try {
    await updateCoverOverlay(coverOverlayOpacity.value)
    if (authStore.user) authStore.user.cover_overlay_opacity = coverOverlayOpacity.value
    saveMessage.value = 'Overlay opacity saved.'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save overlay.'
  } finally {
    coverOverlaySaving.value = false
  }
}

// Custom CSS
const customCss = ref('')

async function handleSaveCustomCss() {
  clearMessages()
  saving.value = true
  try {
    await apiSaveCustomCss({ css: customCss.value })
    authStore.user.custom_css = customCss.value
    saveMessage.value = 'Custom CSS saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save custom CSS.'
  } finally {
    saving.value = false
  }
}

// Username Color
const usernameColor = ref('#7c3aed')

async function handleSaveUsernameColor() {
  clearMessages()
  saving.value = true
  try {
    await apiSaveUsernameColor({ color: usernameColor.value })
    authStore.user.username_color = usernameColor.value
    saveMessage.value = 'Username color saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save username color.'
  } finally {
    saving.value = false
  }
}

async function handleResetUsernameColor() {
  clearMessages()
  saving.value = true
  try {
    await apiSaveUsernameColor({ color: null })
    authStore.user.username_color = null
    usernameColor.value = '#7c3aed'
    saveMessage.value = 'Username color reset.'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to reset username color.'
  } finally {
    saving.value = false
  }
}

// Userbar Hue
const userbarHue = ref(0)

async function handleSaveUserbarHue() {
  clearMessages()
  saving.value = true
  try {
    await apiSaveUserbarHue({ hue: userbarHue.value })
    authStore.user.userbar_hue = userbarHue.value
    saveMessage.value = 'Userbar hue saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save userbar hue.'
  } finally {
    saving.value = false
  }
}

// Change Username
const newUsername = ref('')

const usernameChangedAt = computed(() => authStore.user?.username_changed_at ? new Date(authStore.user.username_changed_at) : null)
const nextUsernameDate = computed(() => usernameChangedAt.value ? new Date(usernameChangedAt.value.getTime() + 30 * 86400000) : null)
const canChangeUsername = computed(() => !usernameChangedAt.value || nextUsernameDate.value <= new Date())

async function handleChangeUsername() {
  clearMessages()
  saving.value = true
  try {
    await apiChangeUsername({ username: newUsername.value })
    saveMessage.value = 'Username changed successfully!'
    newUsername.value = ''
    await authStore.fetchUser()
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to change username.'
  } finally {
    saving.value = false
  }
}

// Awards Order
const userAwards = ref([])

async function handleSaveAwardsOrder() {
  clearMessages()
  saving.value = true
  try {
    const ids = userAwards.value.map(a => a.id)
    await apiSaveAwardsOrder({ award_ids: ids })
    saveMessage.value = 'Awards order saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save awards order.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // Populate from auth user
  const user = authStore.user
  if (user) {
    selectedAvatar.value = user.avatar_color || 'bg-purple-500'
    userTitle.value = user.user_title || ''
    bio.value = user.bio || ''
    signature.value = user.signature || ''
    discordUsername.value = user.discord || ''
    twitterHandle.value = user.twitter || ''
    website.value = user.website || ''
    email.value = user.email || ''
    currentPostbitBg.value = user.postbit_bg || null
    notificationSettings.value = user.notification_settings || [
      { id: 'thread-replies', label: 'Thread replies', description: 'Notify when someone replies to your thread', enabled: true },
      { id: 'mentions', label: 'Mentions', description: 'Notify when someone @mentions you', enabled: true },
      { id: 'dms', label: 'Direct Messages', description: 'Notify when you receive a DM', enabled: true },
      { id: 'achievements', label: 'Achievement unlocked', description: 'Notify when you earn an achievement', enabled: true },
      { id: 'awards', label: 'Award received', description: 'Notify when staff grant you an award', enabled: true },
      { id: 'store', label: 'Store purchase confirmed', description: 'Notify on successful purchase', enabled: true },
      { id: 'credits', label: 'Credits earned', description: 'Notify when you earn credits', enabled: true },
    ]
    profileVisibility.value = user.privacy?.profile_visibility || 'everyone'
    onlineStatus.value = user.privacy?.online_status || 'everyone'
    postHistory.value = user.privacy?.post_history || 'everyone'
    hideFromSearch.value = user.privacy?.hide_from_search || false
    allowDMs.value = user.privacy?.allow_dms !== false
    customCss.value = user.custom_css || ''
    usernameColor.value = user.username_color || '#7c3aed'
    userbarHue.value = user.userbar_hue ?? 0
  }

  // Fetch cosmetics & sessions
  try {
    const [cosmeticsRes, sessionsRes] = await Promise.all([
      getUserCosmetics(),
      getUserSessions(),
    ])
    ownedCosmetics.value = cosmeticsRes.data.data
    sessions.value = sessionsRes.data.data
  } catch {}

  // Fetch user awards for awards-order section
  if (authStore.hasPerk('awards_reorder')) {
    try {
      const awardsRes = await getUserAwards()
      userAwards.value = awardsRes.data.data || []
    } catch {}
  }
})

function clearMessages() {
  saveMessage.value = null
  saveError.value = null
}

async function saveProfile() {
  clearMessages()
  saving.value = true
  try {
    await updateProfile({
      avatar_color: selectedAvatar.value,
      user_title: userTitle.value,
      bio: bio.value,
      signature: signature.value,
      discord: discordUsername.value,
      twitter: twitterHandle.value,
      website: website.value,
    })
    saveMessage.value = 'Profile saved successfully!'
    await authStore.fetchUser()
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save profile.'
  } finally {
    saving.value = false
  }
}

async function saveAccount() {
  clearMessages()
  saving.value = true
  try {
    await updateAccount({
      email: email.value,
      current_password: currentPassword.value || undefined,
      password: newPassword.value || undefined,
      password_confirmation: confirmPassword.value || undefined,
    })
    saveMessage.value = 'Account updated successfully!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to update account.'
  } finally {
    saving.value = false
  }
}

async function saveNotifications() {
  clearMessages()
  saving.value = true
  try {
    const settings = {}
    for (const s of notificationSettings.value) {
      settings[s.id] = s.enabled
    }
    await updateNotificationSettings(settings)
    saveMessage.value = 'Notification settings saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save notification settings.'
  } finally {
    saving.value = false
  }
}

async function savePrivacy() {
  clearMessages()
  saving.value = true
  try {
    await updatePrivacySettings({
      profile_visibility: profileVisibility.value,
      online_status: onlineStatus.value,
      post_history: postHistory.value,
      hide_from_search: hideFromSearch.value,
      allow_dms: allowDMs.value,
    })
    saveMessage.value = 'Privacy settings saved!'
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Failed to save privacy settings.'
  } finally {
    saving.value = false
  }
}

async function handleToggleCosmetic(cosmetic) {
  try {
    await toggleCosmetic(cosmetic.id)
    cosmetic.active = !cosmetic.active
  } catch {}
}

async function handleRemoveSession(id) {
  try {
    await deleteSession(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
  } catch {}
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>

    <!-- Toast messages -->
    <div v-if="saveMessage" class="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center justify-between">
      {{ saveMessage }}
      <button @click="saveMessage = null" class="text-green-400 hover:text-green-300">&#10005;</button>
    </div>
    <div v-if="saveError" class="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
      {{ saveError }}
      <button @click="saveError = null" class="text-red-400 hover:text-red-300">&#10005;</button>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Sidebar (mobile: select dropdown) -->
      <div class="lg:hidden mb-2">
        <select
          v-model="activeSection"
          class="w-full px-4 py-3 rounded-lg font-medium border transition-colors"
          :class="isDark
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'"
        >
          <option v-for="link in sidebarLinks" :key="link.id" :value="link.id">
            {{ link.label }}
          </option>
        </select>
      </div>

      <!-- Sidebar (desktop) -->
      <aside class="hidden lg:block w-64 shrink-0">
        <div
          class="rounded-xl overflow-hidden sticky top-20"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <!-- User info -->
          <div class="p-5 text-center border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
            <div class="flex justify-center mb-3">
              <UserAvatar
                :name="authStore.username"
                :color="selectedAvatar"
                :avatar-url="authStore.avatarUrl"
                :online="true"
                size="xl"
              />
            </div>
            <p class="font-bold text-lg">{{ authStore.username }}</p>
          </div>

          <!-- Nav links -->
          <nav class="p-2">
            <button
              v-for="link in sidebarLinks"
              :key="link.id"
              @click="activeSection = link.id; clearMessages()"
              class="w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-3"
              :class="activeSection === link.id
                ? 'bg-purple-accent/15 text-purple-accent'
                : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
            >
              <i :class="[link.icon, 'w-4 text-center']"></i>
              {{ link.label }}
            </button>
          </nav>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <div
          class="rounded-xl p-6"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <!-- PROFILE -->
          <div v-show="activeSection === 'profile'">
            <h2 class="text-xl font-bold mb-6">Profile</h2>

            <!-- Avatar Upload -->
            <div class="mb-6">
              <label class="block text-sm font-medium mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Avatar</label>
              <div class="flex items-center gap-5">
                <button
                  type="button"
                  @click="avatarFileInput?.click()"
                  class="relative group cursor-pointer"
                >
                  <img
                    v-if="avatarPreview"
                    :src="avatarPreview"
                    class="w-20 h-20 rounded-full object-cover"
                  />
                  <img
                    v-else-if="authStore.avatarUrl"
                    :src="authStore.avatarUrl"
                    class="w-20 h-20 rounded-full object-cover"
                  />
                  <UserAvatar
                    v-else
                    :name="authStore.username"
                    :color="selectedAvatar"
                    :online="false"
                    size="xl"
                  />
                  <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-camera text-white text-lg"></i>
                  </div>
                </button>
                <div>
                  <input
                    ref="avatarFileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleAvatarSelect"
                  />
                  <button
                    v-if="avatarFile"
                    @click="handleAvatarUpload"
                    :disabled="avatarUploading"
                    class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg v-if="avatarUploading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {{ avatarUploading ? 'Uploading...' : 'Upload' }}
                  </button>
                  <p v-else class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    Click avatar to change. JPG, PNG, GIF, WebP &mdash; max 5MB<br>
                    Recommended: <strong>200×200 px</strong>. Auto-resized to 300×300 and converted to WebP.
                  </p>
                </div>
              </div>
            </div>



            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Avatar Color</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="color in avatarColors"
                  :key="color"
                  @click="selectedAvatar = color"
                  class="w-10 h-10 rounded-full transition-all duration-200"
                  :class="[color, selectedAvatar === color ? 'ring-2 ring-purple-accent ring-offset-2 scale-110' : 'hover:scale-105']"
                />
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Username</label>
              <input
                type="text"
                :value="authStore.username"
                disabled
                class="w-full px-4 py-2.5 rounded-lg border opacity-50 cursor-not-allowed"
                :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-400'"
              />
              <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Contact staff to change your username</p>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">User Title</label>
              <input
                type="text"
                v-model="userTitle"
                placeholder="Enter a custom title..."
                class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2 flex items-center justify-between" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                <span>Bio</span>
                <span class="text-xs font-normal" :class="bio.length > 500 ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-400'">{{ bio.length }}/500</span>
              </label>
              <textarea
                v-model="bio"
                maxlength="500"
                rows="4"
                placeholder="Tell others about yourself..."
                class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
                :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2 flex items-center justify-between" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                <span>Signature</span>
                <span class="text-xs font-normal" :class="signature.length > 255 ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-400'">{{ signature.length }}/255</span>
              </label>
              <textarea
                v-model="signature"
                maxlength="255"
                rows="2"
                placeholder="Your forum signature..."
                class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
                :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
              />
              <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Basic text only. Displayed at the bottom of your posts.</p>
            </div>

            <div class="mb-6 space-y-4">
              <label class="block text-sm font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Social Links</label>
              <div class="flex items-center gap-3">
                <i class="fa-brands fa-discord w-8 text-center text-lg"></i>
                <input
                  type="text"
                  v-model="discordUsername"
                  placeholder="Discord username"
                  class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
              </div>
              <div class="flex items-center gap-3">
                <i class="fa-brands fa-x-twitter w-8 text-center text-lg"></i>
                <input
                  type="text"
                  v-model="twitterHandle"
                  placeholder="Twitter/X handle"
                  class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
              </div>
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-globe w-8 text-center text-lg"></i>
                <input
                  type="text"
                  v-model="website"
                  placeholder="Website URL"
                  class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
              </div>
            </div>

            <button
              @click="saveProfile"
              :disabled="saving"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>

          <!-- ACCOUNT -->
          <div v-show="activeSection === 'account'">
            <h2 class="text-xl font-bold mb-6">Account</h2>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Email Address</label>
              <input
                type="email"
                v-model="email"
                class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Change Password</label>
              <div class="space-y-3">
                <input
                  type="password"
                  v-model="currentPassword"
                  placeholder="Current password"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
                <input
                  type="password"
                  v-model="newPassword"
                  placeholder="New password"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
                <input
                  type="password"
                  v-model="confirmPassword"
                  placeholder="Confirm new password"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
                />
              </div>
            </div>

            <button
              @click="saveAccount"
              :disabled="saving"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <!-- NOTIFICATIONS -->
          <div v-show="activeSection === 'notifications'">
            <h2 class="text-xl font-bold mb-6">Notifications</h2>

            <div class="space-y-1">
              <div
                v-for="setting in notificationSettings"
                :key="setting.id"
                class="flex items-center justify-between p-4 rounded-lg transition-colors"
                :class="isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'"
              >
                <div class="flex-1 mr-4">
                  <p class="font-medium text-sm">{{ setting.label }}</p>
                  <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ setting.description }}</p>
                </div>
                <button
                  @click="setting.enabled = !setting.enabled"
                  class="relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0"
                  :class="setting.enabled ? 'bg-purple-accent' : isDark ? 'bg-gray-600' : 'bg-gray-300'"
                >
                  <span
                    class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    :class="setting.enabled ? 'translate-x-6' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>

            <button
              @click="saveNotifications"
              :disabled="saving"
              class="mt-6 px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Notification Settings' }}
            </button>
          </div>

          <!-- PRIVACY -->
          <div v-show="activeSection === 'privacy'">
            <h2 class="text-xl font-bold mb-6">Privacy</h2>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Who can view my profile</label>
                <select
                  v-model="profileVisibility"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
                >
                  <option v-for="opt in visibilityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Show online status</label>
                <select
                  v-model="onlineStatus"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
                >
                  <option v-for="opt in visibilityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Show post history</label>
                <select
                  v-model="postHistory"
                  class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                  :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
                >
                  <option v-for="opt in visibilityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="hideFromSearch"
                  class="w-4 h-4 rounded border-gray-400 text-purple-accent focus:ring-purple-accent"
                />
                <span class="text-sm">Hide my profile from search engines</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="allowDMs"
                  class="w-4 h-4 rounded border-gray-400 text-purple-accent focus:ring-purple-accent"
                />
                <span class="text-sm">Allow other members to DM me</span>
              </label>
            </div>

            <button
              @click="savePrivacy"
              :disabled="saving"
              class="mt-6 px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Privacy Settings' }}
            </button>
          </div>

          <!-- COSMETICS -->
          <div v-show="activeSection === 'cosmetics'">
            <h2 class="text-xl font-bold mb-6">Cosmetics</h2>

            <h3 class="text-sm font-semibold uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Active Cosmetics</h3>

            <div v-if="ownedCosmetics.length" class="space-y-3 mb-8">
              <div
                v-for="cosmetic in ownedCosmetics"
                :key="cosmetic.id"
                class="flex items-center justify-between p-4 rounded-lg border"
                :class="isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ cosmetic.icon }}</span>
                  <div>
                    <p class="font-medium text-sm">{{ cosmetic.name }}</p>
                  </div>
                </div>
                <button
                  @click="handleToggleCosmetic(cosmetic)"
                  class="relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0"
                  :class="cosmetic.active ? 'bg-purple-accent' : isDark ? 'bg-gray-600' : 'bg-gray-300'"
                >
                  <span
                    class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    :class="cosmetic.active ? 'translate-x-6' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
            <div v-else class="mb-8 text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              No cosmetics owned yet.
            </div>

            <router-link
              to="/store"
              class="inline-flex items-center gap-2 text-sm font-medium text-purple-accent hover:underline"
            >
              Get more in the Store &#8594;
            </router-link>
          </div>

          <!-- SESSIONS -->
          <div v-show="activeSection === 'sessions'">
            <h2 class="text-xl font-bold mb-6">Active Sessions</h2>

            <div class="space-y-3">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="flex items-center justify-between p-4 rounded-lg border"
                :class="isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'"
              >
                <div class="flex items-center gap-3">
                  <i :class="session.current ? 'fa-solid fa-laptop' : 'fa-solid fa-desktop'" class="text-xl"></i>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-sm">{{ session.browser || session.device }}</p>
                      <span
                        v-if="session.current"
                        class="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold"
                      >
                        Current
                      </span>
                    </div>
                    <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                      {{ session.location }} · {{ session.last_active }}
                    </p>
                  </div>
                </div>
                <button
                  v-if="!session.current"
                  @click="handleRemoveSession(session.id)"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  Log out
                </button>
              </div>
            </div>

            <div v-if="!sessions.length" class="text-center py-8" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              No active sessions found.
            </div>
          </div>

          <!-- COVER PHOTO -->
          <div v-show="activeSection === 'cover'">
            <h2 class="text-xl font-bold mb-6">Profile Cover</h2>

            <div class="mb-6">
              <div
                class="w-full h-48 rounded-lg overflow-hidden border flex items-center justify-center mb-4"
                :class="isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'"
              >
                <img
                  v-if="coverPreview"
                  :src="coverPreview"
                  class="w-full h-full object-cover"
                />
                <img
                  v-else-if="authStore.user?.cover_url"
                  :src="authStore.user.cover_url"
                  class="w-full h-full object-cover"
                />
                <i v-else class="fa-solid fa-image text-4xl" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
              </div>

              <div class="flex items-center gap-3">
                <input
                  ref="coverFileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  @change="handleCoverSelect"
                />
                <button
                  v-if="coverFile"
                  @click="handleCoverUpload"
                  :disabled="coverUploading"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg v-if="coverUploading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ coverUploading ? 'Uploading...' : 'Upload' }}
                </button>
                <template v-else>
                  <button
                    @click="coverFileInput?.click()"
                    class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-upload mr-1.5"></i> Choose Image
                  </button>
                  <button
                    v-if="authStore.user?.cover_url"
                    @click="handleCoverRemove"
                    :disabled="coverRemoving"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                  >
                    {{ coverRemoving ? 'Removing...' : 'Remove' }}
                  </button>
                </template>
              </div>
              <p class="text-xs mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                JPG, PNG, GIF, WebP &mdash; max 5MB<br>
                Recommended: <strong>1500×500 px</strong>. Auto-resized and converted to WebP.
              </p>
            </div>

            <!-- Overlay opacity -->
            <div class="mt-6 pt-6 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                Cover Overlay Opacity
              </label>
              <p class="text-xs mb-3" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                A dark tint over your cover photo. 0 = none, 80 = darkest.
              </p>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  min="0" max="80" step="5"
                  v-model.number="coverOverlayOpacity"
                  class="flex-1 accent-purple-600"
                />
                <span class="text-sm font-mono w-10 text-center" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ coverOverlayOpacity }}%</span>
                <button
                  @click="handleOverlaySave"
                  :disabled="coverOverlaySaving"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {{ coverOverlaySaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </div>

          <!-- POSTBIT BACKGROUND -->
          <div v-show="activeSection === 'postbit'">
            <h2 class="text-xl font-bold mb-6">Postbit Background</h2>
            <div class="flex items-start gap-5">
              <div
                class="w-32 h-20 rounded-lg overflow-hidden border flex items-center justify-center shrink-0"
                :class="isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'"
              >
                <img v-if="postbitBgPreview" :src="postbitBgPreview" class="w-full h-full object-cover" />
                <img v-else-if="currentPostbitBg" :src="currentPostbitBg" class="w-full h-full object-cover" />
                <i v-else class="fa-solid fa-image text-xl" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
              </div>
              <div class="flex flex-col gap-2">
                <input ref="postbitBgFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="handlePostbitBgSelect" />
                <button v-if="postbitBgFile" @click="handlePostbitBgUpload" :disabled="postbitBgUploading"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <svg v-if="postbitBgUploading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ postbitBgUploading ? 'Uploading...' : 'Upload' }}
                </button>
                <template v-else>
                  <button @click="postbitBgFileInput?.click()"
                    class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                    <i class="fa-solid fa-upload mr-1.5"></i> Choose Image
                  </button>
                  <button v-if="currentPostbitBg" @click="handlePostbitBgRemove" :disabled="postbitBgRemoving"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50">
                    {{ postbitBgRemoving ? 'Removing...' : 'Remove' }}
                  </button>
                </template>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">GIF, PNG, JPG, WebP &mdash; max 5MB<br>Recommended: <strong>1000×250 px</strong>. Auto-resized and converted to WebP.</p>
              </div>
            </div>
          </div>

          <!-- CUSTOM CSS -->
          <div v-show="activeSection === 'customcss'">
            <h2 class="text-xl font-bold mb-6">Custom CSS</h2>

            <p class="text-sm mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              Custom CSS is applied to your profile page only. Malicious CSS may be removed by staff.
            </p>

            <textarea
              v-model="customCss"
              rows="15"
              placeholder="/* Your custom CSS here */"
              class="w-full px-4 py-3 rounded-lg border font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-y"
              :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
            />
            <p class="text-xs mt-1 mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ customCss.length }}/5000 characters</p>

            <button
              @click="handleSaveCustomCss"
              :disabled="saving"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Custom CSS' }}
            </button>
          </div>

          <!-- USERNAME COLOR -->
          <div v-show="activeSection === 'username-color'">
            <h2 class="text-xl font-bold mb-6">Username Color</h2>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Pick a color</label>
              <div class="flex items-center gap-4">
                <input
                  type="color"
                  v-model="usernameColor"
                  class="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <span class="font-bold text-lg" :style="{ color: usernameColor }">{{ authStore.username }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="handleSaveUsernameColor"
                :disabled="saving"
                class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ saving ? 'Saving...' : 'Save Color' }}
              </button>
              <button
                @click="handleResetUsernameColor"
                :disabled="saving"
                class="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- USERBAR HUE -->
          <div v-show="activeSection === 'userbar-hue'">
            <h2 class="text-xl font-bold mb-6">Userbar Hue</h2>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Hue Rotation ({{ userbarHue }}&deg;)</label>
              <input
                type="range"
                v-model.number="userbarHue"
                min="0"
                max="360"
                class="w-full accent-purple-500"
              />
              <div class="mt-4 flex items-center gap-3">
                <span class="text-sm font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Preview:</span>
                <span
                  class="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-accent/20 text-purple-accent border border-purple-accent/40"
                  :style="{ filter: `hue-rotate(${userbarHue}deg)` }"
                >
                  {{ authStore.username }}
                </span>
              </div>
            </div>

            <button
              @click="handleSaveUserbarHue"
              :disabled="saving"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Hue' }}
            </button>
          </div>

          <!-- CHANGE USERNAME -->
          <div v-show="activeSection === 'change-username'">
            <h2 class="text-xl font-bold mb-6">Change Username</h2>

            <div v-if="!canChangeUsername" class="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              You can change your username again after {{ nextUsernameDate?.toLocaleDateString() }}.
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">New Username</label>
              <input
                type="text"
                v-model="newUsername"
                placeholder="Enter new username..."
                :disabled="!canChangeUsername"
                class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                :class="[
                  isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
                  !canChangeUsername ? 'opacity-50 cursor-not-allowed' : ''
                ]"
              />
              <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">3-30 characters, alphanumeric only. Can change once every 30 days.</p>
            </div>

            <button
              @click="handleChangeUsername"
              :disabled="saving || !canChangeUsername || !newUsername"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Change Username' }}
            </button>
          </div>

          <!-- AWARDS ORDER -->
          <div v-show="activeSection === 'awards-order'">
            <h2 class="text-xl font-bold mb-6">Awards Order</h2>

            <div v-if="userAwards.length" class="space-y-2 mb-6">
              <div
                v-for="(award, index) in userAwards"
                :key="award.id"
                class="flex items-center gap-3 p-3 rounded-lg border cursor-move"
                :class="isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'"
              >
                <i class="fa-solid fa-grip-vertical text-sm" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
                <img
                  v-if="award.award?.icon_url"
                  :src="award.award.icon_url"
                  class="w-8 h-8 object-contain"
                />
                <div v-else class="w-8 h-8 rounded flex items-center justify-center bg-yellow-500/10">
                  <i class="fa-solid fa-award text-yellow-500"></i>
                </div>
                <span class="font-medium text-sm">{{ award.award?.name || 'Award' }}</span>
                <div class="ml-auto flex gap-1">
                  <button
                    v-if="index > 0"
                    @click="userAwards.splice(index - 1, 0, userAwards.splice(index, 1)[0])"
                    class="px-2 py-1 rounded text-xs"
                    :class="isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'"
                  >
                    <i class="fa-solid fa-arrow-up"></i>
                  </button>
                  <button
                    v-if="index < userAwards.length - 1"
                    @click="userAwards.splice(index + 1, 0, userAwards.splice(index, 1)[0])"
                    class="px-2 py-1 rounded text-xs"
                    :class="isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'"
                  >
                    <i class="fa-solid fa-arrow-down"></i>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="mb-6 text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              No awards to reorder.
            </div>

            <button
              v-if="userAwards.length"
              @click="handleSaveAwardsOrder"
              :disabled="saving"
              class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

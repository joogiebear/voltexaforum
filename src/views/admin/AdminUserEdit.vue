<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getAdminUser, updateAdminUser, adjustUserCredits,
  banUser as banUserApi, unbanUser,
  grantAward as grantAwardApi, revokeAward as revokeAwardApi,
  getAdminAwards,
} from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const route = useRoute()
const toast = useToastStore()
const userId = computed(() => route.params.id)

const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const user = ref(null)

const form = ref({
  role: 'member',
  userTitle: '',
  status: 'active',
  banReason: '',
  banDuration: '1day',
})

const creditsAmount = ref(0)
const creditsReason = ref('')
const grantAwardId = ref('')
const allAwards = ref([])
const userAwardsList = ref([])
const showDeleteConfirm = ref(false)

const availableAwards = computed(() => {
  const grantedIds = userAwardsList.value.map(a => a.award_id)
  return allAwards.value.filter(a => !grantedIds.includes(a.id))
})

function applyUser(d) {
  // Backend returns { data: { user: {...}, recent_posts: [...] } }
  const u = d?.user || d
  const isBanned = u.roles?.some(r => r.name === 'banned') ?? false
  const primaryRole = u.roles?.find(r => r.name !== 'banned')?.name || 'member'
  user.value = { ...u, role: primaryRole, is_banned: isBanned }
  form.value.role = primaryRole
  form.value.userTitle = u.user_title || ''
  form.value.status = isBanned ? 'banned' : 'active'
  userAwardsList.value = (u.user_awards || u.userAwards || []).map(ua => ({
    id: ua.id,
    award_id: ua.award_id,
    name: ua.award?.name || '',
    icon: ua.award?.icon || '⭐',
    icon_url: ua.award?.icon_url || null,
  }))
}

async function fetchUser() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminUser(userId.value)
    applyUser(res.data.data)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load user'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function fetchAwards() {
  try {
    const res = await getAdminAwards()
    allAwards.value = res.data.data || res.data || []
  } catch {}
}

async function saveSettings() {
  saving.value = true
  try {
    await updateAdminUser(userId.value, { role: form.value.role, user_title: form.value.userTitle })
    toast.show('User settings saved')
    const res = await getAdminUser(userId.value)
    applyUser(res.data.data)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}

async function addCredits() {
  if (!creditsAmount.value) return
  try {
    await adjustUserCredits(userId.value, { amount: Math.abs(creditsAmount.value), reason: creditsReason.value })
    toast.show('Credits added')
    creditsAmount.value = 0
    creditsReason.value = ''
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to adjust credits', 'error')
  }
}

async function removeCredits() {
  if (!creditsAmount.value) return
  try {
    await adjustUserCredits(userId.value, { amount: -Math.abs(creditsAmount.value), reason: creditsReason.value })
    toast.show('Credits removed')
    creditsAmount.value = 0
    creditsReason.value = ''
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to adjust credits', 'error')
  }
}

async function doBan() {
  try {
    await banUserApi(userId.value, { reason: form.value.banReason, duration: form.value.banDuration })
    toast.show('User banned')
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to ban user', 'error')
  }
}

async function doUnban() {
  try {
    await unbanUser(userId.value)
    toast.show('User unbanned')
    form.value.status = 'active'
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to unban user', 'error')
  }
}

async function doGrantAward() {
  if (!grantAwardId.value) return
  try {
    await grantAwardApi(userId.value, { award_id: grantAwardId.value })
    toast.show('Award granted')
    grantAwardId.value = ''
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to grant award', 'error')
  }
}

async function doRevokeAward(awardId) {
  try {
    await revokeAwardApi(userId.value, awardId)
    toast.show('Award revoked')
    fetchUser()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to revoke award', 'error')
  }
}

function groupColor(group) {
  const colors = {
    member: 'bg-gray-500/20 text-gray-300',
    vip: 'bg-violet-500/20 text-violet-400',
    elite: 'bg-amber-500/20 text-amber-400',
    moderator: 'bg-green-500/20 text-green-400',
    admin: 'bg-red-500/20 text-red-400',
  }
  return colors[group] || colors.member
}

onMounted(() => {
  fetchUser()
  fetchAwards()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm">
      <router-link to="/admin/dashboard" class="text-gray-500 hover:text-gray-300 transition-colors">Admin</router-link>
      <span class="text-gray-600">/</span>
      <router-link to="/admin/users" class="text-gray-500 hover:text-gray-300 transition-colors">Users</router-link>
      <span class="text-gray-600">/</span>
      <span class="text-gray-300">{{ user?.username || 'Loading...' }}</span>
    </nav>

    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchUser" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-16 h-16 bg-gray-700 rounded-full"></div>
          <div class="h-5 bg-gray-700 rounded w-32"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
          <div class="h-5 bg-gray-700 rounded w-40"></div>
          <div class="h-10 bg-gray-700 rounded"></div>
          <div class="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: User info card -->
      <div class="lg:col-span-1">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-4">
          <div class="flex flex-col items-center text-center">
            <UserAvatar :name="user.username" :color="user.avatar_color || user.avatarColor || 'bg-violet-500'" :online="user.is_online" size="xl" />
            <h2 class="text-lg font-bold text-white mt-3">{{ user.username }}</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium mt-1" :class="groupColor(user.role || user.usergroup)">
              {{ user.role || user.usergroup || 'member' }}
            </span>
            <p class="text-sm text-gray-400 mt-1">{{ user.user_title || user.userTitle }}</p>
          </div>
          <div class="border-t border-gray-700/50 pt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Email</span>
              <span class="text-gray-300">{{ user.email }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Joined</span>
              <span class="text-gray-300">{{ user.created_at || user.joinDate }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Posts</span>
              <span class="text-gray-300">{{ (user.post_count || user.postCount || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Credits</span>
              <span class="text-violet-400 font-medium"><i class="fa-solid fa-coins mr-1"></i>{{ (user.credits || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Status</span>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="user.is_banned ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'"
              >
                {{ user.is_banned ? 'Banned' : 'Active' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Edit form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic settings -->
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
          <h3 class="text-base font-semibold text-white">Account Settings</h3>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Role</label>
            <select v-model="form.role" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="member">Member</option>
              <option value="vip">VIP</option>
              <option value="elite">Elite</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">User Title</label>
            <input v-model="form.userTitle" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Adjust Credits</label>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-lg font-bold text-violet-400"><i class="fa-solid fa-coins mr-1"></i>{{ (user.credits || 0).toLocaleString() }}</span>
              <input v-model.number="creditsAmount" type="number" min="0" placeholder="Amount" class="w-24 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="creditsReason" type="text" placeholder="Reason" class="flex-1 min-w-[120px] px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <button @click="addCredits" class="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors border border-green-500/20">+ Add</button>
              <button @click="removeCredits" class="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">- Remove</button>
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="saveSettings" :disabled="saving" class="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- Ban settings -->
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
          <h3 class="text-base font-semibold text-white">Account Status</h3>
          <div v-if="user.is_banned" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
            <p class="text-sm text-red-400">This user is currently banned.</p>
            <p v-if="user.ban_reason" class="text-xs text-gray-400">Reason: {{ user.ban_reason }}</p>
            <button @click="doUnban" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">Unban User</button>
          </div>
          <div v-else class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Ban Reason</label>
              <textarea v-model="form.banReason" rows="3" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none" placeholder="Enter reason for ban..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Ban Duration</label>
              <select v-model="form.banDuration" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
                <option value="1day">1 Day</option>
                <option value="1week">1 Week</option>
                <option value="1month">1 Month</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <button @click="doBan" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Ban User</button>
          </div>
        </div>

        <!-- Awards -->
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-4">
          <h3 class="text-base font-semibold text-white">Awards</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="award in userAwardsList"
              :key="award.id"
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg"
            >
              <img v-if="award.icon_url" :src="award.icon_url" class="w-5 h-5 object-contain" />
              <span v-else>{{ award.icon || '⭐' }}</span>
              <span class="text-sm text-gray-300">{{ award.name }}</span>
              <button @click="doRevokeAward(award.id)" class="text-gray-500 hover:text-red-400 transition-colors ml-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div v-if="!userAwardsList.length" class="text-sm text-gray-500">No awards granted</div>
          </div>
          <div class="flex items-center gap-2">
            <select v-model="grantAwardId" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="">Select award...</option>
              <option v-for="a in availableAwards" :key="a.id" :value="a.id">{{ a.icon }} {{ a.name }}</option>
            </select>
            <button @click="doGrantAward" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">Grant Award</button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-gray-800 rounded-xl border border-red-500/30 p-6 space-y-4">
          <h3 class="text-base font-semibold text-red-400">Danger Zone</h3>
          <p class="text-sm text-gray-400">Permanently delete this user account and all associated data. This action cannot be undone.</p>
          <button
            v-if="!showDeleteConfirm"
            @click="showDeleteConfirm = true"
            class="px-4 py-2 border border-red-500/50 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Delete Account
          </button>
          <div v-else class="flex items-center gap-3">
            <span class="text-sm text-red-400">Are you sure?</span>
            <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Confirm Delete</button>
            <button @click="showDeleteConfirm = false" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- User not found -->
    <div v-else-if="!loading" class="bg-gray-800 rounded-xl border border-gray-700/50 p-12 text-center">
      <p class="text-gray-400">User not found.</p>
      <router-link to="/admin/users" class="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">Back to Users</router-link>
    </div>
  </div>
</template>

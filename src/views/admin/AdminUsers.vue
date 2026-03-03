<script setup>
import { ref, watch, onMounted } from 'vue'
import { getAdminUsers, banUser as banUserApi, unbanUser } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = 15
const totalPages = ref(1)
const totalUsers = ref(0)
const userList = ref([])

let searchTimer = null

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const params = { page: currentPage.value, per_page: perPage }
    if (search.value) params.search = search.value
    if (roleFilter.value !== 'all') params.role = roleFilter.value
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    const res = await getAdminUsers(params)
    const d = res.data
    userList.value = d.data || []
    totalPages.value = d.meta?.last_page || d.last_page || 1
    totalUsers.value = d.meta?.total || d.total || userList.value.length
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 400)
}

watch(roleFilter, () => { currentPage.value = 1; fetchUsers() })
watch(statusFilter, () => { currentPage.value = 1; fetchUsers() })

function goToPage(page) {
  currentPage.value = page
  fetchUsers()
}

const banModal = ref(null)
const banReason = ref('')
const banDuration = ref('1day')

async function doBan() {
  if (!banModal.value) return
  try {
    await banUserApi(banModal.value.id, { reason: banReason.value, duration: banDuration.value })
    toast.show('User banned successfully')
    banModal.value = null
    banReason.value = ''
    fetchUsers()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to ban user', 'error')
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

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-6">
    <!-- Error banner -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchUsers" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Top bar: Search + Filters -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
        <div class="relative flex-1 sm:max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Search users..."
            class="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <select
          v-model="roleFilter"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="member">Member</option>
          <option value="vip">VIP</option>
          <option value="elite">Elite</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">User</th>
              <th class="px-5 py-3">Email</th>
              <th class="px-5 py-3">Role</th>
              <th class="px-5 py-3">Posts</th>
              <th class="px-5 py-3">Credits</th>
              <th class="px-5 py-3">Joined</th>
              <th class="px-5 py-3">Last Active</th>
              <th class="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gray-700"></div><div class="h-4 bg-gray-700 rounded w-24"></div></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-32"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-10"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-14"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="user in userList" :key="user.id" class="hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <UserAvatar :name="user.username" :color="user.avatar_color || 'bg-violet-500'" :avatar-url="user.avatar_url" :online="user.is_online" size="sm" />
                    <span class="font-medium text-gray-200">{{ user.username }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-400">{{ user.email }}</td>
                <td class="px-5 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="groupColor(user.role || user.usergroup)">
                    {{ (user.role || user.usergroup || 'member') }}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-400">{{ (user.post_count || user.postCount || 0).toLocaleString() }}</td>
                <td class="px-5 py-3 text-gray-400"><i class="fa-solid fa-coins mr-1"></i>{{ (user.credits || 0).toLocaleString() }}</td>
                <td class="px-5 py-3 text-gray-400">{{ user.created_at || user.joinDate }}</td>
                <td class="px-5 py-3 text-gray-400">{{ user.last_active || user.lastActive }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <router-link
                      :to="`/admin/users/${user.id}`"
                      class="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition-colors"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </router-link>
                    <button
                      @click="banModal = user"
                      class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      title="Ban"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <router-link
                      :to="`/profile/${user.username}`"
                      class="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition-colors"
                      title="View Profile"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </router-link>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-700/50">
        <span class="text-sm text-gray-500">
          Showing {{ (currentPage - 1) * perPage + 1 }}-{{ Math.min(currentPage * perPage, totalUsers) }} of {{ totalUsers }}
        </span>
        <div class="flex gap-1">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            :class="page === currentPage ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-700'"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Ban modal -->
    <Teleport to="body">
      <div v-if="banModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="banModal = null">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-md p-6 space-y-4">
          <h3 class="text-base font-semibold text-white">Ban {{ banModal.username }}</h3>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Reason</label>
            <textarea v-model="banReason" rows="3" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none" placeholder="Reason for ban..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Duration</label>
            <select v-model="banDuration" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="1day">1 Day</option>
              <option value="1week">1 Week</option>
              <option value="1month">1 Month</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>
          <div class="flex gap-2 justify-end">
            <button @click="banModal = null" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            <button @click="doBan" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Ban User</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

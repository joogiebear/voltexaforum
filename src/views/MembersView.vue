<script setup>
import { ref, inject, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getMembers } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { useForumStore } from '../stores/forum'
import { useAuthStore } from '../stores/auth'

const isDark = inject('isDark', ref(true))
const router = useRouter()
const forumStore = useForumStore()
const authStore = useAuthStore()

const members = ref([])
const meta = ref({ total: 0, current_page: 1, last_page: 1 })
const loading = ref(true)
const search = ref('')
const sort = ref('joined')
const page = ref(1)

const sortOptions = [
  { value: 'joined',   label: 'Newest' },
  { value: 'posts',    label: 'Most Posts' },
  { value: 'credits',  label: 'Most Credits' },
  { value: 'username', label: 'A–Z' },
]

async function load() {
  loading.value = true
  try {
    const res = await getMembers({ q: search.value, sort: sort.value, page: page.value, per_page: 24 })
    members.value = res.data.data.data || res.data.data
    meta.value = res.data.meta || {}
  } finally {
    loading.value = false
  }
}

function groupColor(role) {
  return forumStore.config?.[`group_color_${role}`] || '#6b7280'
}

function groupLabel(role) {
  return forumStore.config?.[`group_label_${role}`] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : '')
}

let searchTimer
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 350)
}

watch(sort, () => { page.value = 1; load() })
onMounted(load)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
          <i class="fa-solid fa-users text-purple-accent mr-2"></i>Members
        </h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ meta.total?.toLocaleString() || '—' }} registered members
        </p>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Search members..."
            class="pl-9 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-accent w-48"
            :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800'"
          />
        </div>
        <select
          v-model="sort"
          class="px-3 py-2 text-sm rounded-lg border focus:outline-none cursor-pointer"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="i in 24" :key="i"
        class="flex items-center gap-3 p-4 rounded-xl animate-pulse"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div class="w-10 h-10 rounded-full shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'"></div>
          <div class="h-3 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'"></div>
        </div>
      </div>
    </div>

    <!-- Member cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="member in members"
        :key="member.id"
        @click="router.push(`/profile/${member.username}`)"
        class="flex items-center gap-3 p-4 rounded-xl text-left transition-colors group"
        :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:shadow-md'"
      >
        <!-- Avatar -->
        <div class="shrink-0">
          <UserAvatar
            :name="member.username"
            :color="member.avatar_color || 'bg-purple-500'"
            :avatar-url="member.avatar_url"
            :online="member.is_online"
            size="md"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div
            class="text-sm font-semibold truncate leading-tight group-hover:text-purple-accent transition-colors"
            :class="isDark ? 'text-gray-100' : 'text-gray-900'"
            :style="member.primary_role ? { color: groupColor(member.primary_role) } : {}"
          >
            {{ member.username }}
          </div>
          <div
            class="text-xs truncate mt-0.5 leading-tight"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
            :style="member.primary_role ? { color: groupColor(member.primary_role) + '99' } : {}"
          >
            {{ member.custom_title || groupLabel(member.primary_role) || 'Member' }}
          </div>
        </div>
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!loading && !members.length" class="text-center py-16" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
      <i class="fa-solid fa-users text-4xl mb-3 block opacity-30"></i>
      No members found.
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <button
        v-for="p in meta.last_page"
        :key="p"
        @click="page = p; load()"
        class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
        :class="p === meta.current_page
          ? 'bg-purple-accent text-white'
          : (isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm')"
      >{{ p }}</button>
    </div>
  </div>
</template>

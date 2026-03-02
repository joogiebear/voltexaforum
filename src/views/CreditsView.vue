<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getUserCredits, getCreditsEarningInfo } from '../services/api'

const isDark = inject('isDark')
const authStore = useAuthStore()

const creditsLog = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const perPage = 10

const earningInfo = ref(null)
const earningLoading = ref(true)

async function fetchCredits() {
  loading.value = true
  error.value = null
  try {
    const res = await getUserCredits()
    creditsLog.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load credits history. Please try again.'
  } finally {
    loading.value = false
  }
}

async function fetchEarningInfo() {
  earningLoading.value = true
  try {
    const res = await getCreditsEarningInfo()
    earningInfo.value = res.data.data || res.data
  } catch {
    earningInfo.value = null
  } finally {
    earningLoading.value = false
  }
}

const roleMultipliers = computed(() => {
  if (!earningInfo.value?.role_multipliers) return []
  return Object.entries(earningInfo.value.role_multipliers)
    .filter(([, v]) => v !== 1.0)
    .map(([role, multiplier]) => ({ role, multiplier }))
})

onMounted(() => {
  fetchCredits()
  fetchEarningInfo()
})

const totalEarned = computed(() => creditsLog.value.filter(c => c.type === 'earn').reduce((sum, c) => sum + c.amount, 0))
const totalSpent = computed(() => creditsLog.value.filter(c => c.type === 'spend').reduce((sum, c) => sum + c.amount, 0))

const totalPages = computed(() => Math.ceil(creditsLog.value.length / perPage))
const paginatedLog = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return creditsLog.value.slice(start, start + perPage)
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-8 rounded w-1/4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="h-10 rounded w-24 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <div class="h-8 rounded w-1/2 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="fetchCredits"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 class="text-2xl font-bold">Credits History</h1>
        <div
          class="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xl"
          :class="isDark ? 'bg-gray-900 text-purple-accent' : 'bg-white text-purple-accent shadow-sm'"
        >
          <span>&#9889;</span>
          <span>{{ authStore.credits.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          class="rounded-xl p-5 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-2xl font-bold text-green-400">+{{ totalEarned.toLocaleString() }}</div>
          <div class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Total Earned</div>
        </div>
        <div
          class="rounded-xl p-5 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-2xl font-bold text-red-400">-{{ totalSpent.toLocaleString() }}</div>
          <div class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Total Spent</div>
        </div>
        <div
          class="rounded-xl p-5 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-2xl font-bold text-purple-accent">&#9889; {{ authStore.credits.toLocaleString() }}</div>
          <div class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Current Balance</div>
        </div>
      </div>

      <!-- Earning Guide -->
      <div v-if="earningLoading" class="mb-8">
        <div class="h-6 rounded w-48 mb-4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
            <div class="h-10 rounded w-2/3 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>

      <div v-else-if="earningInfo?.ways_to_earn?.length" class="mb-8">
        <h2 class="text-lg font-bold mb-4">How to Earn Credits</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="way in earningInfo.ways_to_earn"
            :key="way.action"
            class="rounded-xl p-5 flex items-center gap-4 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :class="isDark ? 'bg-purple-accent/15' : 'bg-purple-100'"
            >
              <i :class="way.icon" class="text-purple-accent"></i>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ way.action }}</div>
              <div class="text-sm font-bold text-green-400">+{{ way.credits }} credits</div>
            </div>
          </div>
        </div>

        <!-- Role Bonuses -->
        <div v-if="roleMultipliers.length" class="mt-6">
          <h3 class="text-base font-semibold mb-3">Role Bonuses</h3>
          <div
            class="rounded-xl overflow-hidden"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <div
              v-for="(rm, idx) in roleMultipliers"
              :key="rm.role"
              class="flex items-center justify-between px-5 py-3"
              :class="idx < roleMultipliers.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''"
            >
              <span class="text-sm font-medium capitalize">{{ rm.role }}</span>
              <span class="text-sm font-bold text-purple-accent">{{ rm.multiplier }}x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction list -->
      <div
        class="rounded-xl overflow-hidden transition-colors duration-300"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div
          class="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
        >
          <span class="w-8"></span>
          <span>Reason</span>
          <span class="text-right w-24">Amount</span>
          <span class="text-right w-44">Date</span>
        </div>

        <div
          v-for="(entry, idx) in paginatedLog"
          :key="entry.id"
          class="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-4"
          :class="idx < paginatedLog.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            :class="entry.type === 'earn'
              ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400'"
          >
            {{ entry.type === 'earn' ? '+' : '-' }}
          </div>
          <div class="text-sm min-w-0 truncate">{{ entry.reason }}</div>
          <div
            class="text-sm font-semibold text-right w-24"
            :class="entry.type === 'earn' ? 'text-green-400' : 'text-red-400'"
          >
            {{ entry.type === 'earn' ? '+' : '-' }}{{ entry.amount.toLocaleString() }}
          </div>
          <div class="text-xs text-right w-44" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            {{ formatDate(entry.created_at) }}
          </div>
        </div>

        <div v-if="!paginatedLog.length" class="p-8 text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          No credit history yet.
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="currentPage = page"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="currentPage === page
            ? 'bg-purple-accent text-white'
            : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          {{ page }}
        </button>
      </div>
    </template>
  </div>
</template>

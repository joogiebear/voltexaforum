<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getAchievements, getUserAchievements } from '../services/api'

const isDark = inject('isDark')
const authStore = useAuthStore()

const achievements = ref([])
const userAchievements = ref([])
const loading = ref(true)
const error = ref(null)
const activeCategory = ref('all')

async function fetchAchievements() {
  loading.value = true
  error.value = null
  try {
    const promises = [getAchievements()]
    if (authStore.isLoggedIn) {
      promises.push(getUserAchievements())
    }
    const results = await Promise.all(promises)
    achievements.value = results[0].data.data
    if (results[1]) {
      userAchievements.value = results[1].data.data
    }
  } catch (e) {
    error.value = 'Failed to load achievements. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAchievements)

const unlockedIds = computed(() => new Set(userAchievements.value.filter(a => a.unlocked_at).map(a => a.achievement_id)))

const categories = computed(() => {
  const cats = new Set(achievements.value.map(a => a.category))
  const tabs = [{ id: 'all', label: 'All' }]
  for (const cat of cats) {
    tabs.push({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })
  }
  return tabs
})

const filteredAchievements = computed(() => {
  if (activeCategory.value === 'all') return achievements.value
  return achievements.value.filter(a => a.category === activeCategory.value)
})

const unlockedCount = computed(() => userAchievements.value.filter(a => a.unlocked_at).length)
const totalCreditsEarned = computed(() => {
  return userAchievements.value.reduce((sum, a) => sum + (a.credits_earned || 0), 0)
})

function getUnlockDate(achId) {
  const entry = userAchievements.value.find(a => a.achievement_id === achId)
  if (!entry) return null
  return new Date(entry.unlocked_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function getProgress(ach) {
  const entry = userAchievements.value.find(a => a.achievement_id === ach.id)
  return entry?.progress ?? 0
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 rounded w-1/4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in 2" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <div class="h-8 rounded w-1/3 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="rounded-xl p-5 animate-pulse border" :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'">
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="flex-1 space-y-2">
              <div class="h-4 rounded w-1/2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
              <div class="h-3 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="fetchAchievements"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold">Achievements</h1>
        <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Track your forum progress
        </p>
      </div>

      <!-- Stats summary -->
      <div v-if="authStore.isLoggedIn" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div
          class="rounded-xl p-5 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-3xl font-bold text-purple-accent">{{ unlockedCount }}/{{ achievements.length }}</div>
          <div class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Achievements Unlocked</div>
        </div>
        <div
          class="rounded-xl p-5 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-3xl font-bold text-purple-accent"><i class="fa-solid fa-coins mr-1"></i>{{ totalCreditsEarned.toLocaleString() }}</div>
          <div class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Total Credits Earned</div>
        </div>
      </div>

      <!-- Category tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          class="px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
          :class="activeCategory === cat.id
            ? 'bg-purple-accent text-white'
            : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Achievement cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="ach in filteredAchievements"
          :key="ach.id"
          class="rounded-xl p-5 border transition-colors duration-300"
          :class="unlockedIds.has(ach.id)
            ? 'border-purple-accent/40 ' + (isDark ? 'bg-gray-900' : 'bg-white shadow-sm')
            : (isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50')"
        >
          <div class="flex items-start gap-4">
            <div class="relative shrink-0">
              <span
                class="text-3xl"
                :class="{ 'grayscale opacity-50': !unlockedIds.has(ach.id) }"
              >
                {{ ach.icon }}
              </span>
              <span
                v-if="unlockedIds.has(ach.id)"
                class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              >
                &#10003;
              </span>
              <span
                v-else
                class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                :class="isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'"
              >
                &#128274;
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm">{{ ach.name }}</h3>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ ach.description }}
              </p>
              <div v-if="unlockedIds.has(ach.id)" class="text-xs text-purple-accent mt-2">
                Unlocked {{ getUnlockDate(ach.id) }}
              </div>
              <template v-else-if="authStore.isLoggedIn">
                <div v-if="ach.type === 'count' && ach.target" class="mt-2">
                  <div class="flex items-center justify-between text-xs mb-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    <span>{{ getProgress(ach) }}/{{ ach.target }}</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'">
                    <div
                      class="h-full rounded-full bg-purple-accent transition-all"
                      :style="{ width: Math.min(100, (getProgress(ach) / ach.target) * 100) + '%' }"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

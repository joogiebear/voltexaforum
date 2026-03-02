<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useForumStore } from '../stores/forum'
import { getForums as fetchForumsApi } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const forumStore = useForumStore()

const selectedGame = ref('all')
const forums = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    await forumStore.fetchConfig()
    await forumStore.fetchGames()
    const res = await fetchForumsApi()
    forums.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load forums. Please try again.'
  } finally {
    loading.value = false
  }
})

const isMultiGame = computed(() => forumStore.isMultiGame)
const games = computed(() => forumStore.games)

// Group forums by game > category
const groupedForums = computed(() => {
  const groups = {}
  for (const forum of forums.value) {
    const gameKey = forum.game?.slug || forum.game_slug || 'default'
    const gameName = forum.game?.name || forum.game_name || ''
    const gameIcon = forum.game?.icon || forum.game_icon || ''
    const catName = forum.category?.name || forum.category_name || 'General'

    if (!groups[gameKey]) {
      groups[gameKey] = { name: gameName, icon: gameIcon, categories: {} }
    }
    if (!groups[gameKey].categories[catName]) {
      groups[gameKey].categories[catName] = []
    }
    groups[gameKey].categories[catName].push(forum)
  }
  return groups
})

const filteredGames = computed(() => {
  if (selectedGame.value === 'all') return Object.entries(groupedForums.value)
  return Object.entries(groupedForums.value).filter(([key]) => key === selectedGame.value)
})

const singleGameCategories = computed(() => {
  const first = Object.values(groupedForums.value)[0]
  return first ? Object.entries(first.categories) : []
})

const singleGameKey = computed(() => Object.keys(groupedForums.value)[0])
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="h-4 rounded w-1/4 mb-4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div v-for="j in 2" :key="j" class="flex items-center gap-4 py-4">
          <div class="w-10 h-10 rounded-lg" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loading = true; error = null; $router.go(0)"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col lg:flex-row gap-6">
      <!-- Sidebar (multi-game only) -->
      <aside v-if="isMultiGame" class="lg:w-56 shrink-0">
        <div
          class="rounded-xl p-4 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-3"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Games
          </h3>
          <ul class="space-y-1">
            <li>
              <button
                @click="selectedGame = 'all'"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="selectedGame === 'all'
                  ? 'bg-purple-accent/15 text-purple-accent'
                  : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
              >
                &#127918; All Games
              </button>
            </li>
            <li v-for="game in games" :key="game.id">
              <button
                @click="selectedGame = game.slug"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="selectedGame === game.slug
                  ? 'bg-purple-accent/15 text-purple-accent'
                  : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
              >
                {{ game.icon }} {{ game.name }}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0">
        <!-- Multi-game mode -->
        <template v-if="isMultiGame">
          <div v-for="[gameKey, game] in filteredGames" :key="gameKey" class="mb-8">
            <div class="flex items-center gap-2 mb-4">
              <span class="text-xl">{{ game.icon }}</span>
              <h2 class="text-lg font-bold uppercase tracking-wide">{{ game.name }}</h2>
            </div>

            <div v-for="(forums, catName) in game.categories" :key="catName" class="mb-4">
              <div
                class="rounded-xl overflow-hidden transition-colors duration-300"
                :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
              >
                <div
                  class="px-5 py-3 border-b border-l-4 border-l-purple-accent"
                  :class="isDark ? 'bg-gray-900 border-b-gray-800' : 'bg-gray-50 border-b-gray-200'"
                >
                  <h3 class="font-semibold text-sm uppercase tracking-wider"
                      :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                    {{ catName }}
                  </h3>
                </div>

                <div
                  v-for="(forum, idx) in forums"
                  :key="forum.id"
                  class="group"
                >
                  <router-link
                    :to="`/forum/${forum.slug}`"
                    class="flex items-center gap-4 px-5 py-4 transition-colors duration-150"
                    :class="[
                      isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
                      idx < forums.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
                    ]"
                  >
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
                    >
                      <i :class="forum.icon || 'fa-solid fa-comment'" class="text-purple-accent"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold group-hover:text-purple-accent transition-colors">
                        {{ forum.name }}
                      </div>
                      <div class="text-sm truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        {{ forum.description }}
                      </div>
                    </div>
                    <div class="hidden sm:flex items-center gap-8 shrink-0 text-sm"
                         :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      <div class="text-center w-16">
                        <div class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                          {{ (forum.threads_count ?? 0).toLocaleString() }}
                        </div>
                        <div class="text-xs">Threads</div>
                      </div>
                      <div class="text-center w-16">
                        <div class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                          {{ (forum.posts_count ?? 0).toLocaleString() }}
                        </div>
                        <div class="text-xs">Posts</div>
                      </div>
                    </div>
                    <div v-if="forum.last_post" class="hidden md:flex items-center gap-3 shrink-0 w-52">
                      <UserAvatar :name="forum.last_post.user?.username" :color="forum.last_post.user?.avatar_color || 'bg-purple-500'" :online="false" size="sm" />
                      <div class="min-w-0">
                        <div class="text-sm font-medium truncate" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                          {{ forum.last_post.user?.username }}
                        </div>
                        <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                          {{ forum.last_post.time_ago }}
                        </div>
                      </div>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Single-game mode -->
        <template v-else>
          <div v-for="[catName, catForums] in singleGameCategories" :key="catName" class="mb-4">
            <div
              class="rounded-xl overflow-hidden transition-colors duration-300"
              :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
            >
              <div
                class="px-5 py-3 border-b border-l-4 border-l-purple-accent"
                :class="isDark ? 'bg-gray-900 border-b-gray-800' : 'bg-gray-50 border-b-gray-200'"
              >
                <h3 class="font-semibold text-sm uppercase tracking-wider"
                    :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  {{ catName }}
                </h3>
              </div>

              <div
                v-for="(forum, idx) in catForums"
                :key="forum.id"
                class="group"
              >
                <router-link
                  :to="`/forum/${forum.slug}`"
                  class="flex items-center gap-4 px-5 py-4 transition-colors duration-150"
                  :class="[
                    isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
                    idx < catForums.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
                  ]"
                >
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
                  >
                    <i :class="forum.icon || 'fa-solid fa-comment'" class="text-purple-accent"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold group-hover:text-purple-accent transition-colors">
                      {{ forum.name }}
                    </div>
                    <div class="text-sm truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                      {{ forum.description }}
                    </div>
                  </div>
                  <div class="hidden sm:flex items-center gap-8 shrink-0 text-sm"
                       :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    <div class="text-center w-16">
                      <div class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        {{ (forum.threads_count ?? 0).toLocaleString() }}
                      </div>
                      <div class="text-xs">Threads</div>
                    </div>
                    <div class="text-center w-16">
                      <div class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        {{ (forum.posts_count ?? 0).toLocaleString() }}
                      </div>
                      <div class="text-xs">Posts</div>
                    </div>
                  </div>
                  <div v-if="forum.last_post" class="hidden md:flex items-center gap-3 shrink-0 w-52">
                    <UserAvatar :name="forum.last_post.user?.username" :color="forum.last_post.user?.avatar_color || 'bg-purple-500'" :online="false" size="sm" />
                    <div class="min-w-0">
                      <div class="text-sm font-medium truncate" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                        {{ forum.last_post.user?.username }}
                      </div>
                      <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        {{ forum.last_post.time_ago }}
                      </div>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </template>

        <!-- Stats bar -->
        <div
          v-if="forumStore.config?.stats"
          class="rounded-xl px-6 py-4 text-center text-sm transition-colors duration-300"
          :class="isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500 shadow-sm'"
        >
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ forumStore.config.stats.threads?.toLocaleString() }}</span> Threads ·
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ forumStore.config.stats.posts?.toLocaleString() }}</span> Posts ·
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ forumStore.config.stats.members?.toLocaleString() }}</span> Members ·
          Newest: <span class="text-purple-accent font-medium">{{ forumStore.config.stats.newest_member }}</span>
        </div>
      </main>
    </div>
  </div>
</template>

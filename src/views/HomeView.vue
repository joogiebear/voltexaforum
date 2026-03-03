<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useForumStore } from '../stores/forum'
import { usePresenceStore } from '../stores/presence'
import { getForums as fetchForumsApi } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { formatRelative } from '../utils/date'

const isDark = inject('isDark')
const forumStore = useForumStore()
const presenceStore = usePresenceStore()

const selectedGame = ref('all')
const games = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    await forumStore.fetchConfig()
    const res = await fetchForumsApi()
    games.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load forums. Please try again.'
  } finally {
    loading.value = false
  }
})

const isMultiGame = computed(() => forumStore.isMultiGame)

const filteredGames = computed(() => {
  if (selectedGame.value === 'all') return games.value
  return games.value.filter(g => g.slug === selectedGame.value)
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
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
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
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
      <aside v-if="isMultiGame && games.length > 1" class="lg:w-56 shrink-0">
        <div class="rounded-xl p-4 transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Games</h3>
          <ul class="space-y-1">
            <li>
              <button
                @click="selectedGame = 'all'"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="selectedGame === 'all' ? 'bg-purple-accent/15 text-purple-accent' : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
              >
                <i class="fa-solid fa-gamepad w-4 text-center"></i> All Games
              </button>
            </li>
            <li v-for="game in games" :key="game.id">
              <button
                @click="selectedGame = game.slug"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="selectedGame === game.slug ? 'bg-purple-accent/15 text-purple-accent' : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
              >
                <i v-if="game.icon && game.icon.startsWith('fa-')" :class="[game.icon, 'w-4 text-center']"></i>
                <span v-else class="w-4 text-center">{{ game.icon }}</span>
                {{ game.name }}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0">
        <div v-for="game in filteredGames" :key="game.id" class="mb-8">
          <!-- Game header (multi-game only) -->
          <div v-if="isMultiGame && games.length > 1" class="flex items-center gap-2 mb-4">
            <i v-if="game.icon && game.icon.startsWith('fa-')" :class="[game.icon, 'text-xl text-purple-accent']"></i>
            <span v-else class="text-xl">{{ game.icon }}</span>
            <h2 class="text-lg font-bold uppercase tracking-wide" :class="isDark ? 'text-white' : 'text-gray-900'">{{ game.name }}</h2>
          </div>

          <!-- Categories -->
          <div v-for="category in game.categories" :key="category.id" class="mb-4">
            <div class="rounded-xl overflow-hidden transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
              <!-- Category header -->
              <div
                class="px-5 py-3 border-b border-l-4 border-l-purple-accent"
                :class="isDark ? 'bg-gray-900 border-b-gray-800' : 'bg-gray-50 border-b-gray-200'"
              >
                <h3 class="font-semibold text-sm uppercase tracking-wider" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  {{ category.name }}
                </h3>
                <p v-if="category.description" class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ category.description }}
                </p>
              </div>

              <!-- Forums in category -->
              <div v-if="category.forums && category.forums.length">
                <div v-for="(forum, idx) in category.forums" :key="forum.id" class="group">
                  <router-link
                    :to="`/forum/${forum.slug}`"
                    class="flex items-center gap-4 px-5 py-4 transition-colors duration-150"
                    :class="[
                      isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
                      idx < category.forums.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
                    ]"
                  >
                    <!-- Icon -->
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'">
                      <i :class="[forum.icon || 'fa-solid fa-comment', 'text-purple-accent text-lg']"></i>
                    </div>

                    <!-- Name + description -->
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold group-hover:text-purple-accent transition-colors" :class="isDark ? 'text-white' : 'text-gray-900'">
                        {{ forum.name }}
                      </div>
                      <div class="text-sm truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        {{ forum.description }}
                      </div>
                    </div>

                    <!-- Stats -->
                    <div class="hidden sm:flex items-center gap-8 shrink-0 text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
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

                    <!-- Last post -->
                    <div v-if="forum.last_post_user" class="hidden md:flex items-center gap-3 shrink-0 w-52">
                      <UserAvatar
                        :name="forum.last_post_user.username"
                        :color="forum.last_post_user.avatar_color || 'bg-purple-500'"
                        :avatar-url="forum.last_post_user.avatar_url"
                        :online="false"
                        size="sm"
                      />
                      <div class="min-w-0">
                        <div class="text-sm font-medium truncate" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                          {{ forum.last_post_user.username }}
                        </div>
                        <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                          {{ forum.last_post_at ? formatRelative(forum.last_post_at) : 'Latest post' }}
                        </div>
                      </div>
                    </div>
                  </router-link>
                </div>
              </div>
              <div v-else class="px-5 py-4 text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                No forums yet.
              </div>
            </div>
          </div>

          <!-- No categories -->
          <div v-if="!game.categories || !game.categories.length" class="text-center py-10 text-gray-400">
            No forums available.
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!filteredGames.length" class="text-center py-20">
          <i class="fa-solid fa-comments text-5xl text-gray-500 mb-4"></i>
          <p class="text-lg font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">No forums found.</p>
        </div>
      </main>
    </div>

    <!-- Online Users Widget -->
    <div
      v-if="!loading && !error && presenceStore.onlineUsers.length"
      class="mt-6 rounded-xl p-4 transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ presenceStore.onlineUsers.length }} {{ presenceStore.onlineUsers.length === 1 ? 'member' : 'members' }} online
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <router-link
          v-for="user in presenceStore.onlineUsers.slice(0, 8)"
          :key="user.id"
          :to="`/profile/${user.username}`"
          :title="user.username"
        >
          <UserAvatar
            :name="user.username"
            :color="user.avatar_color || 'bg-purple-500'"
            :avatar-url="user.avatar_url"
            :online="true"
            size="sm"
          />
        </router-link>
        <span
          v-if="presenceStore.onlineUsers.length > 8"
          class="text-xs font-medium px-2 py-1 rounded-full"
          :class="isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'"
        >
          +{{ presenceStore.onlineUsers.length - 8 }} more
        </span>
      </div>
    </div>
  </div>
</template>

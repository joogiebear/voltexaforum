<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search as searchApi } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()

const query = ref(route.query.q || '')
const activeTab = ref(route.query.type || 'all')
const results = ref(null)
const loading = ref(false)
const error = ref(null)
const pagination = ref(null)

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'threads', label: 'Threads' },
  { key: 'posts', label: 'Posts' },
  { key: 'users', label: 'Users' },
]

const hasResults = computed(() => {
  if (!results.value) return false
  if (activeTab.value === 'all') {
    return (results.value.threads?.length || 0) + (results.value.posts?.length || 0) + (results.value.users?.length || 0) > 0
  }
  const data = results.value[activeTab.value]
  return Array.isArray(data) && data.length > 0
})

function highlightTerm(text, term) {
  if (!term || !text) return text
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<strong class="text-purple-accent">$1</strong>')
}

async function doSearch(page = 1) {
  if (query.value.trim().length < 2) {
    results.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await searchApi(query.value, activeTab.value, page)
    results.value = res.data.data || res.data
    pagination.value = res.data.meta || null
  } catch {
    error.value = 'Search failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  router.replace({ path: '/search', query: { q: query.value, type: activeTab.value } })
  doSearch()
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ path: '/search', query: { q: query.value, type: tab } })
  if (query.value.trim().length >= 2) doSearch()
}

watch(() => route.query, (newQ) => {
  if (newQ.q && newQ.q !== query.value) {
    query.value = newQ.q
    activeTab.value = newQ.type || 'all'
    doSearch()
  }
})

onMounted(() => {
  if (query.value.trim().length >= 2) doSearch()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6">
    <!-- Search input -->
    <div class="mb-6">
      <form @submit.prevent="handleSearch" class="flex gap-3">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2"
             :class="isDark ? 'text-gray-500' : 'text-gray-400'" />
          <input
            v-model="query"
            type="text"
            placeholder="Search threads, posts, users..."
            class="w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          />
        </div>
        <button
          type="submit"
          class="px-6 py-3 bg-purple-accent hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
        >
          Search
        </button>
      </form>
      <p v-if="query.trim().length > 0 && query.trim().length < 2" class="text-xs mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        Type at least 2 characters to search
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6 border-b" :class="isDark ? 'border-gray-800' : 'border-gray-200'">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="setTab(tab.key)"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === tab.key
          ? 'border-purple-accent text-purple-accent'
          : isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="flex gap-4 items-center">
          <div class="w-10 h-10 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16">
      <i class="fa-solid fa-triangle-exclamation text-4xl text-gray-400 mb-3"></i>
      <p class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
    </div>

    <!-- Results -->
    <template v-else-if="results">
      <!-- No results -->
      <div v-if="!hasResults" class="text-center py-16">
        <i class="fa-solid fa-magnifying-glass text-4xl text-gray-500 mb-3"></i>
        <p class="text-lg font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
          No results for "{{ query }}"
        </p>
        <p class="text-sm mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          Try different keywords or check your spelling
        </p>
      </div>

      <div v-else class="space-y-8">
        <!-- Threads results -->
        <div v-if="(activeTab === 'all' || activeTab === 'threads') && results.threads?.length">
          <h2 class="text-sm font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Threads
          </h2>
          <div class="space-y-3">
            <router-link
              v-for="thread in results.threads"
              :key="'t'+thread.id"
              :to="`/thread/${thread.id}`"
              class="block rounded-xl p-4 transition-colors"
              :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:bg-gray-50'"
            >
              <div class="flex items-start gap-3">
                <UserAvatar
                  :name="thread.author?.username"
                  :color="thread.author?.avatar_color || 'bg-purple-500'"
                  :avatar-url="thread.author?.avatar_url"
                  size="sm"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-if="thread.forum?.name"
                      class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-accent/15 text-purple-accent"
                    >
                      {{ thread.forum.name }}
                    </span>
                    <h3 class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'" v-html="highlightTerm(thread.title, query)" />
                  </div>
                  <div class="flex items-center gap-3 mt-1 text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    <span>by {{ thread.author?.username }}</span>
                    <span>{{ thread.replies_count ?? 0 }} replies</span>
                    <span>{{ thread.created_at }}</span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Posts results -->
        <div v-if="(activeTab === 'all' || activeTab === 'posts') && results.posts?.length">
          <h2 class="text-sm font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Posts
          </h2>
          <div class="space-y-3">
            <router-link
              v-for="post in results.posts"
              :key="'p'+post.id"
              :to="`/thread/${post.thread_id}`"
              class="block rounded-xl p-4 transition-colors"
              :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:bg-gray-50'"
            >
              <div class="text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                in <span class="text-purple-accent">{{ post.thread_title || 'Thread' }}</span>
              </div>
              <p class="text-sm leading-relaxed" :class="isDark ? 'text-gray-300' : 'text-gray-700'" v-html="highlightTerm(post.excerpt || post.body, query)" />
              <div class="flex items-center gap-3 mt-2 text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <span>by {{ post.author?.username }}</span>
                <span>{{ post.created_at }}</span>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Users results -->
        <div v-if="(activeTab === 'all' || activeTab === 'users') && results.users?.length">
          <h2 class="text-sm font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Users
          </h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <router-link
              v-for="user in results.users"
              :key="'u'+user.id"
              :to="`/profile/${user.username}`"
              class="flex items-center gap-3 rounded-xl p-4 transition-colors"
              :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:bg-gray-50'"
            >
              <UserAvatar
                :name="user.username"
                :color="user.avatar_color || 'bg-purple-500'"
                :avatar-url="user.avatar_url"
                size="md"
              />
              <div>
                <div class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ user.username }}</div>
                <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ user.post_count ?? 0 }} posts &middot; Joined {{ user.join_date || user.created_at }}
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-8">
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="doSearch(page)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="(pagination.current_page || 1) === page
            ? 'bg-purple-accent text-white'
            : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          {{ page }}
        </button>
      </div>
    </template>
  </div>
</template>

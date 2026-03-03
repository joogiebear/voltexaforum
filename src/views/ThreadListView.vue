<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getForumThreads } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import UserAvatar from '../components/UserAvatar.vue'
import { formatRelative } from '../utils/date'

const isDark = inject('isDark')
const route = useRoute()
const authStore = useAuthStore()
const forumStore = useForumStore()

const threads = ref([])
const forumMeta = ref(null)
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const pagination = ref(null)
const search = ref('')
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadThreads(1), 350)
}

async function loadThreads(page = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await getForumThreads(route.params.slug, page, search.value)
    threads.value = res.data.data
    forumMeta.value = res.data.forum || null
    pagination.value = res.data.meta || null
    currentPage.value = page
  } catch (e) {
    error.value = 'Failed to load threads. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await forumStore.fetchConfig()
  await loadThreads(Number(route.query.page) || 1)
})

watch(() => route.params.slug, () => {
  loadThreads(1)
})

function tagClass(tag) {
  switch (tag) {
    case 'Solved': return 'bg-green-500/15 text-green-400'
    case 'Hot': return 'bg-orange-500/15 text-orange-400'
    case 'Pinned': return 'bg-purple-accent/15 text-purple-accent'
    default: return 'bg-gray-500/15 text-gray-400'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-6 rounded w-1/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="rounded-xl animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4" :class="i < 5 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''">
          <div class="w-8 h-8 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-1/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadThreads(currentPage)"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap"
           :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/" class="hover:text-purple-accent transition-colors">Home</router-link>
        <template v-if="forumMeta?.category">
          <span>&#8250;</span>
          <span>{{ forumMeta.category.name }}</span>
        </template>
        <template v-if="forumMeta?.parent_forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${forumMeta.parent_forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ forumMeta.parent_forum.name }}
          </router-link>
        </template>
        <span>&#8250;</span>
        <span :class="isDark ? 'text-white' : 'text-gray-900'" class="font-medium">{{ forumMeta?.name || route.params.slug }}</span>
      </nav>

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold">{{ forumMeta?.name || route.params.slug }}</h1>
          <p v-if="forumMeta?.description" class="text-sm mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ forumMeta.description }}</p>
        </div>
        <router-link
          v-if="authStore.isLoggedIn"
          :to="`/forum/${route.params.slug}/new-thread`"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <i class="fa-solid fa-pen-to-square"></i> New Thread
        </router-link>
      </div>

      <!-- Search -->
      <div class="relative mb-4">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
        <input
          v-model="search"
          @input="onSearchInput"
          type="text"
          placeholder="Search threads..."
          class="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600 focus:border-purple-accent' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-accent'"
        />
      </div>

      <!-- Sub Forums section -->
      <div
        v-if="forumMeta?.subforums?.length"
        class="rounded-xl overflow-hidden transition-colors duration-300 mb-6"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div
          class="px-5 py-3 border-b"
          :class="isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            <i class="fa-solid fa-folder-tree"></i> Sub Forums
          </h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" :class="isDark ? 'bg-gray-800/30' : 'bg-gray-100'">
          <router-link
            v-for="sub in forumMeta.subforums"
            :key="sub.id"
            :to="`/forum/${sub.slug}`"
            class="flex items-center gap-3 p-4 transition-colors duration-150"
            :class="isDark ? 'bg-gray-900 hover:bg-gray-800/60' : 'bg-white hover:bg-gray-50'"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'">
              <i :class="[sub.icon || 'fa-solid fa-comment', 'text-purple-accent text-sm']"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-sm hover:text-purple-accent transition-colors" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ sub.name }}
              </div>
              <div v-if="sub.description" class="text-xs truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ sub.description }}
              </div>
              <div class="text-[11px] mt-0.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                {{ (sub.thread_count ?? sub.threads_count ?? 0).toLocaleString() }} threads
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Thread list -->
      <div
        class="rounded-xl overflow-hidden transition-colors duration-300"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <!-- Table header -->
        <div
          class="hidden sm:grid grid-cols-[1fr_100px_100px_120px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
        >
          <span>Thread</span>
          <span class="text-center">Replies</span>
          <span class="text-center">Views</span>
          <span class="text-right">Last Reply</span>
        </div>

        <!-- Empty state -->
        <div v-if="!threads.length" class="p-8 text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          No threads yet. Be the first to start a discussion!
        </div>

        <!-- Thread rows -->
        <template v-for="(thread, idx) in threads" :key="thread.id">
          <!-- Divider between pinned and regular threads -->
          <div
            v-if="idx > 0 && !thread.is_pinned && threads[idx - 1].is_pinned"
            class="flex items-center gap-3 px-5 py-2"
            :class="isDark ? 'bg-gray-900/60 border-y border-gray-800' : 'bg-gray-50 border-y border-gray-200'"
          >
            <i class="fa-solid fa-list text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
            <span class="text-xs font-semibold uppercase tracking-wider" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Regular Threads</span>
          </div>
          <router-link
          :to="`/thread/${thread.slug || thread.id}`"
          class="block sm:grid grid-cols-[1fr_100px_100px_120px] gap-4 items-center px-5 py-4 transition-colors duration-150"
          :class="[
            isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
            idx < threads.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
            thread.is_pinned ? (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50') : '',
          ]"
        >
          <!-- Title + author -->
          <div class="flex items-center gap-3 min-w-0">

            <!-- Left icon cluster: likes (unpinned) OR pin/lock icons (pinned) -->
            <div class="hidden sm:flex flex-col items-center justify-center gap-0.5 w-7 shrink-0">
              <template v-if="thread.is_pinned">
                <i class="fa-solid fa-thumbtack text-[11px] text-violet-400"></i>
                <i v-if="thread.is_locked" class="fa-solid fa-lock text-[11px] text-gray-500 mt-0.5"></i>
              </template>
              <template v-else>
                <span class="text-[10px] font-semibold leading-none" :class="thread.likes_count > 0 ? (isDark ? 'text-gray-400' : 'text-gray-500') : (isDark ? 'text-gray-700' : 'text-gray-300')">
                  {{ thread.likes_count || 0 }}
                </span>
                <i class="fa-regular fa-heart text-[11px]" :class="thread.likes_count > 0 ? 'text-pink-400' : (isDark ? 'text-gray-700' : 'text-gray-300')"></i>
              </template>
            </div>

            <UserAvatar :name="thread.author?.username" :color="thread.author?.avatar_color || 'bg-purple-500'" :avatar-url="thread.author?.avatar_url" :online="thread.author?.is_online || false" size="sm" />
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  v-for="tag in (thread.tags || [])"
                  :key="tag"
                  :class="tagClass(tag)"
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                >
                  {{ tag }}
                </span>
                <span class="font-medium truncate group-hover:text-purple-accent">{{ thread.title }}</span>
              </div>
              <div class="text-sm mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <span :style="thread.author?.group_color ? { color: thread.author.group_color } : {}">{{ thread.author?.username }}</span>
              </div>
            </div>
          </div>

          <!-- Replies -->
          <div class="hidden sm:block text-center font-medium text-sm"
               :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            {{ thread.replies_count ?? 0 }}
          </div>

          <!-- Views -->
          <div class="hidden sm:block text-center text-sm"
               :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            {{ (thread.views ?? 0).toLocaleString() }}
          </div>

          <!-- Last reply -->
          <div class="hidden sm:block text-right text-sm"
               :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            {{ formatRelative(thread.last_reply_at) || thread.time_ago }}
          </div>
          </router-link>
        </template>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          v-if="currentPage > 1"
          @click="loadThreads(currentPage - 1)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          &#8592; Prev
        </button>
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="loadThreads(page)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="currentPage === page
            ? 'bg-purple-accent text-white'
            : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          {{ page }}
        </button>
        <button
          v-if="currentPage < pagination.last_page"
          @click="loadThreads(currentPage + 1)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          Next &#8594;
        </button>
      </div>
    </template>
  </div>
</template>

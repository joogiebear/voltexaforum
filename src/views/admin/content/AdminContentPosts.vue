<script setup>
import { ref, onMounted } from 'vue'
import { getAdminContentPosts } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const posts = ref([])
const loading = ref(true)
const searchQuery = ref('')
const pagination = ref(null)
const currentPage = ref(1)

function truncate(text, len = 80) {
  if (!text) return '—'
  return text.length > len ? text.slice(0, len) + '...' : text
}

async function fetchPosts(page = 1) {
  loading.value = true
  try {
    const res = await getAdminContentPosts({ page, search: searchQuery.value || undefined })
    const d = res.data
    posts.value = d.data || d || []
    pagination.value = d.meta || d
    currentPage.value = page
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load posts', 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchPosts(1)
}

onMounted(() => fetchPosts())
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <div class="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h3 class="text-base font-semibold text-white">Posts</h3>
        <form @submit.prevent="handleSearch" class="flex items-center gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts..."
            class="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none w-64"
          />
          <button type="submit" class="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
            <i class="fa-solid fa-search"></i>
          </button>
        </form>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 bg-gray-700 rounded animate-pulse"></div>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thread</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody v-if="posts.length" class="divide-y divide-gray-700/50">
            <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-700/30 transition-colors">
              <td class="py-3 text-gray-200 max-w-xs">{{ truncate(post.body || post.content) }}</td>
              <td class="py-3 text-gray-400">{{ post.author?.username || post.username || '—' }}</td>
              <td class="py-3 text-gray-400">
                <router-link
                  v-if="post.thread?.id || post.thread_id"
                  :to="`/thread/${post.thread?.id || post.thread_id}`"
                  class="hover:text-violet-400 transition-colors"
                >
                  {{ post.thread?.title || post.thread_title || 'View thread' }}
                </router-link>
                <span v-else>—</span>
              </td>
              <td class="py-3 text-gray-500 text-xs whitespace-nowrap">{{ post.created_at ? new Date(post.created_at).toLocaleDateString() : '—' }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="py-12 text-center text-sm text-gray-500">No posts found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-700/50">
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="fetchPosts(page)"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="currentPage === page ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-700'"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

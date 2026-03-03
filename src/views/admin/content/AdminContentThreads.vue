<script setup>
import { ref, onMounted } from 'vue'
import { getAdminContentThreads } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const threads = ref([])
const loading = ref(true)
const searchQuery = ref('')
const pagination = ref(null)
const currentPage = ref(1)

async function fetchThreads(page = 1) {
  loading.value = true
  try {
    const res = await getAdminContentThreads({ page, search: searchQuery.value || undefined })
    const d = res.data
    threads.value = d.data || d || []
    pagination.value = d.meta || d
    currentPage.value = page
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load threads', 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchThreads(1)
}

onMounted(() => fetchThreads())
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <div class="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h3 class="text-base font-semibold text-white">Threads</h3>
        <form @submit.prevent="handleSearch" class="flex items-center gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search threads..."
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
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Forum</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Replies</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody v-if="threads.length" class="divide-y divide-gray-700/50">
            <tr v-for="thread in threads" :key="thread.id" class="hover:bg-gray-700/30 transition-colors">
              <td class="py-3 text-gray-200">
                <router-link :to="`/thread/${thread.id}`" class="hover:text-violet-400 transition-colors">
                  {{ thread.title }}
                </router-link>
              </td>
              <td class="py-3 text-gray-400">{{ thread.forum?.name || thread.forum_name || '—' }}</td>
              <td class="py-3 text-gray-400">{{ thread.author?.username || thread.username || '—' }}</td>
              <td class="py-3 text-gray-400 text-center">{{ thread.reply_count ?? thread.replies ?? 0 }}</td>
              <td class="py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span v-if="thread.is_pinned" class="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">Pinned</span>
                  <span v-if="thread.is_locked" class="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">Locked</span>
                </div>
              </td>
              <td class="py-3 text-gray-500 text-xs whitespace-nowrap">{{ thread.created_at ? new Date(thread.created_at).toLocaleDateString() : '—' }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="py-12 text-center text-sm text-gray-500">No threads found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-700/50">
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="fetchThreads(page)"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="currentPage === page ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-700'"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

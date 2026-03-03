<script setup>
import { ref, onMounted } from 'vue'
import { getAdminThreads } from '../../../services/api'

const threads = ref([])
const loading = ref(true)
const hasEndpoint = ref(true)

onMounted(async () => {
  try {
    const res = await getAdminThreads()
    threads.value = res.data.data || res.data || []
  } catch {
    hasEndpoint.value = false
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-semibold text-white">Threads</h3>
        <span class="text-xs text-gray-500">{{ hasEndpoint ? `${threads.length} threads` : 'Preview' }}</span>
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
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Forum</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Replies</th>
              <th class="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody v-if="hasEndpoint && threads.length">
            <tr v-for="thread in threads" :key="thread.id" class="border-b border-gray-700/50 hover:bg-gray-750/50">
              <td class="py-3 text-gray-200">{{ thread.title }}</td>
              <td class="py-3 text-gray-400">{{ thread.author?.username || thread.username || '—' }}</td>
              <td class="py-3 text-gray-400">{{ thread.forum?.name || thread.forum_name || '—' }}</td>
              <td class="py-3 text-gray-400 text-center">{{ thread.reply_count ?? 0 }}</td>
              <td class="py-3 text-gray-500 text-xs">{{ thread.created_at ? new Date(thread.created_at).toLocaleDateString() : '—' }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-newspaper text-violet-400 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-300">Coming Soon</p>
                    <p class="text-xs text-gray-500 mt-1">Thread management will be available once the API endpoint is ready.</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

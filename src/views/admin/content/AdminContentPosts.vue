<script setup>
import { ref } from 'vue'

const posts = ref([])
const loading = ref(false)
const hasEndpoint = ref(false)

function truncate(text, len = 80) {
  if (!text) return '—'
  return text.length > len ? text.slice(0, len) + '...' : text
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-semibold text-white">Posts</h3>
        <span class="text-xs text-gray-500">{{ hasEndpoint ? `${posts.length} posts` : 'Preview' }}</span>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 bg-gray-700 rounded animate-pulse"></div>
      </div>

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
          <tbody v-if="hasEndpoint && posts.length">
            <tr v-for="post in posts" :key="post.id" class="border-b border-gray-700/50 hover:bg-gray-750/50">
              <td class="py-3 text-gray-200 max-w-xs">{{ truncate(post.content || post.body) }}</td>
              <td class="py-3 text-gray-400">{{ post.author?.username || post.username || '—' }}</td>
              <td class="py-3 text-gray-400">{{ post.thread?.title || post.thread_title || '—' }}</td>
              <td class="py-3 text-gray-500 text-xs">{{ post.created_at ? new Date(post.created_at).toLocaleDateString() : '—' }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-comment-dots text-violet-400 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-300">Coming Soon</p>
                    <p class="text-xs text-gray-500 mt-1">Post management will be available once the API endpoint is ready.</p>
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

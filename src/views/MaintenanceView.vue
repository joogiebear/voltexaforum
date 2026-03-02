<script setup>
import { inject } from 'vue'
import { useForumStore } from '../stores/forum'

const isDark = inject('isDark')
const forumStore = useForumStore()
const forumName = forumStore.config?.forum_name || 'My Forum'
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-4"
    :class="isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'"
  >
    <div class="text-center max-w-md">
      <div class="text-6xl mb-6">
        <i class="fa-solid fa-wrench text-purple-accent"></i>
      </div>
      <h1 class="text-3xl font-bold mb-3">Under Maintenance</h1>
      <p class="text-lg mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
        {{ forumName }} is currently undergoing maintenance.
      </p>
      <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        We'll be back shortly. Thank you for your patience!
      </p>
    </div>
  </div>
</template>

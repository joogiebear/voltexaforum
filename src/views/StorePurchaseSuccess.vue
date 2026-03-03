<script setup>
import { inject } from 'vue'

const isDark = inject('isDark')
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div
      class="w-full max-w-md rounded-xl p-8 text-center transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-lg'"
    >
      <!-- Green checkmark -->
      <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/15">
        <svg class="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-2xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
        Purchase Successful!
      </h1>

      <p class="text-sm mb-8" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Your item has been queued for delivery. Check your notifications for updates.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <router-link
          to="/store"
          class="px-5 py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors"
        >
          Back to Store
        </router-link>
        <router-link
          to="/notifications"
          class="px-5 py-2.5 rounded-lg font-semibold transition-colors"
          :class="isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          View Notifications
        </router-link>
      </div>
    </div>
  </div>
</template>

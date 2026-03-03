<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useNotificationsStore } from '../stores/notifications'

const isDark = inject('isDark')
const notifStore = useNotificationsStore()
const activeTab = ref('all')

onMounted(() => {
  notifStore.fetchNotifications()
})

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notifStore.notifications.filter(n => !n.read_at)
  }
  return notifStore.notifications
})

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  return new Date(date).toLocaleDateString()
}

function notifIcon(type) {
  const icons = {
    reply: 'fa-solid fa-comment',
    mention: 'fa-solid fa-at',
    like: 'fa-solid fa-heart',
    award: 'fa-solid fa-award',
    achievement: 'fa-solid fa-trophy',
    system: 'fa-solid fa-gear',
  }
  return icons[type] || 'fa-solid fa-bell'
}

async function handleMarkRead(n) {
  if (!n.read_at) {
    await notifStore.markRead(n.id)
  }
}

function handleDelete(n) {
  notifStore.remove(n.id)
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
        Notifications
      </h1>
      <button
        v-if="notifStore.unreadCount > 0"
        @click="notifStore.markAllRead()"
        class="px-4 py-2 rounded-lg text-sm font-medium text-purple-accent hover:bg-purple-accent/10 transition-colors"
      >
        Mark all read
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'">
      <button
        @click="activeTab = 'all'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === 'all'
          ? 'bg-purple-accent text-white'
          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'"
      >
        All
      </button>
      <button
        @click="activeTab = 'unread'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'unread'
          ? 'bg-purple-accent text-white'
          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'"
      >
        Unread
        <span
          v-if="notifStore.unreadCount > 0"
          class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none"
        >
          {{ notifStore.unreadCount }}
        </span>
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="notifStore.error && !notifStore.loading"
      class="rounded-xl p-12 text-center border"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <i class="fa-solid fa-triangle-exclamation text-4xl text-red-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
        {{ notifStore.error }}
      </p>
      <button
        @click="notifStore.fetchNotifications()"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Loading -->
    <div v-else-if="notifStore.loading" class="space-y-4">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-xl p-4 animate-pulse"
        :class="isDark ? 'bg-gray-800' : 'bg-white'"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-1/3" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
            <div class="h-3 rounded w-2/3" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Notification list -->
    <div v-else-if="filteredNotifications.length" class="space-y-2">
      <div
        v-for="n in filteredNotifications"
        :key="n.id"
        class="rounded-xl p-4 border transition-colors"
        :class="[
          isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50',
          isDark ? 'bg-gray-800' : 'bg-white',
          !n.read_at ? (isDark ? 'ring-1 ring-purple-accent/20' : 'ring-1 ring-purple-accent/10') : ''
        ]"
      >
        <div class="flex items-start gap-3">
          <i :class="[notifIcon(n.data?.type), 'text-lg mt-0.5 shrink-0 w-5 text-center text-violet-400']"></i>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
                  {{ n.data?.title || 'Notification' }}
                </p>
                <p class="text-sm mt-1" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                  {{ n.data?.body || '' }}
                </p>
                <p class="text-xs mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ timeAgo(n.created_at) }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span v-if="!n.read_at" class="w-2.5 h-2.5 rounded-full bg-purple-accent" />
                <button
                  v-if="!n.read_at"
                  @click.stop="handleMarkRead(n)"
                  class="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors bg-purple-accent/10 text-purple-accent hover:bg-purple-accent/20"
                  title="Mark as read"
                >
                  <i class="fa-solid fa-check text-xs"></i>
                  <span>Mark read</span>
                </button>
                <button
                  @click.stop="handleDelete(n)"
                  class="text-xs px-2 py-1 rounded transition-colors text-red-400 hover:bg-red-400/10"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="rounded-xl p-12 text-center border"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <i class="fa-solid fa-bell text-4xl text-gray-400"></i>
      <p class="text-lg font-semibold mt-4" :class="isDark ? 'text-white' : 'text-gray-900'">
        {{ activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet' }}
      </p>
      <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        {{ activeTab === 'unread' ? "You're all caught up!" : "When something happens, you'll see it here." }}
      </p>
    </div>
  </div>
</template>

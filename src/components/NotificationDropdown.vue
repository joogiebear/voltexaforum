<script setup>
import { inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '../stores/notifications'

const isDark = inject('isDark')
const router = useRouter()
const notifStore = useNotificationsStore()

const emit = defineEmits(['close'])

onMounted(() => {
  if (!notifStore.notifications.length) {
    notifStore.fetchNotifications()
  }
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

function truncate(text, len = 60) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

function notifIcon(type) {
  const icons = {
    reply: '💬',
    mention: '📢',
    like: '❤️',
    award: '🎖️',
    achievement: '🏆',
    system: '⚙️',
  }
  return icons[type] || '🔔'
}

async function handleClick(notification) {
  // Always mark as read on click
  if (!notification.read_at) {
    await notifStore.markRead(notification.id)
  }
  if (notification.data?.url) {
    router.push(notification.data.url)
  } else {
    // No URL — just close dropdown, badge will have cleared
    emit('close')
  }
}

function handleMarkAllRead() {
  notifStore.markAllRead()
}

function handleViewAll() {
  router.push('/notifications')
  emit('close')
}

const latestNotifications = () => notifStore.notifications.slice(0, 10)
</script>

<template>
  <div
    class="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-lg border overflow-hidden z-50"
    :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b"
      :class="isDark ? 'border-gray-700' : 'border-gray-100'"
    >
      <h3 class="font-semibold text-sm" :class="isDark ? 'text-white' : 'text-gray-900'">
        Notifications
      </h3>
      <button
        v-if="notifStore.unreadCount > 0"
        @click="handleMarkAllRead"
        class="text-xs text-purple-accent hover:text-purple-400 transition-colors"
      >
        Mark all read
      </button>
    </div>

    <!-- Loading -->
    <div v-if="notifStore.loading" class="px-4 py-8 text-center">
      <span class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Loading...</span>
    </div>

    <!-- Notification list -->
    <div v-else-if="latestNotifications().length" class="max-h-96 overflow-y-auto">
      <button
        v-for="n in latestNotifications()"
        :key="n.id"
        @click="handleClick(n)"
        class="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b last:border-b-0"
        :class="[
          isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50',
          !n.read_at ? (isDark ? 'bg-purple-accent/5' : 'bg-purple-50/50') : ''
        ]"
      >
        <span class="text-lg shrink-0 mt-0.5">{{ notifIcon(n.data?.type) }}</span>
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium truncate"
            :class="isDark ? 'text-white' : 'text-gray-900'"
          >
            {{ n.data?.title || 'Notification' }}
          </p>
          <p
            class="text-xs mt-0.5"
            :class="isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            {{ truncate(n.data?.body) }}
          </p>
          <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            {{ timeAgo(n.created_at) }}
          </p>
        </div>
        <span
          v-if="!n.read_at"
          class="w-2 h-2 rounded-full bg-purple-accent shrink-0 mt-2"
        />
      </button>
    </div>

    <!-- Empty -->
    <div v-else class="px-4 py-8 text-center">
      <span class="text-2xl">🔔</span>
      <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        No notifications yet
      </p>
    </div>

    <!-- Footer -->
    <div
      class="border-t px-4 py-2.5 text-center"
      :class="isDark ? 'border-gray-700' : 'border-gray-100'"
    >
      <button
        @click="handleViewAll"
        class="text-sm text-purple-accent hover:text-purple-400 font-medium transition-colors"
      >
        View all notifications
      </button>
    </div>
  </div>
</template>

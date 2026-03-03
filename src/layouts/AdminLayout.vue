<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { useNotificationsStore } from '../stores/notifications'
import { getAdminDashboard } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const route = useRoute()
const authStore = useAuthStore()
const forumStore = useForumStore()
const sidebarOpen = ref(false)
const onlineCount = ref(0)
const pendingReports = ref(0)
const notificationStore = useNotificationsStore()

onMounted(async () => {
  try {
    const res = await getAdminDashboard()
    const d = res.data.data || res.data
    onlineCount.value = d.online_count ?? 0
    pendingReports.value = d.pending_reports ?? 0
  } catch {}
})

const pageTitle = computed(() => route.meta?.title || 'Admin')

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-bar' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'fa-solid fa-users' },
      { to: '/admin/groups', label: 'Groups & Roles', icon: 'fa-solid fa-users-gear' },
      { to: '/admin/moderation', label: 'Moderation', icon: 'fa-solid fa-shield-halved' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/content/threads', label: 'Threads', icon: 'fa-solid fa-newspaper' },
      { to: '/admin/content/posts', label: 'Posts', icon: 'fa-solid fa-comment-dots' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/store/items', label: 'Store Items', icon: 'fa-solid fa-store' },
      { to: '/admin/store/purchases', label: 'Purchases', icon: 'fa-solid fa-credit-card' },
    ],
  },
  {
    label: 'Gamification',
    items: [
      { to: '/admin/achievements', label: 'Achievements', icon: 'fa-solid fa-trophy' },
      { to: '/admin/awards', label: 'Awards', icon: 'fa-solid fa-award' },
    ],
  },
  {
    label: 'Appearance',
    items: [
      { to: '/admin/appearance/themes', label: 'Themes', icon: 'fa-solid fa-palette' },
      { to: '/admin/appearance/custom-code', label: 'Custom CSS/JS', icon: 'fa-solid fa-code' },
    ],
  },
  {
    label: 'Plugins',
    items: [
      { to: '/admin/plugins', label: 'Installed', icon: 'fa-solid fa-puzzle-piece' },
      { to: '/admin/plugins/upload', label: 'Upload', icon: 'fa-solid fa-upload' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/settings/general', label: 'General', icon: 'fa-solid fa-sliders' },
      { to: '/admin/settings/forums', label: 'Forums', icon: 'fa-solid fa-comments' },
      { to: '/admin/settings/email', label: 'Email & SMTP', icon: 'fa-solid fa-envelope' },
      { to: '/admin/settings/credits', label: 'Credits', icon: 'fa-solid fa-coins' },
      { to: '/admin/settings/store', label: 'Store', icon: 'fa-solid fa-store' },
    ],
  },
]

function isActive(path) {
  if (path === '/admin/dashboard') return route.path === '/admin/dashboard' || route.path === '/admin'
  // Exact match for paths that are prefixes of sibling nav items
  if (path === '/admin/plugins') return route.path === '/admin/plugins'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-900">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-200 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-2 px-5 border-b border-gray-800 shrink-0">
        <i class="fa-solid fa-bolt text-violet-400"></i>
        <span class="font-bold text-gray-300 text-sm tracking-wide">{{ forumStore.config?.forum_name || 'My Forum' }} Admin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div v-for="section in navSections" :key="section.label">
          <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            {{ section.label }}
          </div>
          <router-link
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
            :class="isActive(item.to)
              ? 'text-violet-400 bg-violet-500/10 border-l-2 border-violet-500 -ml-px'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'"
          >
            <i :class="[item.icon, 'w-4 text-center']"></i>
            {{ item.label }}
          </router-link>
        </div>
      </nav>

      <!-- Bottom user section -->
      <div class="border-t border-gray-800 p-4 shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <UserAvatar
            :name="authStore.username"
            :color="authStore.avatarColor"
            :avatar-url="authStore.avatarUrl"
            :online="true"
            size="sm"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-200 truncate">{{ authStore.username }}</div>
            <div class="text-xs text-gray-500">{{ authStore.user?.email || 'Admin' }}</div>
          </div>
        </div>
        <router-link
          to="/"
          class="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <i class="fa-solid fa-arrow-left"></i>
          Back to Site
        </router-link>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-4">
          <!-- Mobile hamburger -->
          <button
            class="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">{{ pageTitle }}</h1>
        </div>

        <div class="flex items-center gap-3">
          <!-- Quick stats pills -->
          <div class="hidden md:flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {{ onlineCount }} online
            </span>
            <span v-if="pendingReports > 0" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
              {{ pendingReports }} pending reports
            </span>
          </div>
          <!-- Notification bell -->
          <router-link to="/notifications" class="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <i class="fa-solid fa-bell w-5 h-5 text-lg"></i>
            <span v-if="notificationStore.unreadCount > 0" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </router-link>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

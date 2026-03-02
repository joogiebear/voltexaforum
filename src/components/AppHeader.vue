<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useMessagesStore } from '../stores/messages'
import UserAvatar from './UserAvatar.vue'
import NotificationDropdown from './NotificationDropdown.vue'

const isDark = inject('isDark')
const toggleTheme = inject('toggleTheme')
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationsStore()
const messagesStore = useMessagesStore()

const mobileOpen = ref(false)
const avatarDropdownOpen = ref(false)
const notifDropdownOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Forum' },
  { to: '/store', label: 'Store' },
  { to: '/achievements', label: 'Achievements' },
]

function isActive(path, route) {
  if (path === '/') return route === '/'
  return route.startsWith(path)
}

function closeDropdown() {
  avatarDropdownOpen.value = false
}

function toggleNotifDropdown() {
  notifDropdownOpen.value = !notifDropdownOpen.value
  avatarDropdownOpen.value = false
}

function closeNotifDropdown() {
  notifDropdownOpen.value = false
}

async function handleLogout() {
  closeDropdown()
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300"
    :class="isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 font-bold text-xl shrink-0">
          <i class="fa-solid fa-bolt text-2xl text-violet-400"></i>
          <span class="text-purple-accent">Voltexa</span><span>Forum</span>
        </router-link>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-6 ml-8">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="font-medium transition-colors hover:text-purple-accent"
            :class="isActive(link.to, $route.path) ? 'text-purple-accent' : isDark ? 'text-gray-300' : 'text-gray-600'"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <!-- Right side -->
        <div class="hidden md:flex items-center gap-2">
          <button
            @click="toggleTheme"
            class="p-2 rounded-lg transition-colors"
            :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'"
          >
            <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'" class="text-base w-4 text-center" :style="isDark ? 'color: #a78bfa' : 'color: #f59e0b'"></i>
          </button>

          <!-- Logged-in user -->
          <template v-if="authStore.isLoggedIn">
            <!-- Notifications bell -->
            <div class="relative">
              <button
                @click="toggleNotifDropdown"
                class="relative p-2 rounded-lg transition-colors"
                :class="isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'"
              >
                <i class="fa-solid fa-bell"></i>
                <span
                  v-if="notifStore.unreadCount > 0"
                  class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none font-medium"
                >
                  {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
                </span>
              </button>

              <!-- Notification dropdown -->
              <NotificationDropdown
                v-if="notifDropdownOpen"
                @close="closeNotifDropdown"
              />

              <!-- Overlay to close -->
              <div
                v-if="notifDropdownOpen"
                class="fixed inset-0 z-40"
                @click="closeNotifDropdown"
              />
            </div>

            <!-- Messages envelope -->
            <router-link
              to="/messages"
              class="relative p-2 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'"
            >
              <i class="fa-solid fa-envelope"></i>
              <span
                v-if="messagesStore.dmUnreadCount > 0"
                class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none font-medium"
              >
                {{ messagesStore.dmUnreadCount > 99 ? '99+' : messagesStore.dmUnreadCount }}
              </span>
            </router-link>

            <router-link
              to="/credits"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              :class="isDark ? 'hover:bg-gray-800 text-purple-accent' : 'hover:bg-gray-100 text-purple-accent'"
            >
              <i class="fa-solid fa-coins text-xs"></i> {{ authStore.credits.toLocaleString() }}
            </router-link>

            <!-- Avatar with dropdown -->
            <div class="relative">
              <button
                @click="avatarDropdownOpen = !avatarDropdownOpen; notifDropdownOpen = false"
                class="flex items-center gap-2"
              >
                <UserAvatar
                  :name="authStore.username"
                  :color="authStore.avatarColor"
                  :online="true"
                  size="sm"
                />
              </button>

              <!-- Dropdown menu -->
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="avatarDropdownOpen"
                  class="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden py-1 z-50"
                  :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
                >
                  <!-- User info header -->
                  <div class="px-4 py-3 border-b" :class="isDark ? 'border-gray-700' : 'border-gray-100'">
                    <p class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ authStore.username }}</p>
                    <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'"><i class="fa-solid fa-coins text-xs"></i> {{ authStore.credits.toLocaleString() }} credits</p>
                  </div>

                  <!-- Admin panel link (admin only) -->
                  <router-link
                    v-if="authStore.isAdmin"
                    to="/admin"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-red-400 hover:bg-red-400/10"
                  >
                    <i class="fa-solid fa-crown w-4 text-center"></i> Admin Panel
                  </router-link>

                  <!-- Mod tools (mod or admin) -->
                  <router-link
                    v-if="authStore.isModerator"
                    to="/admin/moderation"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-amber-400 hover:bg-amber-400/10"
                  >
                    <i class="fa-solid fa-shield-halved w-4 text-center"></i> Moderation
                  </router-link>

                  <div v-if="authStore.isModerator" class="border-t my-1" :class="isDark ? 'border-gray-700' : 'border-gray-100'" />

                  <!-- Standard links -->
                  <router-link
                    :to="`/profile/${authStore.username}`"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-user w-4 text-center"></i> My Profile
                  </router-link>
                  <router-link
                    to="/messages"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-envelope w-4 text-center"></i> Messages
                    <span
                      v-if="messagesStore.dmUnreadCount > 0"
                      class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none ml-auto"
                    >
                      {{ messagesStore.dmUnreadCount }}
                    </span>
                  </router-link>
                  <router-link
                    to="/usercp"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-gear w-4 text-center"></i> Settings
                  </router-link>
                  <router-link
                    to="/credits"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-coins w-4 text-center"></i> Credits
                  </router-link>
                  <router-link
                    to="/achievements"
                    @click="closeDropdown"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'"
                  >
                    <i class="fa-solid fa-trophy w-4 text-center"></i> Achievements
                  </router-link>
                  <div class="border-t my-1" :class="isDark ? 'border-gray-700' : 'border-gray-100'" />
                  <button
                    @click="handleLogout"
                    class="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors text-red-400 hover:bg-red-400/10"
                  >
                    <i class="fa-solid fa-right-from-bracket w-4 text-center"></i> Log out
                  </button>
                </div>
              </Transition>

              <!-- Overlay to close dropdown -->
              <div
                v-if="avatarDropdownOpen"
                class="fixed inset-0 z-40"
                @click="closeDropdown"
              />
            </div>
          </template>

          <!-- Not logged in -->
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-accent hover:bg-purple-700 transition-colors"
            >
              Register
            </router-link>
          </template>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="md:hidden p-2 rounded-lg"
          :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'"
          @click="mobileOpen = !mobileOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileOpen" class="md:hidden pb-4 space-y-2">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          @click="mobileOpen = false"
          class="block px-3 py-2 rounded-lg font-medium transition-colors"
          :class="isActive(link.to, $route.path) ? 'text-purple-accent bg-purple-accent/10' : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
        >
          {{ link.label }}
        </router-link>

        <template v-if="authStore.isLoggedIn">
          <div class="border-t my-2" :class="isDark ? 'border-gray-800' : 'border-gray-200'" />
          <router-link
            to="/notifications"
            @click="mobileOpen = false"
            class="flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            <span><i class="fa-solid fa-bell mr-1.5"></i> Notifications</span>
            <span
              v-if="notifStore.unreadCount > 0"
              class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none"
            >
              {{ notifStore.unreadCount }}
            </span>
          </router-link>
          <router-link
            to="/messages"
            @click="mobileOpen = false"
            class="flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            <span><i class="fa-solid fa-envelope mr-1.5"></i> Messages</span>
            <span
              v-if="messagesStore.dmUnreadCount > 0"
              class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none"
            >
              {{ messagesStore.dmUnreadCount }}
            </span>
          </router-link>
          <router-link
            :to="`/profile/${authStore.username}`"
            @click="mobileOpen = false"
            class="block px-3 py-2 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-user mr-1.5"></i> Profile
          </router-link>
          <router-link
            to="/usercp"
            @click="mobileOpen = false"
            class="block px-3 py-2 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-gear mr-1.5"></i> Settings
          </router-link>
          <div class="flex items-center gap-3 px-3 pt-2">
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'"
            >
              <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'" class="text-base w-4 text-center" :style="isDark ? 'color: #a78bfa' : 'color: #f59e0b'"></i>
            </button>
            <router-link
              to="/credits"
              @click="mobileOpen = false"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-purple-accent"
            >
              <i class="fa-solid fa-coins text-xs"></i> {{ authStore.credits.toLocaleString() }}
            </router-link>
            <router-link :to="`/profile/${authStore.username}`" @click="mobileOpen = false">
              <UserAvatar
                :name="authStore.username"
                :color="authStore.avatarColor"
                :online="true"
                size="sm"
              />
            </router-link>
          </div>
          <button
            @click="handleLogout; mobileOpen = false"
            class="block w-full text-left px-3 py-2 rounded-lg font-medium text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <i class="fa-solid fa-right-from-bracket mr-1.5"></i> Log out
          </button>
        </template>

        <template v-else>
          <div class="border-t my-2" :class="isDark ? 'border-gray-800' : 'border-gray-200'" />
          <div class="flex items-center gap-3 px-3 pt-2">
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'"
            >
              <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'" class="text-base w-4 text-center" :style="isDark ? 'color: #a78bfa' : 'color: #f59e0b'"></i>
            </button>
          </div>
          <router-link
            to="/login"
            @click="mobileOpen = false"
            class="block px-3 py-2 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            Login
          </router-link>
          <router-link
            to="/register"
            @click="mobileOpen = false"
            class="block px-3 py-2 rounded-lg font-medium text-purple-accent"
          >
            Register
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

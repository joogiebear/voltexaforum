<script setup>
import { inject, ref, computed } from 'vue'
import { useForumStore } from '../stores/forum'
import AdSlot from './AdSlot.vue'

const isDark = inject('isDark', ref(true))
const forumStore = useForumStore()
const forumName = computed(() => forumStore.config?.forum_name || 'My Forum')
const year = new Date().getFullYear()
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
    <AdSlot position="footer" />
  </div>
  <footer
    class="border-t transition-colors duration-300"
    :class="isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

        <!-- Brand -->
        <div class="col-span-2 sm:col-span-1">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-purple-accent flex items-center justify-center">
              <i class="fa-solid fa-bolt text-white text-xs"></i>
            </div>
            <span class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-gray-900'">{{ forumName }}</span>
          </div>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            A community built for gamers and creators. Join the conversation.
          </p>
        </div>

        <!-- Community -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Community
          </h4>
          <ul class="space-y-2">
            <li><router-link to="/" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Forums</router-link></li>
            <li><router-link to="/members" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Members</router-link></li>
            <li><router-link to="/leaderboard" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Leaderboard</router-link></li>
            <li><router-link to="/staff" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Staff</router-link></li>
            <li><router-link to="/achievements" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Achievements</router-link></li>
          </ul>
        </div>

        <!-- Account -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Account
          </h4>
          <ul class="space-y-2">
            <li><router-link to="/usercp" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Settings</router-link></li>
            <li><router-link to="/credits" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Credits</router-link></li>
            <li><router-link to="/store" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Store</router-link></li>
            <li><router-link to="/messages" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Messages</router-link></li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Support
          </h4>
          <ul class="space-y-2">
            <li><router-link to="/search" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Search</router-link></li>
            <li><a href="#" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Rules</a></li>
            <li><a href="#" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Privacy Policy</a></li>
            <li><a href="#" class="text-sm transition-colors hover:text-purple-accent" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Terms of Service</a></li>
          </ul>
        </div>

      </div>

      <!-- Bottom bar -->
      <div
        class="flex items-center justify-between flex-wrap gap-3 pt-6 border-t text-xs"
        :class="isDark ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'"
      >
        <span>&copy; {{ year }} {{ forumName }}. All rights reserved.</span>
        <span class="flex items-center gap-1">
          Powered by
          <span class="font-semibold text-purple-accent ml-1">VoltexaHub</span>
        </span>
      </div>
    </div>
  </footer>
</template>

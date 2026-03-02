<script setup>
import { inject, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'

const isDark = inject('isDark')
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const forumStore = useForumStore()
const forumName = computed(() => forumStore.config?.forum_name || 'My Forum')

const email = ref('')
const password = ref('')

async function handleLogin() {
  const success = await authStore.login({ email: email.value, password: password.value })
  if (success) {
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div
      class="w-full max-w-md rounded-xl p-8 transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-lg'"
    >
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 font-bold text-2xl">
          <span class="text-3xl">&#9889;</span>
          <span class="text-purple-accent">{{ forumName }}</span>
        </router-link>
        <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Sign in to your account
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="authStore.error"
        class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
      >
        {{ authStore.error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="authStore.loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Register link -->
      <p class="text-center text-sm mt-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Don't have an account?
        <router-link to="/register" class="text-purple-accent hover:underline font-medium">
          Create one
        </router-link>
      </p>
    </div>
  </div>
</template>

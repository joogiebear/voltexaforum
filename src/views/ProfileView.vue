<script setup>
import { inject, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserProfile } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { formatDate, formatDateTime, formatRelative, formatJoinDate } from '../utils/date'

const isDark = inject('isDark')
const route = useRoute()
const authStore = useAuthStore()

const isOwnProfile = computed(() => {
  return authStore.isLoggedIn && authStore.username === route.params.username
})

const profile = ref(null)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('overview')

const tabs = ['overview', 'posts', 'achievements', 'awards']

const bannerColor = computed(() => {
  return profile.value?.primary_role?.color || '#7c3aed'
})

async function loadProfile() {
  loading.value = true
  error.value = null
  try {
    const res = await getUserProfile(route.params.username)
    profile.value = res.data.data
  } catch (e) {
    if (e.response?.status === 404) {
      profile.value = null
    } else {
      error.value = 'Failed to load profile. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

watch(() => route.params.username, () => {
  activeTab.value = 'overview'
  loadProfile()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="rounded-xl overflow-hidden animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="h-56" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="px-6 pb-6 pt-12 flex items-center gap-5">
          <div class="w-24 h-24 rounded-full -mt-20 border-4" :class="isDark ? 'bg-gray-800 border-gray-900' : 'bg-gray-200 border-white'" />
          <div class="flex-1 space-y-3">
            <div class="h-6 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-4 rounded w-1/5" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadProfile"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else-if="profile">
      <!-- Banner header -->
      <div
        class="rounded-xl overflow-hidden mb-6 transition-colors duration-300"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div
          class="h-56 relative overflow-hidden"
          :style="!profile.cover_url ? { background: `linear-gradient(135deg, ${bannerColor}30, ${bannerColor}15)` } : {}"
        >
          <img
            v-if="profile.cover_url"
            :src="profile.cover_url"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0" :style="{ background: `rgba(0,0,0,${(profile.cover_overlay_opacity ?? 20) / 100})` }" />
        </div>
        <div class="px-6 pb-6 relative">
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14">
            <div class="shrink-0">
              <UserAvatar
                :name="profile.username"
                :color="profile.avatar_color || 'bg-purple-500'"
                :avatar-url="profile.avatar_url"
                :online="profile.is_online"
                size="xl"
                class="ring-4"
                :class="isDark ? 'ring-gray-900' : 'ring-white'"
              />
            </div>
            <div class="text-center sm:text-left flex-1 pb-1">
              <h1 class="text-2xl font-bold">
                <span :style="profile.primary_role?.color ? { color: profile.primary_role.color } : {}" :class="!profile.primary_role?.color ? (isDark ? 'text-white' : 'text-gray-900') : ''">{{ profile.username }}</span>
              </h1>
              <div class="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span
                  v-if="profile.primary_role"
                  class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                  :style="{
                    backgroundColor: (profile.primary_role.color || '#6b7280') + '20',
                    color: profile.primary_role.color || '#6b7280',
                    border: `1px solid ${profile.primary_role.color || '#6b7280'}40`,
                  }"
                >
                  {{ profile.primary_role.label }}
                </span>
                <span v-if="profile.is_online" class="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                  <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div v-if="profile.user_title" class="text-sm italic mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ profile.user_title }}
              </div>
            </div>
            <router-link
              v-if="isOwnProfile"
              to="/usercp"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-colors shrink-0"
              :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'"
            >
              <i class="fa-solid fa-pen-to-square text-xs"></i> Edit Profile
            </router-link>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ (profile.post_count ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-pen-to-square mr-1"></i>Posts
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ (profile.thread_count ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-comments mr-1"></i>Threads
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold text-purple-accent">
            {{ (profile.credits ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-coins mr-1"></i>Credits
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ formatDate(profile.join_date) }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-calendar-days mr-1"></i>Joined
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300 col-span-2 sm:col-span-1"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div v-if="profile.is_online" class="text-sm font-bold text-green-500">Online Now</div>
          <div v-else class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ formatRelative(profile.last_seen) || 'N/A' }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-clock mr-1"></i>Last Active
          </div>
        </div>
      </div>

      <!-- Social links -->
      <div
        v-if="profile.discord_username || profile.twitter_handle || profile.website_url"
        class="flex items-center gap-3 mb-6 flex-wrap"
      >
        <a
          v-if="profile.discord_username"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="isDark ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'"
          :title="profile.discord_username"
        >
          <i class="fa-brands fa-discord text-indigo-400"></i>
          {{ profile.discord_username }}
        </a>
        <a
          v-if="profile.twitter_handle"
          :href="`https://twitter.com/${profile.twitter_handle.replace('@', '')}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="isDark ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'"
        >
          <i class="fa-brands fa-twitter text-sky-400"></i>
          {{ profile.twitter_handle }}
        </a>
        <a
          v-if="profile.website_url"
          :href="profile.website_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="isDark ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'"
        >
          <i class="fa-solid fa-globe text-green-400"></i>
          Website
        </a>
      </div>

      <!-- Tabs -->
      <div
        class="flex gap-1 mb-6 overflow-x-auto border-b"
        :class="isDark ? 'border-gray-800' : 'border-gray-200'"
      >
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="px-4 py-2.5 font-medium text-sm capitalize transition-colors whitespace-nowrap relative"
          :class="activeTab === tab
            ? 'text-purple-accent'
            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab }}
          <div
            v-if="activeTab === tab"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-accent rounded-t"
          />
        </button>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Bio -->
        <div
          v-if="profile.bio"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <i class="fa-solid fa-user text-sm text-purple-accent"></i> About
          </h3>
          <p class="text-sm leading-relaxed" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            {{ profile.bio }}
          </p>
        </div>

        <!-- Recent Posts -->
        <div
          v-if="profile.recent_posts?.length"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-sm text-purple-accent"></i> Recent Posts
          </h3>
          <div class="space-y-3">
            <div
              v-for="post in profile.recent_posts"
              :key="post.id"
              class="flex items-start gap-3 p-3 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                   :class="isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'">
                <i class="fa-solid fa-message"></i>
              </div>
              <div class="min-w-0 flex-1">
                <router-link
                  v-if="post.thread_id"
                  :to="`/thread/${post.thread_id}`"
                  class="font-medium text-sm truncate block hover:text-purple-accent transition-colors"
                >
                  {{ post.thread_title }}
                </router-link>
                <p v-if="post.excerpt" class="text-xs mt-0.5 line-clamp-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ post.excerpt }}
                </p>
                <div class="text-xs mt-1" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                  {{ formatRelative(post.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Achievements -->
        <div
          v-if="profile.achievements?.length"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <i class="fa-solid fa-trophy text-sm text-purple-accent"></i> Recent Achievements
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="ach in profile.achievements.slice(0, 6)"
              :key="ach.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-purple-accent/30 bg-purple-accent/5"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 bg-purple-accent/10 text-purple-accent">
                <template v-if="ach.icon && !ach.icon.startsWith('fa-')">{{ ach.icon }}</template>
                <i v-else :class="ach.icon || 'fa-solid fa-star'"></i>
              </div>
              <div class="min-w-0">
                <div class="font-medium text-sm truncate">{{ ach.name }}</div>
                <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ formatDate(ach.unlocked_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state for overview -->
        <div
          v-if="!profile.bio && !profile.recent_posts?.length && !profile.achievements?.length"
          class="rounded-xl p-12 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <i class="fa-solid fa-user-astronaut text-4xl text-gray-400"></i>
          <p class="mt-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">This profile is looking a bit empty.</p>
        </div>
      </div>

      <!-- Posts tab -->
      <div v-if="activeTab === 'posts'" class="space-y-4">
        <div
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div v-if="profile.recent_posts?.length" class="space-y-3">
            <div
              v-for="post in profile.recent_posts"
              :key="post.id"
              class="p-4 rounded-lg border transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50'"
            >
              <router-link
                v-if="post.thread_id"
                :to="`/thread/${post.thread_id}`"
                class="font-medium text-sm hover:text-purple-accent transition-colors"
              >
                {{ post.thread_title }}
              </router-link>
              <p v-if="post.excerpt" class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ post.excerpt }}</p>
              <div class="text-xs mt-2" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                {{ formatDateTime(post.created_at) }}
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-pen-to-square text-3xl mb-2"></i>
            <p>No posts yet.</p>
          </div>
        </div>
      </div>

      <!-- Achievements tab -->
      <div v-if="activeTab === 'achievements'">
        <div v-if="profile.achievements?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="ach in profile.achievements"
            :key="ach.id"
            class="rounded-xl p-4 border transition-colors duration-300"
            :class="ach.unlocked
              ? 'border-purple-accent/40 ' + (isDark ? 'bg-gray-900' : 'bg-white shadow-sm')
              : (isDark ? 'border-gray-800 bg-gray-900/50 opacity-50' : 'border-gray-200 bg-gray-50 opacity-50')"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                :class="[
                  ach.unlocked ? 'bg-purple-accent/10 text-purple-accent' : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400'),
                  { 'grayscale': !ach.unlocked }
                ]"
              >
                <template v-if="ach.icon && !ach.icon.startsWith('fa-')">{{ ach.icon }}</template>
                <i v-else :class="ach.icon || 'fa-solid fa-star'"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm truncate">{{ ach.name }}</span>
                  <i v-if="ach.unlocked" class="fa-solid fa-circle-check text-green-500 text-xs shrink-0"></i>
                  <i v-else class="fa-solid fa-lock text-xs shrink-0" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
                </div>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ ach.description }}
                </p>
                <div v-if="ach.unlocked" class="text-xs text-purple-accent mt-1">
                  Unlocked {{ formatDate(ach.unlocked_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rounded-xl p-8 text-center" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <i class="fa-solid fa-trophy text-4xl text-gray-400"></i>
          <p class="mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No achievements yet.</p>
        </div>
      </div>

      <!-- Awards tab -->
      <div v-if="activeTab === 'awards'">
        <div v-if="profile.awards?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="award in profile.awards"
            :key="award.id"
            class="rounded-xl p-5 border transition-colors duration-300"
            :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
          >
            <div class="text-center">
              <img
                v-if="award.icon_url"
                :src="award.icon_url"
                :alt="award.name"
                class="w-12 h-12 object-contain mx-auto"
              />
              <div v-else class="w-12 h-12 rounded-lg mx-auto flex items-center justify-center bg-yellow-500/10">
                <i class="fa-solid fa-award text-2xl text-yellow-500"></i>
              </div>
              <h4 class="font-semibold mt-2">{{ award.name }}</h4>
              <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ award.description }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-else
          class="rounded-xl p-8 text-center"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <i class="fa-solid fa-medal text-4xl text-gray-400"></i>
          <p class="mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No awards yet.</p>
        </div>
      </div>
      <!-- Custom CSS -->
      <component v-if="profile.custom_css" is="style">{{ profile.custom_css }}</component>
    </template>

    <!-- User not found -->
    <div v-else-if="!loading" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <h1 class="text-xl font-bold mt-4">User not found</h1>
      <p class="mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        The user "{{ route.params.username }}" doesn't exist.
      </p>
      <router-link to="/" class="inline-block mt-4 text-purple-accent hover:underline">
        Back to Home
      </router-link>
    </div>
  </div>
</template>

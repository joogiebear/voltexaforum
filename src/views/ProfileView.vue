<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUserProfile } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const route = useRoute()

const profile = ref(null)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('overview')

const tabs = ['overview', 'posts', 'achievements', 'awards']

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

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="rounded-xl p-6 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="flex items-center gap-5">
          <div class="w-20 h-20 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-3">
            <div class="h-6 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-4 rounded w-1/5" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadProfile"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else-if="profile">
      <!-- Profile header -->
      <div
        class="rounded-xl p-6 mb-6 transition-colors duration-300"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <UserAvatar :name="profile.username" :color="profile.avatar_color || 'bg-purple-500'" :online="profile.is_online" size="xl" />
          <div class="text-center sm:text-left flex-1">
            <h1 class="text-2xl font-bold" :style="{ color: profile.group_color }">
              {{ profile.username }}
            </h1>
            <div class="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <span
                v-if="profile.group_label"
                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                :style="{
                  backgroundColor: (profile.group_color || '#6b7280') + '20',
                  color: profile.group_color || '#6b7280',
                  border: `1px solid ${profile.group_color || '#6b7280'}40`,
                }"
              >
                <span v-if="profile.group_badge">{{ profile.group_badge }}</span>
                {{ profile.group_label }}
              </span>
            </div>
            <div v-if="profile.user_title" class="text-sm italic mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ profile.user_title }}
            </div>
          </div>
        </div>

        <!-- Stats bar -->
        <div
          class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t"
          :class="isDark ? 'border-gray-800' : 'border-gray-200'"
        >
          <div class="text-center">
            <div class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ (profile.post_count ?? 0).toLocaleString() }}
            </div>
            <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Posts</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-purple-accent">
              {{ (profile.credits ?? 0).toLocaleString() }}
            </div>
            <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Credits</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ formatDate(profile.join_date) }}
            </div>
            <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Joined</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ profile.is_online ? 'Now' : profile.last_active || 'N/A' }}
            </div>
            <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Last Active</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors whitespace-nowrap"
          :class="activeTab === tab
            ? 'bg-purple-accent text-white'
            : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div
          v-if="profile.bio"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3">About</h3>
          <p class="text-sm leading-relaxed" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            {{ profile.bio }}
          </p>
        </div>

        <div
          v-if="profile.recent_posts?.length"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3">Recent Activity</h3>
          <div class="space-y-3">
            <div
              v-for="post in profile.recent_posts"
              :key="post.id"
              class="flex items-start gap-3 p-3 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                   :class="isDark ? 'bg-gray-800' : 'bg-gray-100'">
                &#128172;
              </div>
              <div class="min-w-0">
                <router-link v-if="post.thread_id" :to="`/thread/${post.thread_id}`" class="font-medium text-sm truncate block hover:text-purple-accent">
                  {{ post.thread_title || post.title }}
                </router-link>
                <div v-else class="font-medium text-sm truncate">{{ post.title }}</div>
                <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ post.time_ago || post.date }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="profile.recent_achievements?.length"
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <h3 class="font-semibold mb-3">Recent Achievements</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="ach in profile.recent_achievements"
              :key="ach.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-purple-accent/30 bg-purple-accent/5"
            >
              <span class="text-2xl">{{ ach.icon }}</span>
              <div>
                <div class="font-medium text-sm">{{ ach.name }}</div>
                <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ formatDate(ach.unlocked_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Posts tab -->
      <div v-if="activeTab === 'posts'" class="space-y-4">
        <div
          class="rounded-xl p-5 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div v-if="profile.posts?.length" class="space-y-3">
            <div
              v-for="post in profile.posts"
              :key="post.id"
              class="p-4 rounded-lg border transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50'"
            >
              <router-link v-if="post.thread_id" :to="`/thread/${post.thread_id}`" class="font-medium text-sm hover:text-purple-accent">
                {{ post.thread_title || post.title }}
              </router-link>
              <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ post.excerpt }}</p>
              <div class="text-xs mt-2" :class="isDark ? 'text-gray-600' : 'text-gray-400'">{{ post.time_ago }}</div>
            </div>
          </div>
          <div v-else class="text-center py-8" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            No posts yet.
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
              <span class="text-2xl" :class="{ 'grayscale': !ach.unlocked }">
                {{ ach.icon }}
              </span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ ach.name }}</span>
                  <span v-if="ach.unlocked" class="text-green-500 text-xs">&#10003;</span>
                  <span v-else class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">&#128274;</span>
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
          <span class="text-4xl">&#127942;</span>
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
              <img v-if="award.icon_url" :src="award.icon_url" class="w-12 h-12 object-contain mx-auto" />
              <span v-else class="text-4xl">{{ award.icon || '⭐' }}</span>
              <h4 class="font-semibold mt-2">{{ award.name }}</h4>
              <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ award.description }}
              </p>
              <div class="text-xs mt-2 text-purple-accent">
                Awarded
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="rounded-xl p-8 text-center"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <span class="text-4xl">&#127941;</span>
          <p class="mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No awards yet.</p>
        </div>
      </div>
    </template>

    <!-- User not found -->
    <div v-else-if="!loading" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
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

<script setup>
import { inject, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { getThread, getThreadPosts, createPost } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const route = useRoute()
const authStore = useAuthStore()
const forumStore = useForumStore()

const thread = ref(null)
const posts = ref([])
const loading = ref(true)
const error = ref(null)
const replyText = ref('')
const submitting = ref(false)
const replyError = ref(null)
const pagination = ref(null)
const currentPage = ref(1)

async function loadThread() {
  loading.value = true
  error.value = null
  try {
    await forumStore.fetchConfig()
    const [threadRes, postsRes] = await Promise.all([
      getThread(route.params.id),
      getThreadPosts(route.params.id, 1),
    ])
    thread.value = threadRes.data.data
    posts.value = postsRes.data.data
    pagination.value = postsRes.data.meta || null
  } catch (e) {
    error.value = 'Failed to load thread. Please try again.'
  } finally {
    loading.value = false
  }
}

async function loadPage(page) {
  try {
    const res = await getThreadPosts(route.params.id, page)
    posts.value = res.data.data
    pagination.value = res.data.meta || null
    currentPage.value = page
  } catch {}
}

async function submitReply() {
  if (!replyText.value.trim()) return
  submitting.value = true
  replyError.value = null
  try {
    const res = await createPost(route.params.id, { body: replyText.value })
    posts.value.push(res.data.data)
    replyText.value = ''
  } catch (e) {
    replyError.value = e.response?.data?.message || 'Failed to post reply.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadThread)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-6 rounded w-1/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="h-8 rounded w-2/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div v-for="i in 2" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="flex gap-4">
          <div class="w-14 h-14 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-3">
            <div class="h-4 rounded w-1/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadThread"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else-if="thread">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap"
           :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/" class="hover:text-purple-accent transition-colors">Home</router-link>
        <template v-if="thread.forum?.game && forumStore.isMultiGame">
          <span>&#8250;</span>
          <span>{{ thread.forum.game.name }}</span>
        </template>
        <template v-if="thread.forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${thread.forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ thread.forum.name }}
          </router-link>
        </template>
      </nav>

      <!-- Thread title -->
      <h1 class="text-2xl font-bold mb-6">{{ thread.title }}</h1>

      <!-- Posts -->
      <div class="space-y-4">
        <div
          v-for="post in posts"
          :key="post.id"
          class="rounded-xl overflow-hidden transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          :style="{ borderLeft: `3px solid ${post.author?.group_color || '#6b7280'}` }"
        >
          <div class="flex flex-col sm:flex-row">
            <!-- Author sidebar -->
            <div
              class="sm:w-52 shrink-0 p-5 flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 text-center border-b sm:border-b-0 sm:border-r"
              :class="isDark ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-100'"
            >
              <UserAvatar
                :name="post.author?.username"
                :color="post.author?.avatar_color || 'bg-purple-500'"
                :online="post.author?.is_online || false"
                size="lg"
              />
              <div class="space-y-1">
                <router-link
                  :to="`/profile/${post.author?.username}`"
                  class="font-semibold text-sm hover:underline block"
                  :style="{ color: post.author?.group_color || '#6b7280' }"
                >
                  {{ post.author?.username }}
                </router-link>

                <div
                  v-if="post.author?.group_label"
                  class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  :style="{
                    backgroundColor: (post.author?.group_color || '#6b7280') + '20',
                    color: post.author?.group_color || '#6b7280',
                    border: `1px solid ${post.author?.group_color || '#6b7280'}40`,
                  }"
                >
                  <span v-if="post.author?.group_badge">{{ post.author.group_badge }}</span>
                  {{ post.author?.group_label }}
                </div>

                <div
                  v-if="post.author?.user_title"
                  class="text-xs italic"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ post.author.user_title }}
                </div>

                <div class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  Posts: {{ post.author?.post_count ?? 0 }} |
                  Credits: {{ post.author?.credits ?? 0 }}
                </div>

                <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  Joined {{ post.author?.join_date }}
                </div>

                <div
                  v-if="post.author?.awards?.length"
                  class="flex items-center justify-center gap-1 mt-1"
                >
                  <template
                    v-for="award in post.author.awards.slice(0, 4)"
                    :key="award.id"
                  >
                    <img v-if="award.icon_url" :src="award.icon_url" class="w-5 h-5 object-contain cursor-default" :title="award.name" />
                    <span v-else class="cursor-default" :title="award.name">{{ award.icon || '⭐' }}</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Post content -->
            <div class="flex-1 p-5">
              <div class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ post.created_at }}
              </div>
              <div
                class="prose max-w-none text-sm leading-relaxed"
                :class="isDark ? 'text-gray-300' : 'text-gray-700'"
              >
                <div v-for="(paragraph, pIdx) in (post.body || '').split('\n\n')" :key="pIdx" class="mb-3">
                  <pre
                    v-if="paragraph.startsWith('```')"
                    class="rounded-lg p-4 text-sm overflow-x-auto font-mono"
                    :class="isDark ? 'bg-gray-950 text-gray-300' : 'bg-gray-100 text-gray-800'"
                  >{{ paragraph.replace(/```\w*/g, '').trim() }}</pre>
                  <p v-else class="whitespace-pre-line">{{ paragraph }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="loadPage(page)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="currentPage === page
            ? 'bg-purple-accent text-white'
            : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          {{ page }}
        </button>
      </div>

      <!-- Reply box -->
      <div
        class="rounded-xl mt-6 p-5 transition-colors duration-300"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <template v-if="authStore.isLoggedIn">
          <h3 class="font-semibold mb-3">Reply to this thread</h3>
          <div
            v-if="replyError"
            class="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {{ replyError }}
          </div>
          <textarea
            v-model="replyText"
            rows="5"
            placeholder="Write your reply..."
            class="w-full rounded-lg px-4 py-3 text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-accent resize-y"
            :class="isDark ? 'bg-gray-800 text-white border border-gray-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border border-gray-200 placeholder-gray-400'"
          />
          <div class="flex justify-end mt-3">
            <button
              @click="submitReply"
              :disabled="submitting || !replyText.trim()"
              class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="submitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ submitting ? 'Posting...' : 'Submit Reply' }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="text-center py-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            <router-link to="/login" class="text-purple-accent hover:underline font-medium">Login</router-link>
            to reply to this thread.
          </p>
        </template>
      </div>
    </template>
  </div>
</template>

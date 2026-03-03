<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { getThread, getThreadPosts, createPost, updatePost, updateThread, pinThread, lockThread, solveThread, adminDeletePost, deleteThread, moveThread, likeThread as likeThreadApi, likePost as likePostApi, reportPost, toggleThreadSubscription, getThreadSubscription } from '../services/api'
import { useToastStore } from '../stores/toast'
import UserAvatar from '../components/UserAvatar.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import { formatDateTime, formatJoinDate } from '../utils/date'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
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

// Editing state
const editingPostId = ref(null)
const editBody = ref('')
const editTitle = ref('')
const editSaving = ref(false)

// Mention autocomplete state
const replyTextarea = ref(null)
const showMentionDropdown = ref(false)
const mentionFilter = ref('')
const mentionStartIndex = ref(-1)

// Likes state
const liked = ref(false)
const likesCount = ref(0)
const likers = ref([])

// Report state
const showReportModal = ref(false)
const reportPostId = ref(null)
const reportReason = ref('')
const reportSubmitting = ref(false)

// Subscription state
const subscribed = ref(false)
const subLoading = ref(false)

// Moderation state
const showMoveDropdown = ref(false)
const modActionLoading = ref(null)
const toast = useToastStore()

const participants = computed(() => {
  const names = new Set()
  for (const post of posts.value) {
    if (post.author?.username) names.add(post.author.username)
  }
  return Array.from(names)
})

const filteredParticipants = computed(() => {
  if (!mentionFilter.value) return participants.value.slice(0, 8)
  const q = mentionFilter.value.toLowerCase()
  return participants.value.filter(u => u.toLowerCase().includes(q)).slice(0, 8)
})

function canEdit(post) {
  if (!authStore.isLoggedIn) return false
  return authStore.user?.id === post.user_id || authStore.isModerator
}

function isFirstPost(post) {
  return posts.value.length > 0 && posts.value[0].id === post.id && currentPage.value === 1
}

function startEditing(post) {
  editingPostId.value = post.id
  editBody.value = post.body || ''
  if (isFirstPost(post)) {
    editTitle.value = thread.value?.title || ''
  }
}

function cancelEditing() {
  editingPostId.value = null
  editBody.value = ''
  editTitle.value = ''
}

async function saveEdit(post) {
  editSaving.value = true
  try {
    if (isFirstPost(post)) {
      await updateThread(thread.value.id, { title: editTitle.value, body: editBody.value })
      thread.value.title = editTitle.value
    }
    const res = await updatePost(post.id, { body: editBody.value })
    const updated = res.data.data || res.data
    const idx = posts.value.findIndex(p => p.id === post.id)
    if (idx !== -1) {
      posts.value[idx] = { ...posts.value[idx], body: updated.body || editBody.value, rendered_content: updated.rendered_content || null, edited_at: updated.edited_at || new Date().toISOString() }
    }
    cancelEditing()
  } catch {
    // keep editing open on failure
  } finally {
    editSaving.value = false
  }
}

function formatEditedTime(editedAt) {
  if (!editedAt) return ''
  const diff = Math.floor((Date.now() - new Date(editedAt).getTime()) / 60000)
  if (diff < 1) return 'Edited just now'
  if (diff < 60) return `Edited ${diff} minute${diff === 1 ? '' : 's'} ago`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Edited ${days} day${days === 1 ? '' : 's'} ago`
}

function handleReplyInput(e) {
  const el = e.target
  const val = el.value
  const cursor = el.selectionStart

  const textBeforeCursor = val.substring(0, cursor)
  const atIndex = textBeforeCursor.lastIndexOf('@')

  if (atIndex >= 0) {
    const charBefore = atIndex > 0 ? val[atIndex - 1] : ' '
    const textAfterAt = textBeforeCursor.substring(atIndex + 1)
    if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !/\s/.test(textAfterAt)) {
      mentionStartIndex.value = atIndex
      mentionFilter.value = textAfterAt
      showMentionDropdown.value = true
      return
    }
  }

  showMentionDropdown.value = false
}

function insertMention(username) {
  const val = replyText.value
  const before = val.substring(0, mentionStartIndex.value)
  const after = val.substring(mentionStartIndex.value + 1 + mentionFilter.value.length)
  replyText.value = before + '@' + username + ' ' + after
  showMentionDropdown.value = false
}

function handleReplyKeydown(e) {
  if (showMentionDropdown.value && e.key === 'Escape') {
    showMentionDropdown.value = false
    e.preventDefault()
  }
}

// Moderation actions
async function togglePin() {
  if (!thread.value || modActionLoading.value) return
  modActionLoading.value = 'pin'
  try {
    const res = await pinThread(thread.value.id)
    thread.value.is_pinned = res.data.data.is_pinned
  } catch {} finally { modActionLoading.value = null }
}

async function toggleLock() {
  if (!thread.value || modActionLoading.value) return
  modActionLoading.value = 'lock'
  try {
    const res = await lockThread(thread.value.id)
    thread.value.is_locked = res.data.data.is_locked
  } catch {} finally { modActionLoading.value = null }
}

async function handleDeleteThread() {
  if (!thread.value) return
  if (!confirm('Are you sure you want to delete this entire thread? This cannot be undone.')) return
  modActionLoading.value = 'delete'
  try {
    await deleteThread(thread.value.id)
    router.push(thread.value.forum ? `/forum/${thread.value.forum.slug}` : '/')
  } catch {} finally { modActionLoading.value = null }
}

async function handleMoveThread(forumId) {
  if (!thread.value || !forumId) return
  modActionLoading.value = 'move'
  try {
    const res = await moveThread(thread.value.id, forumId)
    thread.value.forum = res.data.data.forum
    thread.value.forum_id = forumId
    showMoveDropdown.value = false
  } catch {} finally { modActionLoading.value = null }
}

async function handleDeletePost(post) {
  if (isFirstPost(post)) {
    if (!confirm('Delete this post and the entire thread?')) return
    modActionLoading.value = 'delete-post-' + post.id
    try {
      await deleteThread(thread.value.id)
      router.push(thread.value.forum ? `/forum/${thread.value.forum.slug}` : '/')
    } catch {} finally { modActionLoading.value = null }
  } else {
    if (!confirm('Delete this post?')) return
    modActionLoading.value = 'delete-post-' + post.id
    try {
      await adminDeletePost(post.id)
      posts.value = posts.value.filter(p => p.id !== post.id)
    } catch {} finally { modActionLoading.value = null }
  }
}

async function handleLike() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await likeThreadApi(thread.value.id)
    const data = res.data.data || res.data
    liked.value = data.liked
    likesCount.value = data.likes_count ?? data.likesCount ?? likesCount.value
    likers.value = data.likers || likers.value
  } catch {}
}

function openReportModal(postId) {
  reportPostId.value = postId
  reportReason.value = ''
  showReportModal.value = true
}

async function submitReport() {
  if (!reportReason.value.trim()) return
  reportSubmitting.value = true
  try {
    await reportPost({ post_id: reportPostId.value, reason: reportReason.value })
    toast.show('Report submitted')
    showReportModal.value = false
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to submit report', 'error')
  } finally {
    reportSubmitting.value = false
  }
}

async function toggleSubscribe() {
  if (subLoading.value) return
  subLoading.value = true
  const prev = subscribed.value
  subscribed.value = !prev
  try {
    const res = await toggleThreadSubscription(route.params.id)
    subscribed.value = res.data.subscribed ?? res.data.data?.subscribed ?? !prev
  } catch {
    subscribed.value = prev
  } finally {
    subLoading.value = false
  }
}

async function togglePostLike(post) {
  if (!authStore.isLoggedIn) return
  const prev = { liked: post.is_liked_by_me, count: post.like_count }
  post.is_liked_by_me = !prev.liked
  post.like_count = prev.count + (post.is_liked_by_me ? 1 : -1)
  try {
    const { data } = await likePostApi(post.id)
    post.is_liked_by_me = data.data.liked
    post.like_count = data.data.like_count
  } catch {
    post.is_liked_by_me = prev.liked
    post.like_count = prev.count
  }
}

async function loadThread() {
  loading.value = true
  error.value = null
  try {
    await forumStore.fetchConfig()
    if (authStore.isModerator) forumStore.fetchForums()
    const [threadRes, postsRes] = await Promise.all([
      getThread(route.params.id),
      getThreadPosts(route.params.id, 1),
    ])
    const threadData = threadRes.data.data
    thread.value = threadData
    likers.value = threadData.likers || []
    liked.value = threadData.is_liked_by_me ?? false
    likesCount.value = threadData.likes_count ?? 0
    posts.value = postsRes.data.data
    pagination.value = postsRes.data.meta || null
    if (authStore.isLoggedIn) {
      try {
        const subRes = await getThreadSubscription(route.params.id)
        subscribed.value = subRes.data.subscribed ?? subRes.data.data?.subscribed ?? false
      } catch {}
    }
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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
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
        <template v-if="thread.forum?.category">
          <span>&#8250;</span>
          <span>{{ thread.forum.category.name }}</span>
        </template>
        <template v-if="thread.forum?.parent_forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${thread.forum.parent_forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ thread.forum.parent_forum.name }}
          </router-link>
        </template>
        <template v-if="thread.forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${thread.forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ thread.forum.name }}
          </router-link>
        </template>
      </nav>

      <!-- Thread title -->
      <div class="flex items-center gap-3 mb-2 flex-wrap">
        <h1 class="text-2xl font-bold">{{ thread.title }}</h1>
        <span v-if="thread.is_pinned" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          <i class="fa-solid fa-thumbtack text-[10px]"></i> PINNED
        </span>
        <span v-if="thread.is_locked" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
          <i class="fa-solid fa-lock text-[10px]"></i> LOCKED
        </span>
      </div>

      <!-- Thread like + Subscribe + Mod toolbar row -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <!-- Left: Thread like + likers + Subscribe -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Thread like -->
          <button
            @click="handleLike"
            :disabled="!authStore.isLoggedIn"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
            :class="liked
              ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20'
              : isDark ? 'border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/40' : 'border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-300'"
          >
            <i :class="liked ? 'fa-solid fa-heart text-[11px]' : 'fa-regular fa-heart text-[11px]'"></i>
            <span>{{ likesCount || 'Like' }}</span>
          </button>

          <!-- Subscribe -->
          <button
            v-if="authStore.isLoggedIn"
          @click="toggleSubscribe"
          :disabled="subLoading"
          class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
          :class="subscribed
            ? 'border-violet-500/40 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20'
            : isDark ? 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'"
        >
          <i :class="subscribed ? 'fa-solid fa-bell text-[11px]' : 'fa-regular fa-bell text-[11px]'"></i>
          {{ subscribed ? 'Subscribed' : 'Subscribe' }}
        </button>
        <div v-else />

                </div><!-- end left group -->

        <!-- Mod toolbar -->
        <div v-if="authStore.isModerator" class="flex items-center gap-1 px-2 py-1 rounded-lg border" :class="isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'">
          <span class="text-[10px] font-semibold uppercase tracking-widest mr-1.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
            <i class="fa-solid fa-shield-halved"></i>
          </span>
          <button
            @click="togglePin"
            :disabled="modActionLoading === 'pin'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="thread.is_pinned ? 'text-yellow-400 bg-yellow-500/10' : isDark ? 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'"
            :title="thread.is_pinned ? 'Unpin' : 'Pin'"
          >
            <i class="fa-solid fa-thumbtack text-[11px]"></i>
            <span>{{ thread.is_pinned ? 'Unpin' : 'Pin' }}</span>
          </button>
          <button
            @click="toggleLock"
            :disabled="modActionLoading === 'lock'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="thread.is_locked ? 'text-blue-400 bg-blue-500/10' : isDark ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'"
            :title="thread.is_locked ? 'Unlock' : 'Lock'"
          >
            <i :class="['text-[11px]', thread.is_locked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock']"></i>
            <span>{{ thread.is_locked ? 'Unlock' : 'Lock' }}</span>
          </button>
          <button
            @click="handleDeleteThread"
            :disabled="modActionLoading === 'delete'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'"
            title="Delete thread"
          >
            <i class="fa-solid fa-trash text-[11px]"></i>
            <span>Delete</span>
          </button>
        <div v-if="authStore.isAdmin" class="relative">
          <button
            @click="showMoveDropdown = !showMoveDropdown"
            :disabled="modActionLoading === 'move'"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors bg-gray-500/15 text-gray-400 hover:bg-gray-500/25"
          >
            <i class="fa-solid fa-arrow-right"></i>
            Move
          </button>
          <div
            v-if="showMoveDropdown"
            class="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border shadow-lg py-1 max-h-64 overflow-y-auto"
            :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
          >
            <button
              v-for="forum in forumStore.forums.filter(f => f.id !== thread.forum_id)"
              :key="forum.id"
              @click="handleMoveThread(forum.id)"
              class="w-full text-left px-3 py-2 text-sm transition-colors"
              :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              {{ forum.name }}
            </button>
          </div>
        </div>
        </div>
      </div>

      <!-- Posts -->
      <div class="space-y-4">
        <div
          v-for="post in posts"
          :key="post.id"
          class="rounded-xl overflow-hidden transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="flex flex-col sm:flex-row">
            <!-- Author sidebar -->
            <div
              class="sm:w-48 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r relative overflow-hidden"
              :class="isDark ? 'border-gray-800' : 'border-gray-100'"
            >
              <!-- Top section: bg + content overlay -->
              <div class="relative flex flex-col items-center pt-4 pb-3 px-3">
                <!-- Background image with fade -->
                <div
                  v-if="post.author?.postbit_bg"
                  class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
                  :style="{ backgroundImage: `url(${post.author.postbit_bg})` }"
                />
                <!-- Fade gradient -->
                <div
                  v-if="post.author?.postbit_bg"
                  class="absolute inset-0"
                  :style="{ background: isDark ? 'linear-gradient(to bottom, rgba(17,24,39,0.2) 0%, rgba(17,24,39,0.7) 55%, rgba(17,24,39,1) 85%)' : 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 55%, rgba(255,255,255,1) 85%)' }"
                />

                <!-- Content (z-10 above bg) -->
                <div class="relative z-10 w-full flex flex-col items-center gap-1.5">
                  <!-- Username (TOP) -->
                  <router-link
                    :to="`/profile/${post.author?.username}`"
                    class="font-bold text-sm hover:underline block truncate max-w-full text-center"
                    :style="{ color: post.author?.group_color || undefined }"
                    :class="!post.author?.group_color ? (isDark ? 'text-gray-100' : 'text-gray-900') : ''"
                  >
                    {{ post.author?.username }}
                  </router-link>

                  <!-- Group badge -->
                  <div
                    v-if="post.author?.group_label"
                    class="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    :style="{
                      backgroundColor: (post.author?.group_color || '#6b7280') + '22',
                      color: post.author?.group_color || '#6b7280',
                    }"
                  >
                    {{ post.author?.group_label }}
                  </div>

                  <!-- Square avatar (larger, rounded-lg not rounded-full) -->
                  <div class="mt-1.5 w-20 h-20 rounded-lg overflow-hidden shrink-0 ring-2 ring-offset-1"
                       :class="isDark ? 'ring-gray-700 ring-offset-gray-900' : 'ring-gray-200 ring-offset-white'"
                  >
                    <img
                      v-if="post.author?.avatar_url"
                      :src="post.author.avatar_url"
                      class="w-full h-full object-cover"
                      :alt="post.author?.username"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                      :style="{ backgroundColor: post.author?.avatar_color || '#7c3aed' }"
                    >
                      {{ post.author?.username?.charAt(0)?.toUpperCase() }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Divider + stats section -->
              <div class="hidden sm:block px-3 pb-3 flex flex-col gap-1.5">
                <div class="w-full border-t mb-1" :class="isDark ? 'border-gray-700/60' : 'border-gray-100'" />
                <div class="flex flex-col w-full gap-1.5">
                  <div class="flex items-center gap-1.5 text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    <i class="fa-solid fa-calendar-days w-3 text-center opacity-70" />
                    <span class="truncate">{{ formatJoinDate(post.author?.created_at) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    <span class="flex items-center gap-1.5">
                      <i class="fa-solid fa-pen-to-square w-3 text-center opacity-70" />
                      Posts
                    </span>
                    <span class="font-semibold" :class="isDark ? 'text-gray-300' : 'text-gray-600'">{{ (post.author?.post_count ?? 0).toLocaleString() }}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    <span class="flex items-center gap-1.5">
                      <i class="fa-solid fa-coins w-3 text-center opacity-70" />
                      Credits
                    </span>
                    <span class="font-semibold text-purple-accent">{{ (post.author?.credits ?? 0).toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Awards -->
                <div
                  v-if="post.author?.awards?.length"
                  class="flex flex-wrap justify-center gap-1 mt-2 pt-2 border-t w-full"
                  :class="isDark ? 'border-gray-700/60' : 'border-gray-100'"
                >
                  <template v-for="award in post.author.awards.slice(0, 6)" :key="award.id">
                    <img v-if="award.icon_url" :src="award.icon_url" class="w-5 h-5 object-contain" :title="award.name" />
                  </template>
                </div>
              </div>
            </div>

            <!-- Post content -->
            <div class="flex-1 p-5 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    {{ formatDateTime(post.created_at) }}
                  </span>
                  <span
                    v-if="post.edited_at"
                    class="text-xs italic"
                    :class="isDark ? 'text-gray-600' : 'text-gray-400'"
                  >
                    {{ formatEditedTime(post.edited_at) }}
                  </span>
                </div>
                <div />
              </div>

              <!-- Editing mode -->
              <template v-if="editingPostId === post.id">
                <div v-if="isFirstPost(post)" class="mb-3">
                  <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Thread Title</label>
                  <input
                    v-model="editTitle"
                    type="text"
                    class="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
                    :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
                  />
                </div>
                <MarkdownEditor
                  v-model="editBody"
                  placeholder="Edit your post..."
                  :rows="6"
                />
                <div class="flex items-center gap-2 mt-3">
                  <button
                    @click="saveEdit(post)"
                    :disabled="editSaving"
                    class="px-4 py-2 bg-purple-accent hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {{ editSaving ? 'Saving...' : 'Save' }}
                  </button>
                  <button
                    @click="cancelEditing"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
                  >
                    Cancel
                  </button>
                </div>
              </template>

              <!-- Display mode -->
              <template v-else>
                <MarkdownRenderer :content="post.body" :rendered-content="post.rendered_content" />
              </template>

              <!-- Post footer — always anchored at bottom -->
              <div class="mt-auto pt-3 border-t flex items-center justify-between gap-3" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <!-- Left: Like -->
                <button
                  v-if="authStore.isLoggedIn"
                  @click="togglePostLike(post)"
                  class="flex items-center gap-1.5 text-sm transition-colors"
                  :class="post.is_liked_by_me ? 'text-pink-400' : isDark ? 'text-gray-500 hover:text-pink-400' : 'text-gray-400 hover:text-pink-400'"
                >
                  <i :class="post.is_liked_by_me ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
                  <span v-if="post.like_count > 0" class="text-xs">{{ post.like_count }} {{ post.like_count === 1 ? 'like' : 'likes' }}</span>
                </button>
                <div v-else />

                <!-- Right: Edit / Delete / Report -->
                <div class="flex items-center gap-1">
                  <button
                    v-if="canEdit(post)"
                    @click="startEditing(post)"
                    class="text-xs px-2 py-1 rounded transition-colors"
                    :class="isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
                    title="Edit"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    v-if="authStore.isModerator"
                    @click="handleDeletePost(post)"
                    :disabled="modActionLoading === 'delete-post-' + post.id"
                    class="text-xs px-2 py-1 rounded transition-colors text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    :title="isFirstPost(post) ? 'Delete thread' : 'Delete post'"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                  <button
                    v-if="authStore.isLoggedIn && authStore.user?.id !== post.user_id"
                    @click="openReportModal(post.id)"
                    class="text-xs px-2 py-1 rounded transition-colors"
                    :class="isDark ? 'text-gray-600 hover:text-orange-400 hover:bg-gray-800' : 'text-gray-300 hover:text-orange-500 hover:bg-gray-100'"
                    title="Report"
                  >
                    <i class="fa-solid fa-flag"></i>
                  </button>
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
        <template v-if="thread.is_locked && !authStore.isModerator">
          <p class="text-center py-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            <i class="fa-solid fa-lock mr-1"></i> This thread is locked. No new replies can be posted.
          </p>
        </template>
        <template v-else-if="authStore.isLoggedIn">
          <h3 class="font-semibold mb-3">Reply to this thread</h3>
          <div
            v-if="replyError"
            class="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {{ replyError }}
          </div>
          <MarkdownEditor
            v-model="replyText"
            placeholder="Write your reply... Use @ to mention users"
            :rows="5"
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

    <!-- Report Modal -->
    <Teleport to="body">
      <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showReportModal = false"></div>
        <div class="relative w-full max-w-md rounded-xl p-6 shadow-xl" :class="isDark ? 'bg-gray-800' : 'bg-white'">
          <h3 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">Report Post</h3>
          <textarea
            v-model="reportReason"
            rows="4"
            maxlength="500"
            placeholder="Describe the reason for reporting this post..."
            class="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
            :class="isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          ></textarea>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ reportReason.length }}/500</span>
            <div class="flex gap-2">
              <button
                @click="showReportModal = false"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                Cancel
              </button>
              <button
                @click="submitReport"
                :disabled="reportSubmitting || !reportReason.trim()"
                class="px-4 py-2 bg-purple-accent hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {{ reportSubmitting ? 'Submitting...' : 'Submit Report' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

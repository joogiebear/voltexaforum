<script setup>
import { inject, ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessagesStore } from '../stores/messages'
import { useAuthStore } from '../stores/auth'
import UserAvatar from '../components/UserAvatar.vue'
import ComposeModal from '../components/ComposeModal.vue'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const messagesStore = useMessagesStore()
const authStore = useAuthStore()

const showCompose = ref(false)
const messageInput = ref('')
const sending = ref(false)
const messagesContainer = ref(null)

onMounted(async () => {
  await messagesStore.fetchConversations()
  if (route.params.id) {
    await messagesStore.fetchConversation(route.params.id)
    scrollToBottom()
  }
})

watch(() => route.params.id, async (id) => {
  if (id) {
    await messagesStore.fetchConversation(id)
    scrollToBottom()
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const activeConvo = computed(() => {
  return messagesStore.conversations.find(c => c.id === Number(route.params.id))
})

const otherUser = computed(() => {
  if (!activeConvo.value) return null
  return activeConvo.value.other_user || null
})

async function handleSend() {
  if (!messageInput.value.trim() || sending.value) return
  sending.value = true
  const success = await messagesStore.sendMsg(route.params.id, messageInput.value.trim())
  if (success) {
    messageInput.value = ''
    scrollToBottom()
  }
  sending.value = false
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function selectConversation(convo) {
  router.push('/messages/' + convo.id)
}

function isOwnMessage(msg) {
  return msg.sender_id === authStore.user?.id
}

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

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function daySeparator(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function shouldShowDaySeparator(messages, index) {
  if (index === 0) return true
  const prev = new Date(messages[index - 1].created_at).toDateString()
  const curr = new Date(messages[index].created_at).toDateString()
  return prev !== curr
}

function getOtherParticipant(convo) {
  return convo.other_user || {}
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Messages</h1>
      <button
        @click="showCompose = true"
        class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-accent hover:bg-purple-700 transition-colors"
      >
        + New Message
      </button>
    </div>

    <div
      class="rounded-xl border overflow-hidden flex"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      style="height: 70vh;"
    >
      <!-- Left: Conversation list -->
      <div
        class="w-full sm:w-80 shrink-0 border-r overflow-y-auto"
        :class="[
          isDark ? 'border-gray-700' : 'border-gray-200',
          route.params.id ? 'hidden sm:block' : ''
        ]"
      >
        <div v-if="messagesStore.error && !messagesStore.loading" class="p-6 text-center">
          <i class="fa-solid fa-triangle-exclamation text-3xl text-red-400"></i>
          <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ messagesStore.error }}</p>
          <button
            @click="messagesStore.fetchConversations()"
            class="mt-3 px-4 py-2 bg-purple-accent hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>

        <div v-else-if="messagesStore.loading" class="p-4 space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 animate-pulse">
            <div class="w-10 h-10 rounded-full shrink-0" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
            <div class="flex-1 space-y-2">
              <div class="h-3 rounded w-24" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
              <div class="h-2.5 rounded w-32" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
            </div>
          </div>
        </div>

        <div v-else-if="messagesStore.conversations.length === 0" class="p-6 text-center">
          <i class="fa-solid fa-comments text-3xl text-gray-400"></i>
          <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No conversations yet</p>
        </div>

        <button
          v-for="convo in messagesStore.conversations"
          :key="convo.id"
          @click="selectConversation(convo)"
          class="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b last:border-b-0"
          :class="[
            isDark ? 'border-gray-700' : 'border-gray-100',
            Number(route.params.id) === convo.id
              ? (isDark ? 'bg-purple-accent/10' : 'bg-purple-50')
              : (isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50')
          ]"
        >
          <UserAvatar
            :name="getOtherParticipant(convo).username || '?'"
            :color="getOtherParticipant(convo).avatar_color || '#7c3aed'"
            :avatarUrl="getOtherParticipant(convo).avatar_url || null"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold truncate" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ getOtherParticipant(convo).username || 'Unknown' }}
              </p>
              <span class="text-xs shrink-0 ml-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ timeAgo(convo.updated_at || convo.last_message?.created_at) }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <p class="text-xs truncate" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ convo.last_message?.body || 'No messages yet' }}
              </p>
              <span
                v-if="convo.unread_count > 0"
                class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none ml-2 shrink-0"
              >
                {{ convo.unread_count }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- Right: Messages -->
      <div class="flex-1 flex flex-col" :class="!route.params.id ? 'hidden sm:flex' : 'flex'">
        <!-- No conversation selected -->
        <div
          v-if="!route.params.id"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center">
            <i class="fa-solid fa-comments text-4xl text-gray-400"></i>
            <p class="text-sm mt-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Select a conversation to start messaging
            </p>
          </div>
        </div>

        <template v-else>
          <!-- Conversation header -->
          <div
            class="flex items-center gap-3 px-4 py-3 border-b shrink-0"
            :class="isDark ? 'border-gray-700' : 'border-gray-200'"
          >
            <button
              class="sm:hidden p-1.5 rounded-lg transition-colors"
              :class="isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'"
              @click="router.push('/messages')"
            >
              ←
            </button>
            <UserAvatar
              v-if="otherUser"
              :name="otherUser.username || '?'"
              :color="otherUser.avatar_color || '#7c3aed'"
              :avatarUrl="otherUser.avatar_url || null"
              size="sm"
            />
            <div>
              <p class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ otherUser?.username || 'User' }}
              </p>
            </div>
          </div>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-4 py-4 space-y-1"
          >
            <template v-for="(msg, idx) in messagesStore.messages" :key="msg.id || idx">
              <!-- Day separator -->
              <div
                v-if="shouldShowDaySeparator(messagesStore.messages, idx)"
                class="flex items-center gap-3 my-4"
              >
                <div class="flex-1 h-px" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
                <span class="text-xs font-medium px-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ daySeparator(msg.created_at) }}
                </span>
                <div class="flex-1 h-px" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'" />
              </div>

              <!-- Message bubble -->
              <div :class="isOwnMessage(msg) ? 'flex justify-end' : 'flex justify-start'">
                <div class="flex items-end gap-2 max-w-[75%]">
                  <UserAvatar
                    v-if="!isOwnMessage(msg) && otherUser"
                    :name="otherUser.username || '?'"
                    :color="otherUser.avatar_color || '#7c3aed'"
                    :avatarUrl="otherUser.avatar_url || null"
                    size="sm"
                    class="shrink-0 mb-1"
                  />
                  <div>
                    <div
                      class="px-3.5 py-2 rounded-2xl text-sm"
                      :class="isOwnMessage(msg)
                        ? 'bg-purple-accent text-white rounded-br-md'
                        : isDark
                          ? 'bg-gray-700 text-gray-100 rounded-bl-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'"
                    >
                      {{ msg.body }}
                    </div>
                    <p
                      class="text-xs mt-0.5 px-1"
                      :class="[
                        isDark ? 'text-gray-500' : 'text-gray-400',
                        isOwnMessage(msg) ? 'text-right' : ''
                      ]"
                    >
                      {{ formatTime(msg.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Empty conversation -->
            <div
              v-if="messagesStore.messages.length === 0"
              class="flex-1 flex items-center justify-center py-12"
            >
              <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                No messages yet. Say hello!
              </p>
            </div>
          </div>

          <!-- Input -->
          <div
            class="px-4 py-3 border-t shrink-0"
            :class="isDark ? 'border-gray-700' : 'border-gray-200'"
          >
            <div class="flex items-end gap-2">
              <textarea
                v-model="messageInput"
                @keydown="handleKeydown"
                rows="1"
                placeholder="Type a message..."
                class="flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none"
                :class="isDark
                  ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-accent'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-accent'"
              />
              <button
                @click="handleSend"
                :disabled="!messageInput.trim() || sending"
                class="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {{ sending ? '...' : 'Send' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Compose Modal -->
    <ComposeModal v-if="showCompose" @close="showCompose = false" />
  </div>
</template>

import { defineStore } from 'pinia'
import {
  getConversations,
  getConversation,
  sendMessage,
  getDMUnreadCount,
} from '../services/api'

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    conversations: [],
    activeConversationId: null,
    messages: [],
    dmUnreadCount: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchConversations() {
      this.loading = true
      this.error = null
      try {
        const res = await getConversations()
        this.conversations = res.data.data || []
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to load conversations'
      } finally {
        this.loading = false
      }
    },
    async fetchConversation(id) {
      this.activeConversationId = id
      try {
        const res = await getConversation(id)
        const raw = res.data.data
        // API returns messages array directly (sorted newest first — reverse for chat order)
        this.messages = (Array.isArray(raw) ? [...raw].reverse() : raw?.messages || [])
        // Update conversation in list to clear unread
        const convo = this.conversations.find(c => c.id === Number(id))
        if (convo) convo.unread_count = 0
      } catch {
        // silent
      }
    },
    async sendMsg(id, body) {
      try {
        const res = await sendMessage(id, body)
        this.messages.push(res.data.data)
        // Update last message in conversation list
        const convo = this.conversations.find(c => c.id === Number(id))
        if (convo) {
          convo.last_message = res.data.data
          convo.updated_at = new Date().toISOString()
        }
        return true
      } catch {
        return false
      }
    },
    async fetchUnreadCount() {
      try {
        const res = await getDMUnreadCount()
        this.dmUnreadCount = res.data.data?.count || 0
      } catch {
        // silent
      }
    },
  },
})

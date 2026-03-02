import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { useMessagesStore } from './stores/messages'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const init = async () => {
  const authStore = useAuthStore()
  if (authStore.token) {
    await authStore.fetchUser()
  }

  app.mount('#app')

  // Setup real-time after mount if user is logged in
  if (authStore.isLoggedIn) {
    const notifStore = useNotificationsStore()
    const messagesStore = useMessagesStore()

    // Fetch initial data
    notifStore.fetchNotifications()
    messagesStore.fetchUnreadCount()

    // Setup Echo for real-time
    try {
      const { default: echo } = await import('./echo.js')

      echo.private(`user.${authStore.user.id}`)
        .listen('.NewNotification', (e) => {
          notifStore.pushNew(e.notification || e)
        })
        .listen('.NewMessage', (e) => {
          messagesStore.fetchUnreadCount()
          // If viewing the same conversation, re-fetch messages
          if (messagesStore.activeConversationId && String(messagesStore.activeConversationId) === String(e.conversation_id)) {
            messagesStore.fetchConversation(e.conversation_id)
          }
        })

      echo.join('online')
    } catch {
      // Echo not available — websocket server may not be running
    }
  }
}

init()

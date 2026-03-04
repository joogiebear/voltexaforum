import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { useMessagesStore } from './stores/messages'
import { usePresenceStore } from './stores/presence'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: { darkModeSelector: '.dark' }
  }
})

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
    const presenceStore = usePresenceStore()

    // Fetch initial data
    notifStore.fetchNotifications()
    messagesStore.fetchUnreadCount()
    presenceStore.fetchOnlineUsers()

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
        .here((users) => presenceStore.setOnlineUsers(users))
        .joining((user) => presenceStore.addUser(user))
        .leaving((user) => presenceStore.removeUser(user))
    } catch {
      // Echo not available — websocket server may not be running
    }
  }
}

init()

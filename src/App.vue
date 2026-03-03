<script setup>
import { provide, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useForumStore } from './stores/forum'
import { getCustomCode } from './services/api'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AppToast from './components/AppToast.vue'
import AnnouncementBanner from './components/AnnouncementBanner.vue'

const route = useRoute()
const { isDark, toggle } = useTheme()
const forumStore = useForumStore()
provide('isDark', isDark)
provide('toggleTheme', toggle)

const isAdmin = computed(() => route.path.startsWith('/admin'))

async function injectCustomCode() {
  try {
    const res = await getCustomCode()
    const data = res.data.data || res.data
    if (data.custom_css) {
      const existing = document.getElementById('vh-custom-css')
      if (existing) existing.remove()
      const style = document.createElement('style')
      style.id = 'vh-custom-css'
      style.textContent = data.custom_css
      document.head.appendChild(style)
    }
    if (data.custom_js) {
      const existing = document.getElementById('vh-custom-js')
      if (existing) existing.remove()
      const script = document.createElement('script')
      script.id = 'vh-custom-js'
      script.textContent = data.custom_js
      document.body.appendChild(script)
    }
  } catch {}
}

// Load forum config once on app boot — makes it available on any page/refresh
onMounted(() => {
  forumStore.fetchConfig()
  injectCustomCode()
})

// Apply accent color from config dynamically
watch(() => forumStore.config?.accent_color, (color) => {
  if (color) document.documentElement.style.setProperty('--color-purple-accent', color)
}, { immediate: true })
</script>

<template>
  <div
    v-if="isAdmin"
    class="min-h-screen bg-gray-900 text-white"
  >
    <RouterView />
  </div>
  <div
    v-else
    class="min-h-screen transition-colors duration-300"
    :class="isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900 light'"
  >
    <AppHeader />
    <AnnouncementBanner />
    <RouterView />
    <AppFooter />
  </div>
  <AppToast />
</template>

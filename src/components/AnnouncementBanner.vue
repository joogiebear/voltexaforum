<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements } from '../services/api'

const announcements = ref([])
const dismissed = ref(new Set())

const typeConfig = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    text: 'text-blue-300',
    icon: 'fa-solid fa-bullhorn',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    text: 'text-amber-300',
    icon: 'fa-solid fa-triangle-exclamation',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    text: 'text-green-300',
    icon: 'fa-solid fa-circle-check',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    text: 'text-red-300',
    icon: 'fa-solid fa-circle-exclamation',
  },
}

function loadDismissed() {
  try {
    const stored = sessionStorage.getItem('dismissed_announcements')
    if (stored) {
      dismissed.value = new Set(JSON.parse(stored))
    }
  } catch {
    // ignore
  }
}

function dismiss(id) {
  dismissed.value.add(id)
  try {
    sessionStorage.setItem('dismissed_announcements', JSON.stringify([...dismissed.value]))
  } catch {
    // ignore
  }
}

function getConfig(type) {
  return typeConfig[type] || typeConfig.info
}

onMounted(async () => {
  loadDismissed()
  try {
    const { data } = await getAnnouncements()
    announcements.value = data.data || []
  } catch {
    // fail silently
  }
})
</script>

<template>
  <div v-if="announcements.length" class="w-full">
    <div
      v-for="a in announcements"
      v-show="!dismissed.has(a.id)"
      :key="a.id"
      class="border-l-4 px-4 py-3 flex items-center gap-3"
      :class="[getConfig(a.type).bg, getConfig(a.type).border]"
    >
      <i :class="[getConfig(a.type).icon, getConfig(a.type).text]" class="text-sm flex-shrink-0"></i>
      <span class="text-sm flex-1" :class="getConfig(a.type).text">{{ a.text }}</span>
      <button
        class="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        @click="dismiss(a.id)"
      >
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  </div>
</template>

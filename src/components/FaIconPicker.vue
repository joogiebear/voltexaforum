<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search icons...' },
})

const emit = defineEmits(['update:modelValue'])

const search = ref('')

const icons = [
  'fa-comment', 'fa-comments', 'fa-message', 'fa-envelope', 'fa-bell', 'fa-star', 'fa-heart', 'fa-thumbs-up', 'fa-flag',
  'fa-shield-halved', 'fa-shield', 'fa-lock', 'fa-unlock', 'fa-key', 'fa-user', 'fa-users', 'fa-user-group', 'fa-user-shield',
  'fa-crown', 'fa-medal', 'fa-trophy', 'fa-award', 'fa-certificate',
  'fa-gamepad', 'fa-dice', 'fa-chess', 'fa-puzzle-piece', 'fa-dragon', 'fa-wand-magic-sparkles',
  'fa-code', 'fa-code-branch', 'fa-terminal', 'fa-bug', 'fa-wrench', 'fa-gear', 'fa-gears', 'fa-screwdriver-wrench',
  'fa-book', 'fa-book-open', 'fa-bookmark', 'fa-scroll', 'fa-newspaper', 'fa-file-lines',
  'fa-lightbulb', 'fa-fire', 'fa-bolt', 'fa-rocket', 'fa-satellite', 'fa-globe',
  'fa-map', 'fa-compass', 'fa-location-dot', 'fa-mountain', 'fa-tree', 'fa-leaf',
  'fa-music', 'fa-headphones', 'fa-microphone', 'fa-video', 'fa-camera', 'fa-image', 'fa-palette',
  'fa-magnifying-glass', 'fa-filter', 'fa-list', 'fa-table-cells', 'fa-chart-bar', 'fa-chart-line',
  'fa-home', 'fa-building', 'fa-shop', 'fa-store', 'fa-warehouse', 'fa-city',
  'fa-car', 'fa-plane', 'fa-ship', 'fa-bicycle', 'fa-bus',
  'fa-sun', 'fa-moon', 'fa-cloud', 'fa-snowflake', 'fa-rainbow',
  'fa-pizza-slice', 'fa-coffee', 'fa-mug-hot', 'fa-burger', 'fa-apple-whole',
  'fa-robot', 'fa-brain', 'fa-eye', 'fa-hand', 'fa-handshake', 'fa-peace',
  'fa-exclamation', 'fa-question', 'fa-info', 'fa-circle-check', 'fa-circle-xmark',
  'fa-plus', 'fa-minus', 'fa-xmark', 'fa-check', 'fa-arrow-right', 'fa-arrow-up',
  'fa-bullhorn', 'fa-rss', 'fa-share-nodes', 'fa-link',
  'fa-trash', 'fa-pen', 'fa-pencil', 'fa-scissors', 'fa-paperclip',
  'fa-wallet', 'fa-coins', 'fa-dollar-sign', 'fa-credit-card', 'fa-gem',
  'fa-chart-pie', 'fa-percent', 'fa-hashtag', 'fa-at',
  'fa-door-open', 'fa-door-closed', 'fa-window-maximize', 'fa-desktop', 'fa-mobile',
  'fa-gavel', 'fa-scale-balanced', 'fa-handcuffs',
  'fa-ghost', 'fa-skull', 'fa-spider', 'fa-hat-wizard',
]

const filteredIcons = computed(() => {
  if (!search.value) return icons
  const q = search.value.toLowerCase()
  return icons.filter((name) => name.includes(q))
})

function fullClass(iconName) {
  return 'fa-solid ' + iconName
}

function select(iconName) {
  emit('update:modelValue', fullClass(iconName))
}

function iconNameFromClass(cls) {
  return cls ? cls.replace('fa-solid ', '').replace('fa-regular ', '').replace('fa-brands ', '') : ''
}
</script>

<template>
  <div class="space-y-3">
    <!-- Preview -->
    <div class="flex flex-col items-center gap-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
      <i v-if="modelValue" :class="modelValue" class="text-4xl text-violet-400"></i>
      <i v-else class="fa-solid fa-comment text-4xl text-gray-600"></i>
      <span class="text-xs text-gray-500 font-mono">{{ modelValue || 'No icon selected' }}</span>
    </div>

    <!-- Search -->
    <input
      v-model="search"
      type="text"
      :placeholder="placeholder"
      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
    />

    <!-- Icon grid -->
    <div class="max-h-52 overflow-y-auto rounded-lg border border-gray-700/50 bg-gray-900/30 p-2">
      <div class="grid grid-cols-6 gap-1">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          type="button"
          @click="select(icon)"
          class="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-pointer"
          :class="modelValue === fullClass(icon)
            ? 'bg-violet-600/30 border border-violet-500/50 text-violet-300'
            : 'hover:bg-gray-700/50 text-gray-400 border border-transparent'"
        >
          <i :class="fullClass(icon)" class="text-lg"></i>
          <span class="text-[9px] leading-tight truncate w-full text-center text-gray-500">{{ icon.replace('fa-', '') }}</span>
        </button>
      </div>
      <div v-if="!filteredIcons.length" class="py-4 text-center text-sm text-gray-500">
        No icons match "{{ search }}"
      </div>
    </div>
  </div>
</template>

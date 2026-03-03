<script setup>
import { computed } from 'vue'
import { useForumStore } from '../stores/forum'

defineProps({ isDark: Boolean })

const forumStore = useForumStore()

const show = computed(() => forumStore.config?.show_usergroup_legend === 'true')

const groups = computed(() => {
  try {
    const raw = forumStore.config?.usergroup_legend_groups
    return raw ? JSON.parse(raw) : ['admin', 'moderator', 'vip', 'elite', 'member']
  } catch {
    return ['admin', 'moderator', 'vip', 'elite', 'member']
  }
})

function groupColor(role) {
  return forumStore.config?.[`group_color_${role}`] || '#6b7280'
}

function groupLabel(role) {
  return forumStore.config?.[`group_label_${role}`] || role.charAt(0).toUpperCase() + role.slice(1)
}
</script>

<template>
  <div
    v-if="show"
    class="rounded-xl p-4 transition-colors duration-300"
    :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
  >
    <div class="flex items-center gap-4 flex-wrap">
      <span
        class="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
        :class="isDark ? 'text-gray-400' : 'text-gray-500'"
      >
        <i class="fa-solid fa-users"></i>
        Groups
      </span>
      <div class="flex items-center gap-4 flex-wrap">
        <div v-for="role in groups" :key="role" class="flex items-center gap-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: groupColor(role) }"
          ></span>
          <span class="text-sm font-medium" :style="{ color: groupColor(role) }">
            {{ groupLabel(role) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

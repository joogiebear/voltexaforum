<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const settings = ref({
  forum_name: 'My Forum',
  accent_color: '#7c3aed',
  maintenance_mode: false,
  multi_game: false,
  show_usergroup_legend: false,
})

async function fetchConfig() {
  loading.value = true
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    if (d.forum) Object.assign(settings.value, d.forum)
    if (d.forum_name) settings.value.forum_name = d.forum_name
    if (d.multi_game !== undefined) settings.value.multi_game = d.multi_game === true || d.multi_game === 'true'
    if (d.accent_color) settings.value.accent_color = d.accent_color
    if (d.maintenance_mode !== undefined) settings.value.maintenance_mode = d.maintenance_mode === true || d.maintenance_mode === 'true'
    if (d.show_usergroup_legend !== undefined) settings.value.show_usergroup_legend = d.show_usergroup_legend === true || d.show_usergroup_legend === 'true'
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminConfig({ config: settings.value })
    toast.show('General settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfig)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-40"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">General Settings</h3>
          <button @click="save" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Forum Name</label>
            <input v-model="settings.forum_name" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Accent Color</label>
            <div class="flex items-center gap-3">
              <input v-model="settings.accent_color" type="text" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
              <div class="w-9 h-9 rounded-lg border border-gray-600 shrink-0" :style="{ backgroundColor: settings.accent_color }" />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-gray-300">Maintenance Mode</div>
              <div class="text-xs text-gray-500 mt-0.5">Only admins can access the forum when enabled</div>
            </div>
            <button
              @click="settings.maintenance_mode = !settings.maintenance_mode"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-gray-300">Multi-game Mode</div>
              <div class="text-xs text-gray-500 mt-0.5">Enabling this shows game selector and groups forums by game</div>
            </div>
            <button
              @click="settings.multi_game = !settings.multi_game"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="settings.multi_game ? 'bg-violet-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.multi_game ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-gray-300">Show Usergroup Legend</div>
              <div class="text-xs text-gray-500 mt-0.5">Display the usergroup color legend on the home page</div>
            </div>
            <button
              @click="settings.show_usergroup_legend = !settings.show_usergroup_legend"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="settings.show_usergroup_legend ? 'bg-violet-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.show_usergroup_legend ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

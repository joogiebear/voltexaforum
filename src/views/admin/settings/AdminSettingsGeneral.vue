<script setup>
import { ref, onMounted, watch } from 'vue'
import { getAdminConfig, updateAdminConfig, uploadLogo, removeLogo } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'
import { useForumStore } from '../../../stores/forum'

const toast = useToastStore()
const forumStore = useForumStore()
const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const removingLogo = ref(false)

const settings = ref({
  forum_name: 'My Forum',
  accent_color: '#7c3aed',
  maintenance_mode: false,
  multi_game: false,
  show_usergroup_legend: false,
})

const logoType = ref('both')
const logoIcon = ref('fa-solid fa-bolt')
const logoIconColor = ref('#7c3aed')
const logoImage = ref('')

const logoTypes = [
  { value: 'both', label: 'Icon + Text' },
  { value: 'icon_only', label: 'Icon Only' },
  { value: 'text_only', label: 'Text Only' },
  { value: 'image', label: 'Custom Image' },
]

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

    // Logo settings
    if (d.logo_type) logoType.value = d.logo_type
    if (d.logo_icon) logoIcon.value = d.logo_icon
    if (d.logo_icon_color) logoIconColor.value = d.logo_icon_color
    if (d.logo_image) logoImage.value = d.logo_image
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function saveLogoSettings() {
  try {
    await updateAdminConfig({
      config: {
        logo_type: logoType.value,
        logo_icon: logoIcon.value,
        logo_icon_color: logoIconColor.value,
      },
    })
    forumStore.fetchConfig()
    toast.show('Logo settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save logo settings', 'error')
  }
}

// Auto-save logo type on change
watch(logoType, () => {
  saveLogoSettings()
})

async function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.show('File must be under 2MB', 'error')
    return
  }

  uploadingLogo.value = true
  try {
    const formData = new FormData()
    formData.append('logo', file)
    const res = await uploadLogo(formData)
    logoImage.value = res.data.data.logo_image
    forumStore.fetchConfig()
    toast.show('Logo uploaded')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to upload logo', 'error')
  } finally {
    uploadingLogo.value = false
    event.target.value = ''
  }
}

async function handleRemoveLogo() {
  removingLogo.value = true
  try {
    await removeLogo()
    logoImage.value = ''
    forumStore.fetchConfig()
    toast.show('Logo removed')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to remove logo', 'error')
  } finally {
    removingLogo.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminConfig({
      config: {
        ...settings.value,
        logo_type: logoType.value,
        logo_icon: logoIcon.value,
        logo_icon_color: logoIconColor.value,
      },
    })
    forumStore.fetchConfig()
    toast.show('General settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}



onMounted(() => {
  fetchConfig()
  fetchUnlockReqs()
})
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
      <!-- Logo Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <h3 class="text-base font-semibold text-white">Logo</h3>

        <!-- Logo Type Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Logo Type</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in logoTypes"
              :key="t.value"
              @click="logoType = t.value"
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
              :class="logoType === t.value
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- Icon + Color settings (shown for both / icon_only) -->
        <template v-if="logoType === 'both' || logoType === 'icon_only'">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Icon Class</label>
              <input
                v-model="logoIcon"
                type="text"
                placeholder="fa-solid fa-bolt"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono"
              />
              <!-- Live icon preview -->
              <div class="mt-2 flex items-center gap-2 text-gray-400 text-xs">
                <i :class="logoIcon" class="text-lg" :style="{ color: logoIconColor }"></i>
                <span>Preview</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Icon Color</label>
              <div class="flex items-center gap-3">
                <input
                  v-model="logoIconColor"
                  type="text"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono"
                />
                <input
                  v-model="logoIconColor"
                  type="color"
                  class="w-9 h-9 rounded-lg border border-gray-600 shrink-0 cursor-pointer bg-transparent p-0.5"
                />
              </div>
            </div>
          </div>
          <button
            @click="saveLogoSettings"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save Icon Settings
          </button>
        </template>

        <!-- Custom Image upload (shown for image type) -->
        <template v-if="logoType === 'image'">
          <div class="space-y-3">
            <!-- Current logo preview -->
            <div v-if="logoImage" class="flex items-center gap-4">
              <img :src="logoImage" alt="Current logo" class="h-10 w-auto object-contain rounded bg-gray-700/50 p-1" />
              <button
                @click="handleRemoveLogo"
                :disabled="removingLogo"
                class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {{ removingLogo ? 'Removing...' : 'Remove' }}
              </button>
            </div>

            <!-- Upload zone -->
            <label
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
              :class="uploadingLogo
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/30 hover:bg-gray-700/50'"
            >
              <div class="flex flex-col items-center text-gray-400">
                <i v-if="uploadingLogo" class="fa-solid fa-spinner fa-spin text-xl text-violet-400 mb-2"></i>
                <i v-else class="fa-solid fa-cloud-arrow-up text-xl mb-2"></i>
                <span class="text-sm font-medium">{{ uploadingLogo ? 'Uploading...' : 'Click to upload logo' }}</span>
                <span class="text-xs text-gray-500 mt-1">PNG, JPG, SVG, WEBP &mdash; max 2MB</span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                class="hidden"
                :disabled="uploadingLogo"
                @change="handleLogoUpload"
              />
            </label>
          </div>
        </template>
      </div>

      <!-- General Settings -->
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

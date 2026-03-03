<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const activeTab = ref('css')

const customCss = ref('')
const customJs = ref('')

async function fetchConfig() {
  loading.value = true
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    customCss.value = d.custom_css || d.forum?.custom_css || ''
    customJs.value = d.custom_js || d.forum?.custom_js || ''
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminConfig({
      config: {
        custom_css: customCss.value,
        custom_js: customJs.value,
      },
    })
    toast.show('Custom code saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfig)
</script>

<template>
  <div class="space-y-6">
    <template v-if="loading">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-40"></div>
        <div class="h-48 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Custom CSS / JS</h3>
          <button @click="save" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-700">
          <button
            @click="activeTab = 'css'"
            class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === 'css' ? 'text-violet-400 border-violet-400' : 'text-gray-500 border-transparent hover:text-gray-300'"
          >
            <i class="fa-brands fa-css3-alt mr-1.5"></i>Custom CSS
          </button>
          <button
            @click="activeTab = 'js'"
            class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === 'js' ? 'text-violet-400 border-violet-400' : 'text-gray-500 border-transparent hover:text-gray-300'"
          >
            <i class="fa-brands fa-js mr-1.5"></i>Custom JS
          </button>
        </div>

        <!-- CSS panel -->
        <div v-show="activeTab === 'css'">
          <textarea
            v-model="customCss"
            rows="16"
            placeholder="/* Add your custom CSS here */&#10;&#10;body {&#10;  /* Your styles */&#10;}"
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono leading-relaxed resize-y"
          ></textarea>
        </div>

        <!-- JS panel -->
        <div v-show="activeTab === 'js'">
          <textarea
            v-model="customJs"
            rows="16"
            placeholder="// Add your custom JavaScript here&#10;&#10;document.addEventListener('DOMContentLoaded', () => {&#10;  // Your code&#10;});"
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono leading-relaxed resize-y"
          ></textarea>
        </div>

        <p class="text-xs text-gray-500"><i class="fa-solid fa-circle-info mr-1"></i>Custom code is injected on every page. Be careful with JavaScript to avoid breaking the site.</p>
      </div>
    </template>
  </div>
</template>

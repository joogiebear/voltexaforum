<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const storeSettings = ref({
  stripe_publishable: '',
  stripe_secret: '',
  store_enabled: true,
  currency: 'USD',
})

async function fetchConfig() {
  loading.value = true
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    if (d.store) Object.assign(storeSettings.value, d.store)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminConfig({ config: storeSettings.value })
    toast.show('Store settings saved')
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
          <h3 class="text-base font-semibold text-white">Store Settings</h3>
          <button @click="save" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Store Enabled</div>
            <div class="text-xs text-gray-500 mt-0.5">Toggle the store on or off for all users</div>
          </div>
          <button
            @click="storeSettings.store_enabled = !storeSettings.store_enabled"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="storeSettings.store_enabled ? 'bg-violet-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="storeSettings.store_enabled ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Stripe Publishable Key</label>
            <input v-model="storeSettings.stripe_publishable" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Stripe Secret Key</label>
            <input v-model="storeSettings.stripe_secret" type="password" placeholder="sk_live_..." class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Currency</label>
            <select v-model="storeSettings.currency" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

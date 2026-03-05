<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig, getPaymentProviders, updatePaymentProvider } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const storeSettings = ref({
  store_enabled: true,
  currency: 'USD',
})

const providers = ref({})
const configModal = ref(null) // provider key or null
const modalForm = ref({})
const modalSaving = ref(false)

const providerMeta = {
  stripe: {
    name: 'Stripe',
    icon: 'fa-brands fa-stripe',
    color: '#635bff',
    description: 'Credit card payments via Stripe',
    fields: [
      { key: 'public_key', label: 'Public Key', type: 'text' },
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle' },
    ],
  },
  paypal: {
    name: 'PayPal',
    icon: 'fa-brands fa-paypal',
    color: '#003087',
    description: 'PayPal checkout integration',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', type: 'password' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle' },
    ],
  },
  coinbase: {
    name: 'Coinbase Commerce',
    icon: 'fa-solid fa-bitcoin-sign',
    color: '#0052ff',
    description: 'Crypto payments via Coinbase',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  lemonsqueezy: {
    name: 'LemonSqueezy',
    icon: 'fa-solid fa-lemon',
    color: '#FFC233',
    description: 'Digital product payments',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text' },
      { key: 'store_id', label: 'Store ID', type: 'text' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  philio: {
    name: 'Philio',
    icon: null,
    color: '#6366f1',
    description: 'Philio merchant payments',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text' },
      { key: 'merchant_id', label: 'Merchant ID', type: 'text' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle' },
    ],
  },
}

async function fetchConfig() {
  loading.value = true
  try {
    const [configRes, provRes] = await Promise.all([getAdminConfig(), getPaymentProviders()])
    const d = configRes.data.data || configRes.data
    if (d.store_enabled !== undefined) storeSettings.value.store_enabled = d.store_enabled === 'true' || d.store_enabled === true
    if (d.currency) storeSettings.value.currency = d.currency
    providers.value = provRes.data.data || {}
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function saveStoreSettings() {
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

async function toggleProvider(key) {
  const prev = providers.value[key]?.enabled
  providers.value[key].enabled = !prev
  try {
    await updatePaymentProvider(key, { enabled: !prev })
  } catch {
    providers.value[key].enabled = prev
    toast.show('Failed to toggle provider', 'error')
  }
}

function openConfig(key) {
  configModal.value = key
  modalForm.value = { ...(providers.value[key] || {}) }
}

function closeConfig() {
  configModal.value = null
}

async function saveConfig() {
  modalSaving.value = true
  try {
    const key = configModal.value
    await updatePaymentProvider(key, modalForm.value)
    providers.value[key] = { ...providers.value[key], ...modalForm.value }
    toast.show(`${providerMeta[key].name} settings saved`)
    closeConfig()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    modalSaving.value = false
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
      <!-- Store Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Store Settings</h3>
          <button @click="saveStoreSettings" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
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

        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-400 mb-1.5">Currency</label>
          <select v-model="storeSettings.currency" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <!-- Payment Providers -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <h3 class="text-base font-semibold text-white">Payment Providers</h3>
          <span class="px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
            {{ Object.values(providers).filter(p => p.enabled).length }} active
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(meta, key) in providerMeta"
            :key="key"
            class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 flex flex-col gap-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <!-- Icon / badge -->
                <div
                  v-if="meta.icon"
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: meta.color + '15' }"
                >
                  <i :class="meta.icon" class="text-lg" :style="{ color: meta.color }"></i>
                </div>
                <div
                  v-else
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  :style="{ backgroundColor: meta.color }"
                >
                  P
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-white">{{ meta.name }}</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="providers[key]?.enabled ? 'bg-green-500' : 'bg-gray-600'"
                    ></span>
                  </div>
                  <p class="text-xs text-gray-400 mt-0.5">{{ meta.description }}</p>
                </div>
              </div>
              <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                :class="providers[key]?.enabled ? 'bg-green-500' : 'bg-gray-600'"
                @click="toggleProvider(key)"
              >
                <span
                  class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                  :class="providers[key]?.enabled ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <div class="flex items-center">
              <button
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                @click="openConfig(key)"
              >
                <i class="fa-solid fa-gear mr-1"></i> Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Config Modal -->
    <Teleport to="body">
      <div v-if="configModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeConfig"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white">{{ providerMeta[configModal]?.name }} Settings</h3>
            <button class="text-gray-400 hover:text-white transition-colors" @click="closeConfig">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="space-y-4">
            <template v-for="field in providerMeta[configModal]?.fields" :key="field.key">
              <!-- Toggle field -->
              <div v-if="field.type === 'toggle'" class="flex items-center justify-between py-1">
                <label class="text-sm font-medium text-gray-300">{{ field.label }}</label>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="modalForm[field.key] ? 'bg-violet-600' : 'bg-gray-600'"
                  @click="modalForm[field.key] = !modalForm[field.key]"
                >
                  <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="modalForm[field.key] ? 'translate-x-6' : 'translate-x-1'" />
                </button>
              </div>
              <!-- Text / password field -->
              <div v-else>
                <label class="block text-sm font-medium text-gray-400 mb-1.5">{{ field.label }}</label>
                <input
                  v-model="modalForm[field.key]"
                  :type="field.type"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>
            </template>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              @click="closeConfig"
            >
              Cancel
            </button>
            <button
              @click="saveConfig"
              :disabled="modalSaving"
              class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {{ modalSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

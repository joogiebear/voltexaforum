<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig, testAdminEmail } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const testingEmail = ref(false)
const testEmailStatus = ref(null)

const mailSettings = ref({
  mail_mailer: 'smtp',
  mail_host: '',
  mail_port: '587',
  mail_username: '',
  mail_password: '',
  mail_encryption: 'tls',
  mail_from_address: '',
  mail_from_name: '',
})

async function fetchConfig() {
  loading.value = true
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    if (d.mail) Object.assign(mailSettings.value, d.mail)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminConfig({ config: mailSettings.value })
    toast.show('Email settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

async function sendTestEmail() {
  testingEmail.value = true
  testEmailStatus.value = null
  try {
    const res = await testAdminEmail()
    testEmailStatus.value = { ok: true, msg: res.data.message }
  } catch (e) {
    testEmailStatus.value = { ok: false, msg: e.response?.data?.message || 'Failed to send' }
  } finally {
    testingEmail.value = false
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
          <h3 class="text-base font-semibold text-white"><i class="fa-solid fa-envelope mr-2 text-violet-400"></i>Email / SMTP</h3>
          <div class="flex items-center gap-2">
            <button @click="sendTestEmail" :disabled="testingEmail" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-sm font-medium rounded-lg transition-colors">
              <i class="fa-solid fa-paper-plane mr-1.5"></i>{{ testingEmail ? 'Sending...' : 'Send Test' }}
            </button>
            <button @click="save" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Mailer</label>
            <select v-model="mailSettings.mail_mailer" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="smtp">SMTP</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
              <option value="log">Log (dev only)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">SMTP Host</label>
            <input v-model="mailSettings.mail_host" type="text" placeholder="smtp.example.com" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Port</label>
            <input v-model="mailSettings.mail_port" type="number" placeholder="587" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Encryption</label>
            <select v-model="mailSettings.mail_encryption" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
              <option value="tls">TLS (STARTTLS)</option>
              <option value="ssl">SSL</option>
              <option value="">None</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Username</label>
            <input v-model="mailSettings.mail_username" type="text" placeholder="you@example.com" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input v-model="mailSettings.mail_password" type="password" placeholder="••••••••" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">From Address</label>
            <input v-model="mailSettings.mail_from_address" type="email" placeholder="noreply@voltexahub.com" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">From Name</label>
            <input v-model="mailSettings.mail_from_name" type="text" placeholder="VoltexaHub" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
        </div>

        <p class="text-xs text-gray-500 mt-3"><i class="fa-solid fa-circle-info mr-1"></i>Settings apply immediately — no server restart needed. Leave host empty to use .env defaults.</p>

        <div v-if="testEmailStatus" class="mt-2 text-xs px-3 py-2 rounded-lg" :class="testEmailStatus.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'">
          <i :class="testEmailStatus.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'" class="mr-1"></i>{{ testEmailStatus.msg }}
        </div>
      </div>
    </template>
  </div>
</template>

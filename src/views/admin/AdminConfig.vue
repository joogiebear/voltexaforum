<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)
const saving = ref({})

const forumSettings = ref({
  forum_name: 'My Forum',
  multi_game: false,
  accent_color: '#7c3aed',
  maintenance_mode: false,
})

const gameServers = ref([])

const creditsSettings = ref({
  credits_per_thread: 10,
  credits_per_reply: 5,
  credits_for_solved: 25,
  credits_per_like: 1,
  credits_per_like_given: 0,
  credits_daily_post_limit: 50,
})

const roleMultipliers = ref({
  admin: 1.0,
  moderator: 1.0,
  member: 1.0,
})

const storeSettings = ref({
  stripe_publishable: '',
  stripe_secret: '',
  currency: 'USD',
})

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
  error.value = null
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    if (d.forum) Object.assign(forumSettings.value, d.forum)
    if (d.mail) Object.assign(mailSettings.value, d.mail)
    if (d.credits) {
      Object.assign(creditsSettings.value, d.credits)
      if (d.credits.role_credit_multipliers) {
        try {
          const parsed = typeof d.credits.role_credit_multipliers === 'string'
            ? JSON.parse(d.credits.role_credit_multipliers)
            : d.credits.role_credit_multipliers
          Object.assign(roleMultipliers.value, parsed)
        } catch {}
      }
    }
    if (d.store) Object.assign(storeSettings.value, d.store)
    if (d.game_servers) gameServers.value = d.game_servers
    // Also allow flat config
    if (d.forum_name) forumSettings.value.forum_name = d.forum_name
    if (d.multi_game !== undefined) forumSettings.value.multi_game = d.multi_game === true || d.multi_game === 'true'
    if (d.accent_color) forumSettings.value.accent_color = d.accent_color
    if (d.maintenance_mode !== undefined) forumSettings.value.maintenance_mode = d.maintenance_mode === true || d.maintenance_mode === 'true'
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load config'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function saveSection(section, data) {
  saving.value[section] = true
  try {
    await updateAdminConfig({ config: data })
    toast.show('Settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value[section] = false
  }
}

function saveForumSettings() {
  saveSection('forum', forumSettings.value)
}

function saveCreditsSettings() {
  saveSection('credits', {
    ...creditsSettings.value,
    role_credit_multipliers: JSON.stringify(roleMultipliers.value),
  })
}

function saveStoreSettings() {
  saveSection('store', storeSettings.value)
}

function saveGameServers() {
  saveSection('game_servers', gameServers.value)
}

function testConnection(server) {
  server.testing = true
  server.testResult = null
  setTimeout(() => {
    server.testing = false
    server.testResult = server.rcon_password ? 'success' : 'failed'
    setTimeout(() => { server.testResult = null }, 3000)
  }, 1500)
}

onMounted(fetchConfig)
function saveMailSettings() {
  const config = { ...mailSettings.value }
  updateAdminConfig({ config })
    .then(() => { saving.value.mail = false })
    .catch(() => { saving.value.mail = false })
  saving.value.mail = true
}
</script>

<template>
  <div class="space-y-8">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchConfig" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-40"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <!-- Forum Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Forum Settings</h3>
          <button @click="saveForumSettings" :disabled="saving.forum" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving.forum ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Forum Name</label>
            <input v-model="forumSettings.forum_name" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Accent Color</label>
            <div class="flex items-center gap-3">
              <input v-model="forumSettings.accent_color" type="text" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
              <div class="w-9 h-9 rounded-lg border border-gray-600 shrink-0" :style="{ backgroundColor: forumSettings.accent_color }" />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-gray-300">Multi-game Mode</div>
              <div class="text-xs text-gray-500 mt-0.5">Enabling this shows game selector and groups forums by game</div>
            </div>
            <button
              @click="forumSettings.multi_game = !forumSettings.multi_game"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="forumSettings.multi_game ? 'bg-violet-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="forumSettings.multi_game ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-gray-300">Maintenance Mode</div>
              <div class="text-xs text-gray-500 mt-0.5">Only admins can access the forum when enabled</div>
            </div>
            <button
              @click="forumSettings.maintenance_mode = !forumSettings.maintenance_mode"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="forumSettings.maintenance_mode ? 'bg-red-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="forumSettings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>
      </div>

      <!-- Game Server Settings -->
      <div v-if="gameServers.length" class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Game Server Settings</h3>
          <button @click="saveGameServers" :disabled="saving.game_servers" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving.game_servers ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div v-for="server in gameServers" :key="server.game || server.id" class="border border-gray-700/50 rounded-lg p-4 space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-300">
            <span>{{ server.icon }}</span>
            {{ server.game || server.name }}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">RCON Host</label>
              <input v-model="server.rcon_host" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">RCON Port</label>
              <input v-model="server.rcon_port" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">RCON Password</label>
              <div class="flex gap-2">
                <input v-model="server.rcon_password" type="password" placeholder="••••••••" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono" />
                <button
                  @click="testConnection(server)"
                  :disabled="server.testing"
                  class="px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0"
                  :class="server.testResult === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : server.testResult === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
                >
                  {{ server.testing ? 'Testing...' : server.testResult === 'success' ? 'Connected!' : server.testResult === 'failed' ? 'Failed' : 'Test' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Credits Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Credits Settings</h3>
          <button @click="saveCreditsSettings" :disabled="saving.credits" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving.credits ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Credits per New Thread</label>
            <input v-model="creditsSettings.credits_per_thread" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Credits per Reply</label>
            <input v-model="creditsSettings.credits_per_reply" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Credits for Solved Thread</label>
            <input v-model="creditsSettings.credits_for_solved" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Credits per Like Received</label>
            <input v-model="creditsSettings.credits_per_like" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Credits for Giving a Like</label>
            <input v-model="creditsSettings.credits_per_like_given" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Max Credits from Posting per Day</label>
            <input v-model="creditsSettings.credits_daily_post_limit" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          </div>
        </div>

        <!-- Role Multipliers -->
        <div class="border-t border-gray-700/50 pt-5 mt-5">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">Role Multipliers</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Admin Multiplier</label>
              <input v-model.number="roleMultipliers.admin" type="number" step="0.1" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Moderator Multiplier</label>
              <input v-model.number="roleMultipliers.moderator" type="number" step="0.1" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Member Multiplier</label>
              <input v-model.number="roleMultipliers.member" type="number" step="0.1" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      <!-- Store Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Store Settings</h3>
          <button @click="saveStoreSettings" :disabled="saving.store" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving.store ? 'Saving...' : 'Save' }}
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
      <!-- Email / SMTP Settings -->
      <div class="bg-gray-800 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-white"><i class="fa-solid fa-envelope mr-2 text-violet-400"></i>Email / SMTP</h3>
          <button @click="saveMailSettings" :disabled="saving.mail" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving.mail ? 'Saving...' : 'Save' }}
          </button>
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
      </div>

    </template>
  </div>
</template>

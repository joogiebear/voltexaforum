<script setup>
import { ref, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig, getAdminGroups, getUnlockRequirements, updateUnlockRequirements } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const creditsSettings = ref({
  credits_per_thread: 10,
  credits_per_reply: 5,
  credits_for_solved: 25,
  credits_per_like: 1,
  credits_per_like_given: 0,
  credits_daily_post_limit: 50,
})

// Dynamic — keyed by role name, populated from groups API
const roleMultipliers = ref({})
const groups = ref([])

async function fetchConfig() {
  loading.value = true
  try {
    const [configRes, groupsRes] = await Promise.all([getAdminConfig(), getAdminGroups()])
    const d = configRes.data.data || configRes.data

    // Load groups (exclude 'banned' and 'guest' — no point giving them multipliers)
    groups.value = (groupsRes.data.data || groupsRes.data).filter(g => !['banned', 'guest'].includes(g.name))

    // Seed multipliers with 1.0 for each group
    const defaults = {}
    groups.value.forEach(g => { defaults[g.name] = 1.0 })
    roleMultipliers.value = defaults

    if (d.credits) {
      Object.assign(creditsSettings.value, d.credits)
      if (d.credits.role_credit_multipliers) {
        try {
          const parsed = typeof d.credits.role_credit_multipliers === 'string'
            ? JSON.parse(d.credits.role_credit_multipliers)
            : d.credits.role_credit_multipliers
          // Merge saved values over defaults
          Object.assign(roleMultipliers.value, parsed)
        } catch {}
      }
    }
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
        ...creditsSettings.value,
        role_credit_multipliers: JSON.stringify(roleMultipliers.value),
      },
    })
    toast.show('Credits settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

// Locked Content
const lockedContent = ref({ locked_content_default_cost: 50, locked_content_tax_percent: 0 })
const savingLocked = ref(false)

async function fetchLockedContent() {
  try {
    const res = await getAdminConfig()
    const d = res.data.data || res.data
    if (d.locked_content_default_cost !== undefined) lockedContent.value.locked_content_default_cost = Number(d.locked_content_default_cost)
    if (d.locked_content_tax_percent !== undefined) lockedContent.value.locked_content_tax_percent = Number(d.locked_content_tax_percent)
  } catch {}
}

async function saveLockedContent() {
  savingLocked.value = true
  try {
    await updateAdminConfig({ config: lockedContent.value })
    toast.show('Locked content settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    savingLocked.value = false
  }
}

// Unlock Requirements
const unlockReqs = ref({ min_posts: 0, must_like: false })
const savingUnlockReqs = ref(false)

async function fetchUnlockReqs() {
  try {
    const res = await getUnlockRequirements()
    const d = res.data.data || res.data
    unlockReqs.value.min_posts = d.unlock_req_min_posts ?? 0
    unlockReqs.value.must_like = d.unlock_req_must_like ?? false
  } catch {}
}

async function saveUnlockReqs() {
  savingUnlockReqs.value = true
  try {
    await updateUnlockRequirements({
      unlock_req_min_posts: unlockReqs.value.min_posts,
      unlock_req_must_like: unlockReqs.value.must_like,
    })
    toast.show('Unlock requirements saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    savingUnlockReqs.value = false
  }
}

onMounted(() => {
  fetchConfig()
  fetchLockedContent()
  fetchUnlockReqs()
})
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
          <h3 class="text-base font-semibold text-white">Credits Settings</h3>
          <button @click="save" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving ? 'Saving...' : 'Save' }}
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
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-sm font-semibold text-gray-300">Role Multipliers</h4>
          </div>
          <p class="text-xs text-gray-500 mb-3">Multiply credits earned for each group. 1.0 = no bonus. Add new groups in <router-link to="/admin/groups" class="text-violet-400 hover:underline">Groups &amp; Roles</router-link>.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div v-for="group in groups" :key="group.name" class="relative">
              <label class="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-1.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: group.color || '#94a3b8' }"></span>
                {{ group.label || group.name }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="roleMultipliers[group.name]"
                  type="number" step="0.1" min="0" max="10"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
                />
                <span class="text-xs text-gray-500 shrink-0">×</span>
              </div>
            </div>
            <div v-if="!groups.length" class="col-span-3 text-sm text-gray-500">
              No groups found.
            </div>
          </div>
        </div>
      </div>
      <!-- Locked Content -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-white">Locked Content</h3>
            <p class="text-xs text-gray-500 mt-0.5">Credits required to unlock <code class="bg-gray-700 px-1 rounded">[lock=N]</code> tagged content</p>
          </div>
          <button @click="saveLockedContent" :disabled="savingLocked" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ savingLocked ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Default Unlock Cost (credits)</label>
            <input v-model.number="lockedContent.locked_content_default_cost" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            <p class="text-xs text-gray-500 mt-1">Used when no cost is specified in the tag (e.g. <code class="bg-gray-700 px-1 rounded">[lock]</code>)</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Tax Percentage (0–100)</label>
            <input v-model.number="lockedContent.locked_content_tax_percent" type="number" min="0" max="100" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            <p class="text-xs text-gray-500 mt-1">Added on top of base cost. 0 = no tax.</p>
          </div>
        </div>
      </div>

      <!-- Unlock Requirements -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-white">Unlock Requirements</h3>
            <p class="text-xs text-gray-500 mt-0.5">Minimum activity before users can reply. Groups with the bypass perk are exempt.</p>
          </div>
          <button @click="saveUnlockReqs" :disabled="savingUnlockReqs" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ savingUnlockReqs ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Minimum Posts to Reply</label>
            <input v-model.number="unlockReqs.min_posts" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            <p class="text-xs text-gray-500 mt-1">Set to 0 to disable.</p>
          </div>
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Must Like Thread to Reply</div>
            <div class="text-xs text-gray-500 mt-0.5">Require users to like the first post before replying</div>
          </div>
          <button
            @click="unlockReqs.must_like = !unlockReqs.must_like"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="unlockReqs.must_like ? 'bg-violet-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="unlockReqs.must_like ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

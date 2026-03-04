<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import {
  getAdminUpgradePlans, createAdminUpgradePlan,
  updateAdminUpgradePlan, deleteAdminUpgradePlan,
  getAdminGroups,
} from '../../services/api'
import { useToastStore } from '../../stores/toast'

const isDark = inject('isDark')
const toast = useToastStore()

const plans = ref([])
const groups = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)

const TERM_OPTIONS = [
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
]

const FEATURE_TYPES = [
  { value: 'check', label: '✅ Included' },
  { value: 'cross', label: '❌ Not included' },
  { value: 'stat',  label: '📊 Stat (with value)' },
]

function emptyForm() {
  return {
    name: '', description: '', color: '#8b5cf6', price: 9.99,
    term: 'lifetime', role_name: '', is_active: true, is_featured: false,
    rep_power_pos: 2, rep_power_neg: 2, rep_daily_limit: 5,
    display_order: 0, stripe_price_id: '',
    features: [],
    one_time_bonus: { credits: 0, label: '' },
  }
}

const form = reactive(emptyForm())

async function fetchAll() {
  loading.value = true
  try {
    const [plansRes, groupsRes] = await Promise.all([
      getAdminUpgradePlans(), getAdminGroups(),
    ])
    plans.value = plansRes.data.data || []
    groups.value = (groupsRes.data.data || groupsRes.data || []).filter(g => !['banned', 'guest'].includes(g.name))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  showModal.value = true
}

function openEdit(plan) {
  editingId.value = plan.id
  Object.assign(form, {
    ...plan,
    features: plan.features ? JSON.parse(JSON.stringify(plan.features)) : [],
    one_time_bonus: plan.one_time_bonus
      ? JSON.parse(JSON.stringify(plan.one_time_bonus))
      : { credits: 0, label: '' },
  })
  showModal.value = true
}

function closeModal() { showModal.value = false; editingId.value = null }

function addFeature() {
  form.features.push({ type: 'check', label: '', value: null })
}

function removeFeature(idx) {
  form.features.splice(idx, 1)
}

function moveFeature(idx, dir) {
  const arr = form.features
  const swap = idx + dir
  if (swap < 0 || swap >= arr.length) return
  ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
}

async function handleSave() {
  if (!form.name.trim()) { toast.show('Plan name required', 'error'); return }
  saving.value = true
  try {
    const payload = {
      ...form,
      price: Number(form.price),
      rep_power_pos: Number(form.rep_power_pos),
      rep_power_neg: Number(form.rep_power_neg),
      rep_daily_limit: Number(form.rep_daily_limit),
      display_order: Number(form.display_order),
      one_time_bonus: form.one_time_bonus,
    }
    if (editingId.value) {
      const res = await updateAdminUpgradePlan(editingId.value, payload)
      const updated = res.data.data
      const idx = plans.value.findIndex(p => p.id === editingId.value)
      if (idx !== -1) plans.value[idx] = updated
      toast.show('Plan updated')
    } else {
      const res = await createAdminUpgradePlan(payload)
      plans.value.push(res.data.data)
      toast.show('Plan created')
    }
    closeModal()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDuplicate(plan) {
  saving.value = true
  try {
    const payload = {
      ...plan,
      name: plan.name + ' (Copy)',
      is_active: false,
      is_featured: false,
    }
    delete payload.id
    delete payload.slug
    delete payload.created_at
    delete payload.updated_at
    const res = await createAdminUpgradePlan(payload)
    plans.value.push(res.data.data)
    toast.show('Plan duplicated')
  } catch {
    toast.show('Failed to duplicate', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(plan) {
  if (!confirm(`Delete "${plan.name}"?`)) return
  try {
    await deleteAdminUpgradePlan(plan.id)
    plans.value = plans.value.filter(p => p.id !== plan.id)
    toast.show('Plan deleted')
  } catch {
    toast.show('Failed to delete', 'error')
  }
}

async function toggleActive(plan) {
  try {
    const res = await updateAdminUpgradePlan(plan.id, { is_active: !plan.is_active })
    plan.is_active = res.data.data.is_active
  } catch { toast.show('Failed to update', 'error') }
}

onMounted(fetchAll)
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Manage upgrade plans shown on the <router-link to="/upgrade" class="text-violet-400 hover:underline" target="_blank">/upgrade</router-link> page.
      </p>
      <button @click="openCreate"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
        <i class="fa-solid fa-plus mr-1.5"></i>New Plan
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-xl animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'" />
    </div>

    <!-- Empty -->
    <div v-else-if="!plans.length"
      class="rounded-xl p-12 text-center border"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <i class="fa-solid fa-rocket text-3xl text-gray-400 mb-3"></i>
      <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No upgrade plans yet. Create your first one!</p>
    </div>

    <!-- Plans table -->
    <div v-else class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-xs font-semibold uppercase tracking-wider"
            :class="isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'">
            <th class="text-left px-5 py-3">Plan</th>
            <th class="text-left px-5 py-3">Price</th>
            <th class="text-left px-5 py-3">Term</th>
            <th class="text-left px-5 py-3">Role</th>
            <th class="text-center px-5 py-3">Rep</th>
            <th class="text-center px-5 py-3">Active</th>
            <th class="text-right px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id"
            class="border-b last:border-0 transition-colors"
            :class="isDark ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: plan.color }"></span>
                <span class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ plan.name }}</span>
                <span v-if="plan.is_featured" class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                  :style="{ backgroundColor: plan.color + '25', color: plan.color }">Featured</span>
              </div>
            </td>
            <td class="px-5 py-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              ${{ Number(plan.price).toFixed(2) }}
            </td>
            <td class="px-5 py-3 capitalize" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ plan.term }}</td>
            <td class="px-5 py-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ plan.role_name || '—' }}</td>
            <td class="px-5 py-3 text-center text-xs">
              <span class="text-green-400 font-bold">+{{ plan.rep_power_pos }}</span>
              <span :class="isDark ? 'text-gray-600' : 'text-gray-300'"> / </span>
              <span class="text-red-400 font-bold">-{{ plan.rep_power_neg }}</span>
              <span class="block" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ plan.rep_daily_limit }}/day</span>
            </td>
            <td class="px-5 py-3 text-center">
              <button @click="toggleActive(plan)"
                class="w-10 h-5 rounded-full transition-colors relative"
                :class="plan.is_active ? 'bg-violet-600' : (isDark ? 'bg-gray-600' : 'bg-gray-300')">
                <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  :class="plan.is_active ? 'left-5' : 'left-0.5'"></span>
              </button>
            </td>
            <td class="px-5 py-3 text-right">
              <button @click="openEdit(plan)" title="Edit"
                class="text-xs px-2.5 py-1 rounded mr-1 transition-colors"
                :class="isDark ? 'text-gray-400 hover:text-violet-400 hover:bg-gray-700' : 'text-gray-400 hover:text-violet-600 hover:bg-gray-100'">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button @click="handleDuplicate(plan)" title="Duplicate"
                class="text-xs px-2.5 py-1 rounded mr-1 transition-colors"
                :class="isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button @click="handleDelete(plan)" title="Delete"
                class="text-xs px-2.5 py-1 rounded transition-colors"
                :class="isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Modal ─── -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/60" @click="closeModal" />
        <div class="relative min-h-full flex items-start justify-center p-4 py-8">
          <div class="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-gray-800' : 'bg-white'">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b"
              :class="isDark ? 'border-gray-700' : 'border-gray-200'">
              <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ editingId ? 'Edit Plan' : 'New Upgrade Plan' }}
              </h2>
              <button @click="closeModal" class="p-1.5 rounded-lg transition-colors"
                :class="isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
              <!-- Basic info -->
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Plan Name *</label>
                  <input v-model="form.name" type="text" placeholder="e.g. Prime"
                    class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
                </div>
                <div class="flex gap-3">
                  <div class="flex-1">
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Color</label>
                    <input v-model="form.color" type="color"
                      class="w-full h-9 rounded-lg border cursor-pointer"
                      :class="isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-white'" />
                  </div>
                  <div class="flex-1">
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Order</label>
                    <input v-model.number="form.display_order" type="number"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Description</label>
                <textarea v-model="form.description" rows="2" placeholder="Short description shown on upgrade page"
                  class="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                  :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
              </div>

              <!-- Price + term + role -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Price ($)</label>
                  <input v-model.number="form.price" type="number" step="0.01" min="0"
                    class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Term</label>
                  <select v-model="form.term"
                    class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'">
                    <option v-for="t in TERM_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Assign Role</label>
                  <select v-model="form.role_name"
                    class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'">
                    <option value="">None</option>
                    <option v-for="g in groups" :key="g.name" :value="g.name">{{ g.label || g.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Rep settings -->
              <div class="rounded-xl p-4 border" :class="isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'">
                <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-thumbs-up mr-1.5"></i>Reputation Settings
                </h3>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Rep Power (+)</label>
                    <input v-model.number="form.rep_power_pos" type="number" min="0"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Rep Power (-)</label>
                    <input v-model.number="form.rep_power_neg" type="number" min="0"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Daily Reps Limit</label>
                    <input v-model.number="form.rep_daily_limit" type="number" min="0"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                  </div>
                </div>
              </div>

              <!-- One-time bonus -->
              <div class="rounded-xl p-4 border" :class="isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'">
                <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-gift mr-1.5"></i>One-Time Bonus
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Credits Bonus</label>
                    <input v-model.number="form.one_time_bonus.credits" type="number" min="0"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Bonus Note</label>
                    <input v-model="form.one_time_bonus.label" type="text" placeholder="e.g. 3hr XP boost"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      :class="isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                  </div>
                </div>
              </div>

              <!-- Features -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xs font-semibold uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    <i class="fa-solid fa-list-check mr-1.5"></i>Features
                  </h3>
                  <button @click="addFeature"
                    class="text-xs px-2.5 py-1 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                    <i class="fa-solid fa-plus mr-1"></i>Add Row
                  </button>
                </div>
                <div class="space-y-2">
                  <div v-if="!form.features.length" class="text-xs py-3 text-center"
                    :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    No features yet. Click "Add Row" to start.
                  </div>
                  <div v-for="(feat, idx) in form.features" :key="idx"
                    class="flex items-center gap-2 p-2.5 rounded-lg"
                    :class="isDark ? 'bg-gray-900/50' : 'bg-gray-50'">
                    <!-- Type -->
                    <select v-model="feat.type"
                      class="px-2 py-1.5 rounded-lg border text-xs shrink-0 focus:outline-none"
                      :class="isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'"
                      style="width: 130px">
                      <option v-for="t in FEATURE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                    </select>
                    <!-- Label -->
                    <input v-model="feat.label" type="text" placeholder="Feature label"
                      class="flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none"
                      :class="isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    <!-- Value (only for stat) -->
                    <input v-if="feat.type === 'stat'" v-model="feat.value" type="text" placeholder="Value"
                      class="w-20 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none shrink-0"
                      :class="isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    <!-- Move up/down -->
                    <button @click="moveFeature(idx, -1)" :disabled="idx === 0"
                      class="p-1 rounded transition-colors shrink-0 disabled:opacity-30"
                      :class="isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'">
                      <i class="fa-solid fa-chevron-up text-xs"></i>
                    </button>
                    <button @click="moveFeature(idx, 1)" :disabled="idx === form.features.length - 1"
                      class="p-1 rounded transition-colors shrink-0 disabled:opacity-30"
                      :class="isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'">
                      <i class="fa-solid fa-chevron-down text-xs"></i>
                    </button>
                    <!-- Remove -->
                    <button @click="removeFeature(idx)"
                      class="p-1 rounded transition-colors shrink-0"
                      :class="isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'">
                      <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Flags -->
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.is_active" class="w-4 h-4 accent-violet-500 rounded" />
                  <span class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Active (visible on upgrade page)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.is_featured" class="w-4 h-4 accent-violet-500 rounded" />
                  <span class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Featured (highlight card)</span>
                </label>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t"
              :class="isDark ? 'border-gray-700' : 'border-gray-200'">
              <button @click="closeModal" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'">Cancel</button>
              <button @click="handleSave" :disabled="saving"
                class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {{ saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Plan') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

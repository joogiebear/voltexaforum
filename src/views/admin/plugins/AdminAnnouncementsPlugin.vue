<script setup>
import { ref, onMounted } from 'vue'
import { getAdminAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const announcements = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(null)

const form = ref({
  text: '',
  type: 'info',
  is_active: true,
  sort_order: 0,
})

const types = [
  { value: 'info', label: 'Info', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'success', label: 'Success', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'danger', label: 'Danger', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
]

function typeBadgeClass(type) {
  const found = types.find(t => t.value === type)
  return found ? found.color : 'bg-gray-500/20 text-gray-400'
}

async function fetchAnnouncements() {
  loading.value = true
  try {
    const { data } = await getAdminAnnouncements()
    announcements.value = data.data || []
  } catch {
    toast.error('Failed to load announcements.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { text: '', type: 'info', is_active: true, sort_order: 0 }
  showModal.value = true
}

function openEdit(a) {
  editing.value = a.id
  form.value = { text: a.text, type: a.type, is_active: a.is_active, sort_order: a.sort_order }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

async function save() {
  if (!form.value.text.trim()) {
    toast.error('Text is required.')
    return
  }
  try {
    if (editing.value) {
      await updateAnnouncement(editing.value, form.value)
      toast.success('Announcement updated.')
    } else {
      await createAnnouncement(form.value)
      toast.success('Announcement created.')
    }
    closeModal()
    await fetchAnnouncements()
  } catch {
    toast.error('Failed to save announcement.')
  }
}

async function doDelete(id) {
  if (!confirm('Delete this announcement?')) return
  try {
    await deleteAnnouncement(id)
    toast.success('Announcement deleted.')
    await fetchAnnouncements()
  } catch {
    toast.error('Failed to delete announcement.')
  }
}

async function quickToggle(a) {
  try {
    await updateAnnouncement(a.id, { is_active: !a.is_active })
    await fetchAnnouncements()
  } catch {
    toast.error('Failed to toggle announcement.')
  }
}

onMounted(fetchAnnouncements)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <router-link to="/admin/plugins" class="text-gray-400 hover:text-white transition-colors">
          <i class="fa-solid fa-arrow-left text-sm"></i>
        </router-link>
        <h2 class="text-lg font-semibold text-white">Announcements</h2>
        <span class="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-semibold">
          {{ announcements.length }} total
        </span>
      </div>
      <button
        class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        @click="openCreate"
      >
        <i class="fa-solid fa-plus mr-1.5"></i> New Announcement
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse">
      <div class="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
      <div class="h-4 bg-gray-700 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!announcements.length" class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <div class="text-center py-8">
        <div class="text-3xl mb-3 text-gray-600"><i class="fa-solid fa-bullhorn"></i></div>
        <p class="text-sm text-gray-400">No announcements yet</p>
        <p class="text-xs text-gray-500 mt-1">Create your first announcement to display banners across your site.</p>
        <button
          class="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          @click="openCreate"
        >
          <i class="fa-solid fa-plus mr-1.5"></i> Create Announcement
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-700/50">
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Text</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
            <th class="text-center px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Active</th>
            <th class="text-center px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/50">
          <tr v-for="a in announcements" :key="a.id" class="hover:bg-gray-700/30 transition-colors">
            <td class="px-5 py-3 text-sm text-gray-300 max-w-md truncate">{{ a.text }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 text-xs font-medium rounded border" :class="typeBadgeClass(a.type)">
                {{ a.type }}
              </span>
            </td>
            <td class="px-5 py-3 text-center">
              <button
                class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                :class="a.is_active ? 'bg-green-500' : 'bg-gray-600'"
                @click="quickToggle(a)"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200"
                  :class="a.is_active ? 'translate-x-4' : 'translate-x-0'"
                ></span>
              </button>
            </td>
            <td class="px-5 py-3 text-center text-sm text-gray-400">{{ a.sort_order }}</td>
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="px-2.5 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  @click="openEdit(a)"
                >
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  class="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  @click="doDelete(a.id)"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeModal"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white">
              {{ editing ? 'Edit Announcement' : 'New Announcement' }}
            </h3>
            <button class="text-gray-400 hover:text-white transition-colors" @click="closeModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Text -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Text</label>
            <textarea
              v-model="form.text"
              rows="3"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
              placeholder="Enter announcement text..."
            ></textarea>
          </div>

          <!-- Type selector -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
            <div class="flex gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                :class="form.type === t.value
                  ? t.color + ' ring-1 ring-offset-1 ring-offset-gray-800'
                  : 'bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500'"
                @click="form.type = t.value"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Sort order -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Sort Order</label>
            <input
              v-model.number="form.sort_order"
              type="number"
              class="w-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <!-- Active toggle -->
          <div class="flex items-center gap-3">
            <button
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
              :class="form.is_active ? 'bg-green-500' : 'bg-gray-600'"
              @click="form.is_active = !form.is_active"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
            <span class="text-sm text-gray-300">Active</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
              @click="save"
            >
              {{ editing ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

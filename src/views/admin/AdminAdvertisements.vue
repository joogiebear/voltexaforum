<script setup>
import { ref, onMounted } from 'vue'
import { getAdminAds, createAd, updateAd, deleteAd, toggleAd } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const ads = ref([])
const showForm = ref(false)
const editingId = ref(null)

const form = ref({
  title: '',
  url: '',
  position: 'header',
  display_order: 0,
  image: null,
})

function resetForm() {
  form.value = { title: '', url: '', position: 'header', display_order: 0, image: null }
  editingId.value = null
}

async function fetchAds() {
  loading.value = true
  try {
    const res = await getAdminAds()
    ads.value = res.data.data || []
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load ads', 'error')
  } finally {
    loading.value = false
  }
}

function startEdit(ad) {
  editingId.value = ad.id
  form.value = {
    title: ad.title,
    url: ad.url || '',
    position: ad.position,
    display_order: ad.display_order || 0,
    image: null,
  }
  showForm.value = true
}

async function submitForm() {
  try {
    const fd = new FormData()
    fd.append('title', form.value.title)
    fd.append('url', form.value.url || '')
    fd.append('position', form.value.position)
    fd.append('display_order', form.value.display_order)
    if (form.value.image) fd.append('image', form.value.image)

    if (editingId.value) {
      fd.append('_method', 'PUT')
      await updateAd(editingId.value, fd)
      toast.show('Advertisement updated')
    } else {
      await createAd(fd)
      toast.show('Advertisement created')
    }
    showForm.value = false
    resetForm()
    fetchAds()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save ad', 'error')
  }
}

async function handleToggle(ad) {
  try {
    const res = await toggleAd(ad.id)
    ad.is_active = res.data.data.is_active
    toast.show(ad.is_active ? 'Ad activated' : 'Ad deactivated')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to toggle ad', 'error')
  }
}

async function handleDelete(ad) {
  if (!confirm(`Delete "${ad.title}"? This cannot be undone.`)) return
  try {
    await deleteAd(ad.id)
    toast.show('Advertisement deleted')
    fetchAds()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete ad', 'error')
  }
}

function handleImageSelect(e) {
  form.value.image = e.target.files?.[0] || null
}

onMounted(fetchAds)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage advertisement slots across the site.</p>
      <button
        @click="showForm = !showForm; if (!showForm) resetForm()"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showForm ? 'Cancel' : '+ Create Ad' }}
      </button>
    </div>

    <!-- Create/Edit form -->
    <div v-if="showForm" class="bg-gray-800 rounded-xl border border-violet-500/30 p-6 space-y-4">
      <h3 class="text-base font-semibold text-white">{{ editingId ? 'Edit Advertisement' : 'New Advertisement' }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Title</label>
          <input v-model="form.title" type="text" placeholder="Ad title" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">URL</label>
          <input v-model="form.url" type="text" placeholder="https://..." class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Position</label>
          <select v-model="form.position" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="header">Header</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Display Order</label>
          <input v-model.number="form.display_order" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-gray-400 mb-1">Image</label>
          <input type="file" accept="image/*" @change="handleImageSelect" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="submitForm" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">{{ editingId ? 'Save Changes' : 'Create Ad' }}</button>
        <button @click="showForm = false; resetForm()" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Ads table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">Title</th>
              <th class="px-5 py-3">Position</th>
              <th class="px-5 py-3">Image</th>
              <th class="px-5 py-3">Active</th>
              <th class="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 3" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-28"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-8 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-6 bg-gray-700 rounded w-11"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="ad in ads" :key="ad.id" class="hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3 font-medium text-gray-200">{{ ad.title }}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="{
                      'bg-blue-500/15 text-blue-400': ad.position === 'header',
                      'bg-green-500/15 text-green-400': ad.position === 'sidebar',
                      'bg-orange-500/15 text-orange-400': ad.position === 'footer',
                    }"
                  >{{ ad.position }}</span>
                </td>
                <td class="px-5 py-3">
                  <img v-if="ad.image_path" :src="ad.image_path" class="h-8 w-16 object-cover rounded" />
                  <span v-else class="text-gray-600 text-xs">No image</span>
                </td>
                <td class="px-5 py-3">
                  <button
                    @click="handleToggle(ad)"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="ad.is_active ? 'bg-violet-600' : 'bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="ad.is_active ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <button @click="startEdit(ad)" class="p-1.5 rounded-lg hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="handleDelete(ad)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !ads.length" class="px-5 py-12 text-center text-sm text-gray-500">
        No advertisements yet. Create your first ad above.
      </div>
    </div>
  </div>
</template>

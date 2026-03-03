<script setup>
import { ref, onMounted } from 'vue'
import { getAdminStoreItems, createAdminStoreItem, updateAdminStoreItem, deleteAdminStoreItem } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const items = ref([])
const showCreateForm = ref(false)

const newItem = ref({
  name: '',
  slug: '',
  description: '',
  icon: '',
  category: 'Ranks',
  price_money: null,
  price_credits: null,
  item_type: 'rank',
  item_value: '',
  is_active: true,
})

function resetNewItem() {
  newItem.value = { name: '', slug: '', description: '', icon: '', category: 'Ranks', price_money: null, price_credits: null, item_type: 'rank', item_value: '', is_active: true }
}

async function fetchItems() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminStoreItems()
    items.value = res.data.data || res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load store items'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  try {
    await createAdminStoreItem(newItem.value)
    toast.show('Item created')
    showCreateForm.value = false
    resetNewItem()
    fetchItems()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create item', 'error')
  }
}

async function toggleActive(item) {
  try {
    await updateAdminStoreItem(item.id, { is_active: !item.is_active })
    item.is_active = !item.is_active
    toast.show(item.is_active ? 'Item activated' : 'Item deactivated')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to update item', 'error')
  }
}

async function doDelete(item) {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
  try {
    await deleteAdminStoreItem(item.id)
    toast.show('Item deleted')
    fetchItems()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete item', 'error')
  }
}

onMounted(fetchItems)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchItems" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage store items, pricing, and availability.</p>
      <button
        @click="showCreateForm = !showCreateForm"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showCreateForm ? 'Cancel' : '+ Create Item' }}
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreateForm" class="bg-gray-800 rounded-xl border border-violet-500/30 p-6 space-y-4">
      <h3 class="text-base font-semibold text-white">New Store Item</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
          <input v-model="newItem.name" type="text" placeholder="Item name" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Slug</label>
          <input v-model="newItem.slug" type="text" placeholder="item-slug" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Icon (emoji)</label>
          <input v-model="newItem.icon" type="text" placeholder="🎁" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Category</label>
          <select v-model="newItem.category" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option>Ranks</option>
            <option>Currency & Kits</option>
            <option>Cosmetics</option>
            <option>Flair</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Price ($)</label>
          <input v-model="newItem.price_money" type="number" step="0.01" placeholder="0.00" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Price (Credits)</label>
          <input v-model="newItem.price_credits" type="number" placeholder="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Item Type</label>
          <select v-model="newItem.item_type" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="rank">Rank</option>
            <option value="currency">Currency</option>
            <option value="kit">Kit</option>
            <option value="cosmetic">Cosmetic</option>
            <option value="flair">Flair</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Command</label>
          <input v-model="newItem.item_value" type="text" placeholder="eco give {player} 500" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Description</label>
        <textarea v-model="newItem.description" rows="2" placeholder="Item description..." class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none" />
      </div>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="newItem.is_active" class="rounded border-gray-600" />
          <span class="text-sm text-gray-300">Active</span>
        </label>
      </div>
      <div class="flex gap-2">
        <button @click="submitCreate" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">Create Item</button>
        <button @click="showCreateForm = false" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Items table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">Item</th>
              <th class="px-5 py-3">Category</th>
              <th class="px-5 py-3">$ Price</th>
              <th class="px-5 py-3">⚡ Credits</th>
              <th class="px-5 py-3">Active</th>
              <th class="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-28"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-14"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-14"></div></td>
                <td class="px-5 py-3"><div class="h-6 bg-gray-700 rounded w-11"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="item in items" :key="item.id" class="hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ item.icon }}</span>
                    <span class="font-medium text-gray-200">{{ item.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-400">{{ item.category }}</td>
                <td class="px-5 py-3 text-gray-300">{{ item.price_money != null ? `$${Number(item.price_money).toFixed(2)}` : '—' }}</td>
                <td class="px-5 py-3 text-gray-300">{{ item.price_credits != null ? `⚡ ${item.price_credits}` : '—' }}</td>
                <td class="px-5 py-3">
                  <button
                    @click="toggleActive(item)"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="item.is_active ? 'bg-violet-600' : 'bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="item.is_active ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <button @click="doDelete(item)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
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

      <div v-if="!loading && !items.length" class="px-5 py-12 text-center text-sm text-gray-500">
        No store items yet. Create your first item above.
      </div>
    </div>
  </div>
</template>

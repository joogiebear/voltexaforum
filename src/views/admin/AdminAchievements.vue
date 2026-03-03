<script setup>
import { ref, onMounted } from 'vue'
import { getAdminAchievements, createAdminAchievement, updateAdminAchievement, deleteAdminAchievement } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const achievements = ref([])
const showCreateForm = ref(false)

const newAchievement = ref({
  name: '',
  description: '',
  icon: '',
  type: 'count',
  target: 1,
  category: 'posts',
  credits_reward: 50,
})

function resetNew() {
  newAchievement.value = { name: '', description: '', icon: '', type: 'count', target: 1, category: 'posts', credits_reward: 50 }
}

async function fetchAchievements() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminAchievements()
    achievements.value = res.data.data || res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load achievements'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  try {
    await createAdminAchievement(newAchievement.value)
    toast.show('Achievement created')
    showCreateForm.value = false
    resetNew()
    fetchAchievements()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create achievement', 'error')
  }
}

async function doDelete(id) {
  if (!confirm('Delete this achievement?')) return
  try {
    await deleteAdminAchievement(id)
    toast.show('Achievement deleted')
    fetchAchievements()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete achievement', 'error')
  }
}

function categoryBadge(cat) {
  const map = {
    posts: 'bg-blue-500/10 text-blue-400',
    time: 'bg-green-500/10 text-green-400',
    social: 'bg-pink-500/10 text-pink-400',
    shop: 'bg-amber-500/10 text-amber-400',
  }
  return map[cat] || map.posts
}

onMounted(fetchAchievements)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchAchievements" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage achievements and their unlock criteria.</p>
      <button
        @click="showCreateForm = !showCreateForm"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showCreateForm ? 'Cancel' : '+ Create Achievement' }}
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreateForm" class="bg-gray-800 rounded-xl border border-violet-500/30 p-6 space-y-4">
      <h3 class="text-base font-semibold text-white">New Achievement</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
          <input v-model="newAchievement.name" type="text" placeholder="Achievement name" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Icon (emoji)</label>
          <input v-model="newAchievement.icon" type="text" placeholder="🏆" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Category</label>
          <select v-model="newAchievement.category" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="posts">Posts</option>
            <option value="time">Time</option>
            <option value="social">Social</option>
            <option value="shop">Shop</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Type</label>
          <select v-model="newAchievement.type" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="count">Count</option>
            <option value="action">Action</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Target</label>
          <input v-model="newAchievement.target" type="number" :disabled="newAchievement.type === 'action'" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none disabled:opacity-50" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Credits Reward</label>
          <input v-model="newAchievement.credits_reward" type="number" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Description</label>
        <input v-model="newAchievement.description" type="text" placeholder="Achievement description" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
      </div>
      <div class="flex gap-2">
        <button @click="submitCreate" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
        <button @click="showCreateForm = false" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Achievements table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">Achievement</th>
              <th class="px-5 py-3">Category</th>
              <th class="px-5 py-3">Trigger</th>
              <th class="px-5 py-3">Target</th>
              <th class="px-5 py-3">Credits</th>
              <th class="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-32"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-14"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-10"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-14"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="a in achievements" :key="a.id" class="hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ a.icon }}</span>
                    <div>
                      <div class="font-medium text-gray-200">{{ a.name }}</div>
                      <div class="text-xs text-gray-500">{{ a.description }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize" :class="categoryBadge(a.category)">
                    {{ a.category }}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-400 capitalize">{{ a.type }}</td>
                <td class="px-5 py-3 text-gray-400">{{ a.target || '—' }}</td>
                <td class="px-5 py-3 text-violet-400 font-medium"><i class="fa-solid fa-coins mr-1"></i>{{ a.credits_reward || a.creditsReward || 0 }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <button @click="doDelete(a.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
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

      <div v-if="!loading && !achievements.length" class="px-5 py-12 text-center text-sm text-gray-500">
        No achievements configured yet.
      </div>
    </div>
  </div>
</template>

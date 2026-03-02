<script setup>
import { ref, onMounted } from 'vue'
import {
  getAdminForumTree,
  createAdminGame, updateAdminGame, deleteAdminGame,
  createAdminCategory, updateAdminCategory, deleteAdminCategory,
  createAdminForum, updateAdminForum, deleteAdminForum,
} from '../../services/api'
import { useToastStore } from '../../stores/toast'
import FaIconPicker from '../../components/FaIconPicker.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const tree = ref([])
const expandedGames = ref({})
const expandedCategories = ref({})
const showInlineForm = ref(null)
const inlineForm = ref({ name: '', slug: '', description: '', icon: 'fa-solid fa-comment' })

async function fetchTree() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminForumTree()
    tree.value = res.data.data || res.data || []
    if (tree.value.length && !Object.keys(expandedGames.value).length) {
      expandedGames.value[tree.value[0].id] = true
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load forum tree'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function toggleGame(gameId) {
  expandedGames.value[gameId] = !expandedGames.value[gameId]
}

function toggleCategory(key) {
  expandedCategories.value[key] = !expandedCategories.value[key]
}

function showForm(key) {
  showInlineForm.value = showInlineForm.value === key ? null : key
  inlineForm.value = { name: '', slug: '', description: '', icon: 'fa-solid fa-comment' }
}

function autoSlug() {
  inlineForm.value.slug = inlineForm.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

async function submitCreateGame() {
  try {
    await createAdminGame({ name: inlineForm.value.name, slug: inlineForm.value.slug, description: inlineForm.value.description })
    toast.show('Game created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create game', 'error')
  }
}

async function submitCreateCategory(gameId) {
  try {
    await createAdminCategory({ name: inlineForm.value.name, description: inlineForm.value.description, game_id: gameId })
    toast.show('Category created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create category', 'error')
  }
}

async function submitCreateForum(categoryId) {
  try {
    await createAdminForum({ name: inlineForm.value.name, slug: inlineForm.value.slug, description: inlineForm.value.description, icon: inlineForm.value.icon, category_id: categoryId })
    toast.show('Forum created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create forum', 'error')
  }
}

async function doDeleteGame(id) {
  if (!confirm('Delete this game and all its categories/forums?')) return
  try {
    await deleteAdminGame(id)
    toast.show('Game deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete game', 'error')
  }
}

async function doDeleteCategory(id) {
  if (!confirm('Delete this category and all its forums?')) return
  try {
    await deleteAdminCategory(id)
    toast.show('Category deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete category', 'error')
  }
}

async function doDeleteForum(id) {
  if (!confirm('Delete this forum?')) return
  try {
    await deleteAdminForum(id)
    toast.show('Forum deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete forum', 'error')
  }
}

async function toggleForumActive(forum) {
  try {
    await updateAdminForum(forum.id, { is_active: !forum.is_active })
    forum.is_active = !forum.is_active
    toast.show(forum.is_active ? 'Forum enabled' : 'Forum disabled')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to update forum', 'error')
  }
}

onMounted(fetchTree)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchTree" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage the forum hierarchy: games, categories, forums, and subforums.</p>
      <button @click="showForm('new-game')" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
        + Add Game
      </button>
    </div>

    <!-- Inline form for new game -->
    <div v-if="showInlineForm === 'new-game'" class="bg-gray-800 rounded-xl border border-violet-500/30 p-5 space-y-3">
      <h4 class="text-sm font-semibold text-violet-400">New Game</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input v-model="inlineForm.name" @input="autoSlug" type="text" placeholder="Game name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        <input v-model="inlineForm.slug" type="text" placeholder="slug" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        <input v-model="inlineForm.description" type="text" placeholder="Description" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
      </div>
      <div class="flex gap-2">
        <button @click="submitCreateGame" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
        <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div v-for="i in 2" :key="i" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse space-y-3">
        <div class="h-6 bg-gray-700 rounded w-40"></div>
        <div class="h-4 bg-gray-700 rounded w-64"></div>
        <div class="h-4 bg-gray-700 rounded w-48"></div>
      </div>
    </template>

    <!-- Game tree -->
    <div v-for="game in tree" :key="game.id" class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <!-- Game header -->
      <div
        class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
        @click="toggleGame(game.id)"
      >
        <div class="flex items-center gap-3">
          <svg
            class="w-4 h-4 text-gray-500 transition-transform"
            :class="expandedGames[game.id] ? 'rotate-90' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-lg">{{ game.icon }}</span>
          <span class="font-semibold text-white">{{ game.name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{{ game.categories?.length || 0 }} categories</span>
          <button @click.stop="showForm(`cat-${game.id}`)" class="px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded transition-colors">+ Category</button>
          <button @click.stop="doDeleteGame(game.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Inline form for new category -->
      <div v-if="showInlineForm === `cat-${game.id}`" class="mx-5 mb-4 bg-gray-900/50 rounded-lg border border-violet-500/30 p-4 space-y-3">
        <h4 class="text-sm font-semibold text-violet-400">New Category in {{ game.name }}</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input v-model="inlineForm.name" type="text" placeholder="Category name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
          <input v-model="inlineForm.description" type="text" placeholder="Description (optional)" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div class="flex gap-2">
          <button @click="submitCreateCategory(game.id)" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
          <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
        </div>
      </div>

      <!-- Categories & Forums -->
      <div v-if="expandedGames[game.id]" class="border-t border-gray-700/50">
        <div v-for="category in game.categories" :key="category.id">
          <!-- Category header -->
          <div
            class="flex items-center justify-between px-5 py-3 pl-10 cursor-pointer hover:bg-gray-700/30 transition-colors border-b border-gray-700/30"
            @click="toggleCategory(`${game.id}-${category.id}`)"
          >
            <div class="flex items-center gap-3">
              <svg
                class="w-3.5 h-3.5 text-gray-500 transition-transform"
                :class="expandedCategories[`${game.id}-${category.id}`] !== false ? 'rotate-90' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="font-medium text-gray-300 text-sm">{{ category.name }}</span>
              <span class="text-xs text-gray-500">{{ category.forums?.length || 0 }} forums</span>
            </div>
            <div class="flex items-center gap-2">
              <button @click.stop="showForm(`forum-${game.id}-${category.id}`)" class="px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded transition-colors">+ Forum</button>
              <button @click.stop="doDeleteCategory(category.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Inline form for new forum -->
          <div v-if="showInlineForm === `forum-${game.id}-${category.id}`" class="mx-5 ml-14 my-3 bg-gray-900/50 rounded-lg border border-violet-500/30 p-4 space-y-3">
            <h4 class="text-sm font-semibold text-violet-400">New Forum in {{ category.name }}</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input v-model="inlineForm.name" @input="autoSlug" type="text" placeholder="Forum name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="inlineForm.slug" type="text" placeholder="slug" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="inlineForm.description" type="text" placeholder="Description" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Forum Icon</label>
              <FaIconPicker v-model="inlineForm.icon" />
            </div>
            <div class="flex gap-2">
              <button @click="submitCreateForum(category.id)" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
              <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </div>

          <!-- Forums list -->
          <div v-if="expandedCategories[`${game.id}-${category.id}`] !== false">
            <div
              v-for="forum in category.forums"
              :key="forum.id"
              class="flex items-center justify-between px-5 py-2.5 pl-16 hover:bg-gray-700/20 transition-colors border-b border-gray-700/20"
            >
              <div class="flex items-center gap-3">
                <span class="text-gray-500 cursor-grab" title="Drag to reorder">⠿</span>
                <i :class="forum.icon || 'fa-solid fa-comment'" class="text-gray-400"></i>
                <div>
                  <span class="text-sm font-medium text-gray-300">{{ forum.name }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ forum.thread_count || forum.threads || 0 }} threads</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="toggleForumActive(forum)"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="forum.is_active !== false ? 'bg-violet-600' : 'bg-gray-600'"
                >
                  <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200" :class="forum.is_active !== false ? 'translate-x-6' : 'translate-x-1'" />
                </button>
                <button @click="doDeleteForum(forum.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && !tree.length && !error" class="bg-gray-800 rounded-xl border border-gray-700/50 p-12 text-center">
      <p class="text-gray-500">No games configured yet. Add your first game to get started.</p>
    </div>
  </div>
</template>

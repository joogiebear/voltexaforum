<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import {
  getAdminForumTree,
  createAdminCategory, updateAdminCategory, deleteAdminCategory,
  createAdminForum, updateAdminForum, deleteAdminForum,
  reorderCategories, reorderForums,
} from '../../services/api'
import { useToastStore } from '../../stores/toast'
import FaIconPicker from '../../components/FaIconPicker.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const tree = ref([]) // array of categories, each with .forums (which may have .subforums)
const expandedCategories = ref({})
const showInlineForm = ref(null)
const inlineForm = ref({ name: '', slug: '', description: '', icon: 'fa-solid fa-comment', parent_forum_id: null })

// Edit modal state
const editModal = reactive({
  open: false,
  type: '', // 'category' | 'forum'
  id: null,
  saving: false,
  form: {
    name: '',
    slug: '',
    icon: '',
    description: '',
    display_order: 0,
    is_active: true,
    parent_forum_id: null,
    category_id: null,
  },
})

// Flatten top-level forums for parent selection
const topLevelForums = computed(() => {
  const forums = []
  for (const cat of tree.value) {
    for (const f of (cat.forums || [])) {
      if (!f.parent_forum_id) {
        forums.push({ id: f.id, name: f.name, category_id: cat.id, category_name: cat.name })
      }
    }
  }
  return forums
})

// Filter parent options for edit modal — only top-level forums in the same category, excluding self
const editParentOptions = computed(() => {
  return topLevelForums.value.filter(f =>
    f.category_id === editModal.form.category_id && f.id !== editModal.id
  )
})

async function fetchTree() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminForumTree()
    tree.value = res.data.data || res.data || []
    // Auto-expand all categories
    for (const cat of tree.value) {
      if (expandedCategories.value[cat.id] === undefined) {
        expandedCategories.value[cat.id] = true
      }
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load forum tree'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function toggleCategory(catId) {
  expandedCategories.value[catId] = !expandedCategories.value[catId]
}

function showForm(key) {
  showInlineForm.value = showInlineForm.value === key ? null : key
  inlineForm.value = { name: '', slug: '', description: '', icon: 'fa-solid fa-comment', parent_forum_id: null }
}

function autoSlug() {
  inlineForm.value.slug = inlineForm.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

function editAutoSlug() {
  editModal.form.slug = editModal.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

// --- Create handlers ---

async function submitCreateCategory() {
  try {
    await createAdminCategory({ name: inlineForm.value.name, description: inlineForm.value.description })
    toast.show('Category created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create category', 'error')
  }
}

async function submitCreateForum(categoryId) {
  try {
    const payload = {
      name: inlineForm.value.name,
      slug: inlineForm.value.slug,
      description: inlineForm.value.description,
      icon: inlineForm.value.icon,
      category_id: categoryId,
    }
    if (inlineForm.value.parent_forum_id) {
      payload.parent_forum_id = inlineForm.value.parent_forum_id
    }
    await createAdminForum(payload)
    toast.show('Forum created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create forum', 'error')
  }
}

// --- Delete handlers ---

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
  if (!confirm('Delete this forum and all its threads?')) return
  try {
    await deleteAdminForum(id)
    toast.show('Forum deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete forum', 'error')
  }
}

// --- Edit modal ---

function openEditModal(type, item, categoryId = null) {
  editModal.type = type
  editModal.id = item.id
  editModal.form.name = item.name || ''
  editModal.form.slug = item.slug || ''
  editModal.form.icon = item.icon || ''
  editModal.form.description = item.description || ''
  editModal.form.display_order = item.display_order ?? 0
  editModal.form.is_active = item.is_active !== false
  editModal.form.parent_forum_id = item.parent_forum_id || null
  editModal.form.category_id = categoryId || item.category_id || null
  editModal.saving = false
  editModal.open = true
}

function closeEditModal() {
  editModal.open = false
}

function onEditParentChange() {
  // When parent is selected, auto-set category to match parent's category
  if (editModal.form.parent_forum_id) {
    const parent = topLevelForums.value.find(f => f.id === editModal.form.parent_forum_id)
    if (parent) {
      editModal.form.category_id = parent.category_id
    }
  }
}

async function saveEdit() {
  editModal.saving = true
  try {
    const payload = { ...editModal.form }
    if (editModal.type === 'category') {
      delete payload.parent_forum_id
      delete payload.category_id
      await updateAdminCategory(editModal.id, payload)
    } else {
      await updateAdminForum(editModal.id, payload)
    }
    toast.show(`${editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)} updated`)
    editModal.open = false
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    editModal.saving = false
  }
}

// --- Drag reorder ---

async function onCategoryDragEnd() {
  const items = tree.value.map((c, i) => ({ id: c.id, display_order: i + 1 }))
  try {
    await reorderCategories(items)
    toast.show('Categories reordered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to reorder categories', 'error')
    fetchTree()
  }
}

async function onForumDragEnd(category) {
  const items = category.forums.map((f, i) => ({ id: f.id, display_order: i + 1 }))
  try {
    await reorderForums(items)
    toast.show('Forums reordered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to reorder forums', 'error')
    fetchTree()
  }
}

// Helper: get parent forum name for a subforum
function getParentName(forum, category) {
  if (!forum.parent_forum_id) return null
  const parent = (category.forums || []).find(f => f.id === forum.parent_forum_id)
  return parent?.name || null
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
      <p class="text-sm text-gray-400">Manage the forum hierarchy: categories, forums, and subforums.</p>
      <button @click="showForm('new-category')" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
        + Add Category
      </button>
    </div>

    <!-- Inline form for new category -->
    <div v-if="showInlineForm === 'new-category'" class="bg-gray-800 rounded-xl border border-violet-500/30 p-5 space-y-3">
      <h4 class="text-sm font-semibold text-violet-400">New Category</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input v-model="inlineForm.name" type="text" placeholder="Category name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        <input v-model="inlineForm.description" type="text" placeholder="Description (optional)" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
      </div>
      <div class="flex gap-2">
        <button @click="submitCreateCategory" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
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

    <!-- Category tree (draggable) -->
    <draggable
      v-model="tree"
      item-key="id"
      handle=".cat-drag-handle"
      ghost-class="opacity-30"
      @end="onCategoryDragEnd"
      :animation="200"
    >
      <template #item="{ element: category }">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden mb-4">
          <!-- Category header -->
          <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-700/30 transition-colors">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-grip-vertical cat-drag-handle text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing"></i>
              <button @click="toggleCategory(category.id)" class="flex items-center gap-3 cursor-pointer">
                <svg
                  class="w-4 h-4 text-gray-500 transition-transform"
                  :class="expandedCategories[category.id] ? 'rotate-90' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="font-semibold text-white">{{ category.name }}</span>
              </button>
              <span
                class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                :class="category.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
              >{{ category.is_active !== false ? 'Active' : 'Inactive' }}</span>
              <span class="text-xs text-gray-500">{{ category.forums?.length || 0 }} forums</span>
            </div>
            <div class="flex items-center gap-2">
              <button @click.stop="showForm(`forum-${category.id}`)" class="px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded transition-colors">+ Forum</button>
              <button @click.stop="openEditModal('category', category)" class="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                <i class="fa-solid fa-pen-to-square text-sm"></i>
              </button>
              <button @click.stop="doDeleteCategory(category.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Inline form for new forum -->
          <div v-if="showInlineForm === `forum-${category.id}`" class="mx-5 mb-4 bg-gray-900/50 rounded-lg border border-violet-500/30 p-4 space-y-3">
            <h4 class="text-sm font-semibold text-violet-400">New Forum in {{ category.name }}</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input v-model="inlineForm.name" @input="autoSlug" type="text" placeholder="Forum name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="inlineForm.slug" type="text" placeholder="slug" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="inlineForm.description" type="text" placeholder="Description" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Forum Icon</label>
                <FaIconPicker v-model="inlineForm.icon" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Parent Forum (optional)</label>
                <select
                  v-model="inlineForm.parent_forum_id"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
                >
                  <option :value="null">None (top-level)</option>
                  <option v-for="f in topLevelForums.filter(f => f.category_id === category.id)" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="submitCreateForum(category.id)" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
              <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </div>

          <!-- Forums list (draggable) -->
          <div v-if="expandedCategories[category.id]" class="border-t border-gray-700/50">
            <draggable
              v-model="category.forums"
              item-key="id"
              handle=".forum-drag-handle"
              ghost-class="opacity-30"
              @end="onForumDragEnd(category)"
              :animation="200"
            >
              <template #item="{ element: forum }">
                <div
                  class="flex items-center justify-between px-5 py-2.5 hover:bg-gray-700/20 transition-colors border-b border-gray-700/20"
                  :class="forum.parent_forum_id ? 'pl-14' : 'pl-8'"
                >
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-grip-vertical forum-drag-handle text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing text-xs"></i>
                    <!-- Sub forum indent indicator -->
                    <div v-if="forum.parent_forum_id" class="w-1 h-6 rounded-full bg-violet-500/40 mr-1"></div>
                    <i :class="forum.icon || 'fa-solid fa-comment'" class="text-gray-400"></i>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-300">{{ forum.name }}</span>
                        <span class="text-xs text-gray-600">{{ forum.slug }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">{{ forum.thread_count || forum.threads || 0 }} threads</span>
                        <span v-if="forum.parent_forum_id" class="text-[10px] text-violet-400/70">
                          Sub forum of: {{ getParentName(forum, category) || 'parent' }}
                        </span>
                      </div>
                    </div>
                    <span
                      class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      :class="forum.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
                    >{{ forum.is_active !== false ? 'Active' : 'Inactive' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="$router.push(`/admin/forums/${forum.id}/permissions`)" class="p-1 rounded hover:bg-violet-500/20 text-gray-500 hover:text-violet-400 transition-colors" title="Permissions">
                      <i class="fa-solid fa-shield-halved text-xs"></i>
                    </button>
                    <button @click="openEditModal('forum', forum, category.id)" class="p-1 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                      <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button @click="doDeleteForum(forum.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </template>
            </draggable>

            <!-- Empty forums state -->
            <div v-if="!category.forums?.length" class="px-8 py-4 text-sm text-gray-500">
              No forums in this category yet.
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Empty state -->
    <div v-if="!loading && !tree.length && !error" class="bg-gray-800 rounded-xl border border-gray-700/50 p-12 text-center">
      <p class="text-gray-500">No categories configured yet. Add your first category to get started.</p>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModal.open" class="fixed inset-0 z-[9998] flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeEditModal"></div>
        <!-- Modal -->
        <div class="relative bg-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-5 border-b border-gray-700/50">
            <h3 class="text-lg font-semibold text-white">
              Edit {{ editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1) }}
            </h3>
          </div>
          <div class="px-6 py-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
              <input v-model="editModal.form.name" @input="editAutoSlug" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- Slug (forum only) -->
            <div v-if="editModal.type === 'forum'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Slug</label>
              <input v-model="editModal.form.slug" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- Icon (forum only) -->
            <div v-if="editModal.type === 'forum'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Icon</label>
              <FaIconPicker v-model="editModal.form.icon" />
            </div>
            <!-- Parent Forum (forum only) -->
            <div v-if="editModal.type === 'forum'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Parent Forum</label>
              <select
                v-model="editModal.form.parent_forum_id"
                @change="onEditParentChange"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
              >
                <option :value="null">None (top-level)</option>
                <option v-for="f in editParentOptions" :key="f.id" :value="f.id">{{ f.name }} ({{ f.category_name }})</option>
              </select>
            </div>
            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea v-model="editModal.form.description" rows="3" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none"></textarea>
            </div>
            <!-- Display Order -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Display Order</label>
              <input v-model.number="editModal.form.display_order" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- is_active toggle -->
            <div class="flex items-center justify-between">
              <label class="text-sm text-gray-300">Active</label>
              <button
                type="button"
                @click="editModal.form.is_active = !editModal.form.is_active"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="editModal.form.is_active ? 'bg-violet-600' : 'bg-gray-600'"
              >
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200" :class="editModal.form.is_active ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-700/50 flex justify-end gap-3">
            <button @click="closeEditModal" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            <button @click="saveEdit" :disabled="editModal.saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {{ editModal.saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

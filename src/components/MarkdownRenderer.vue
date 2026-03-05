<script setup>
import { computed, inject, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { unlockContent, getContentStatus, reportContent } from '../services/api'

const props = defineProps({
  content: { type: String, default: '' },
  renderedContent: { type: String, default: '' },
  authorId: { type: Number, default: null },
})

const isDark = inject('isDark')
const authStore = useAuthStore()
const forumStore = useForumStore()
const container = ref(null)

// Unlock modal state
const modal = ref({ show: false, hash: null, cost: 0, el: null, loading: false, error: null })

function sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

const rendered = computed(() => {
  if (props.renderedContent) return props.renderedContent
  if (!props.content) return ''
  return sanitize(marked.parse(props.content))
})

// Is the currently logged-in user the author of this content?
const isAuthor = computed(() =>
  authStore.user && props.authorId && authStore.user.id === props.authorId
)

// ─── Spoilers ───────────────────────────────────────────────────────────────
function bindSpoilers() {
  if (!container.value) return
  container.value.querySelectorAll('.spoiler-content').forEach((el) => {
    el.removeEventListener('click', toggleSpoiler)
    el.addEventListener('click', toggleSpoiler)
  })
}
function toggleSpoiler(e) {
  e.currentTarget.classList.toggle('revealed')
}

// ─── Locked content ──────────────────────────────────────────────────────────
function bindLockedContent() {
  if (!container.value) return
  container.value.querySelectorAll('.locked-content').forEach((el) => {
    if (el.dataset.bound) return
    el.dataset.bound = '1'

    const hash = el.dataset.hash
    const cost = parseInt(el.dataset.cost || '0')

    // Author sees their own content for free
    if (isAuthor.value) {
      revealContent(el, hash, true)
      return
    }

    // Add lock overlay
    addLockOverlay(el, cost)

    el.addEventListener('click', () => {
      if (el.dataset.unlocked === '1') return
      // Open confirmation modal
      modal.value = { show: true, hash, cost, el, loading: false, error: null }
    })
  })
}

function addLockOverlay(el, cost) {
  if (el.querySelector('.locked-content-overlay')) return
  const overlay = document.createElement('div')
  overlay.className = 'locked-content-overlay'
  overlay.innerHTML = `
    <i class="fa-solid fa-lock" style="font-size:1rem"></i>
    <span style="font-weight:700;font-size:0.8rem">Locked Content</span>
    <span style="font-size:0.7rem;opacity:0.8">Click to unlock for ${cost} credits</span>
  `
  el.appendChild(overlay)
}

function revealContent(el, hash, isOwner = false) {
  el.dataset.unlocked = '1'
  const inner = el.querySelector('.locked-content-inner')
  if (inner) inner.style.filter = 'none'
  const overlay = el.querySelector('.locked-content-overlay')
  if (overlay) overlay.remove()
  el.style.cursor = 'default'

  // Add author badge if owner
  if (isOwner) {
    const badge = document.createElement('div')
    badge.className = 'locked-owner-badge'
    badge.innerHTML = '<i class="fa-solid fa-eye"></i> Your content'
    el.appendChild(badge)
  }

  // Load and inject voting buttons
  loadVoting(el, hash)
}

async function loadVoting(el, hash) {
  try {
    const res = await getContentStatus(hash)
    injectVoting(el, hash, res.data)
  } catch {
    injectVoting(el, hash, { working: 0, not_working: 0, user_vote: null })
  }
}

function injectVoting(el, hash, data) {
  const existing = el.querySelector('.locked-content-voting')
  if (existing) existing.remove()

  const bar = document.createElement('div')
  bar.className = 'locked-content-voting'
  bar.dataset.hash = hash
  bar.innerHTML = buildVotingHTML(data)

  bar.querySelector('.vote-working')?.addEventListener('click', (e) => {
    e.stopPropagation()
    submitVote(el, hash, 'working')
  })
  bar.querySelector('.vote-not-working')?.addEventListener('click', (e) => {
    e.stopPropagation()
    submitVote(el, hash, 'not_working')
  })

  el.appendChild(bar)
}

function buildVotingHTML({ working, not_working, user_vote }) {
  const wActive = user_vote === 'working' ? 'vote-active-working' : ''
  const nwActive = user_vote === 'not_working' ? 'vote-active-not-working' : ''
  return `
    <span class="vote-label">Rate this content:</span>
    <button class="vote-btn vote-working ${wActive}" type="button">
      <i class="fa-solid fa-circle-check"></i> Working <span class="vote-count">${working}</span>
    </button>
    <button class="vote-btn vote-not-working ${nwActive}" type="button">
      <i class="fa-solid fa-circle-xmark"></i> Not Working <span class="vote-count">${not_working}</span>
    </button>
  `
}

async function submitVote(el, hash, status) {
  try {
    const res = await reportContent(hash, status)
    const bar = el.querySelector('.locked-content-voting')
    if (bar) bar.innerHTML = buildVotingHTML(res.data)
    // Re-bind after innerHTML update
    bar?.querySelector('.vote-working')?.addEventListener('click', (e) => { e.stopPropagation(); submitVote(el, hash, 'working') })
    bar?.querySelector('.vote-not-working')?.addEventListener('click', (e) => { e.stopPropagation(); submitVote(el, hash, 'not_working') })
  } catch (err) {
    // silent — user may not be authenticated
  }
}

// ─── Modal confirm unlock ────────────────────────────────────────────────────
async function confirmUnlock() {
  if (!modal.value.hash || modal.value.loading) return
  modal.value.loading = true
  modal.value.error = null
  try {
    const res = await unlockContent({ content_hash: modal.value.hash, cost: modal.value.cost })
    if (res.data.unlocked) {
      revealContent(modal.value.el, modal.value.hash)
      if (!res.data.already_owned) await authStore.fetchUser()
      modal.value.show = false
    }
  } catch (err) {
    modal.value.error = err.response?.data?.message || 'Failed to unlock'
  } finally {
    modal.value.loading = false
  }
}

function cancelUnlock() {
  modal.value.show = false
}

// Run on mount (rendered already has value on first render — watch alone misses it)
onMounted(() => nextTick(() => { bindSpoilers(); bindLockedContent() }))

// Re-run if content updates (e.g. edit)
watch(rendered, () => nextTick(() => { bindSpoilers(); bindLockedContent() }))

// Re-run when auth state resolves (author check may flip after user loads)
watch(isAuthor, (val) => {
  if (!val || !container.value) return
  // Clear bound flag so author bypass can be applied retroactively
  container.value.querySelectorAll('.locked-content[data-bound]').forEach((el) => {
    delete el.dataset.bound
  })
  nextTick(() => bindLockedContent())
})

onBeforeUnmount(() => {
  if (!container.value) return
  container.value.querySelectorAll('.spoiler-content').forEach((el) => {
    el.removeEventListener('click', toggleSpoiler)
  })
})
</script>

<template>
  <div>
    <div
      ref="container"
      class="markdown-content max-w-none text-sm leading-relaxed"
      :class="isDark ? 'text-gray-300' : 'text-gray-700'"
      v-html="rendered"
    />

    <!-- Unlock confirmation modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="cancelUnlock">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cancelUnlock" />
          <div
            class="relative w-full max-w-sm rounded-2xl border shadow-2xl p-6 z-10"
            :class="isDark ? 'bg-[#0f0f1a] border-[#1e1e30]' : 'bg-white border-gray-200'"
          >
            <!-- Icon -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-500/10">
              <i class="fa-solid fa-lock text-purple-400 text-xl"></i>
            </div>

            <h3 class="text-center font-bold text-lg mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">
              Unlock Content
            </h3>
            <p class="text-center text-sm mb-5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              This content costs <span class="font-bold text-purple-400">{{ modal.cost }} credits</span> to unlock.
              You currently have
              <span class="font-bold" :class="(authStore.user?.credits ?? 0) >= modal.cost ? 'text-green-400' : 'text-red-400'">
                {{ authStore.user?.credits ?? 0 }} credits
              </span>.
            </p>

            <div v-if="modal.error" class="mb-4 text-center text-sm text-red-400 bg-red-500/10 rounded-lg py-2 px-3">
              {{ modal.error }}
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                @click="cancelUnlock"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                :class="isDark ? 'border-[#1e1e30] text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="confirmUnlock"
                :disabled="modal.loading || (authStore.user?.credits ?? 0) < modal.cost"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :class="isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'"
              >
                <i v-if="modal.loading" class="fa-solid fa-spinner fa-spin mr-1"></i>
                {{ modal.loading ? 'Unlocking…' : `Unlock for ${modal.cost} credits` }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.markdown-content :deep(h1) { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
.markdown-content :deep(h2) { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
.markdown-content :deep(h3) { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
.markdown-content :deep(p) { margin-bottom: 0.75rem; }
.markdown-content :deep(strong) { font-weight: 700; }
.markdown-content :deep(em) { font-style: italic; }
.markdown-content :deep(code) {
  background: var(--bg-card, #1f2937);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
}
.markdown-content :deep(pre) {
  background: var(--bg-page, #030712);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}
.markdown-content :deep(pre code) { background: none; padding: 0; }
.markdown-content :deep(blockquote) {
  border-left: 3px solid #7c3aed;
  padding-left: 1rem;
  margin: 0.75rem 0;
  opacity: 0.85;
}
.markdown-content :deep(a) { color: #7c3aed; text-decoration: underline; }
.markdown-content :deep(ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-content :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-content :deep(li) { margin-bottom: 0.25rem; }
.markdown-content :deep(hr) { border-color: #374151; margin: 1rem 0; }
.markdown-content :deep(img) { max-width: 100%; border-radius: 0.5rem; }
.markdown-content :deep(img.emoji) {
  display: inline; height: 1.2em; width: 1.2em;
  vertical-align: -0.2em; margin: 0; border-radius: 0;
}

/* Spoiler */
.markdown-content :deep(.spoiler-content) {
  background: #1f2937; color: transparent; cursor: pointer;
  border-radius: 4px; padding: 2px 4px; user-select: none;
}
.markdown-content :deep(.spoiler-content:hover),
.markdown-content :deep(.spoiler-content.revealed) { color: inherit; }

/* @mention */
.markdown-content :deep(.mention) { color: #7c3aed; font-weight: 600; text-decoration: none; }
.markdown-content :deep(.mention:hover) { text-decoration: underline; }

/* Locked content */
.markdown-content :deep(.locked-content) {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.3);
  margin: 0.75rem 0;
  cursor: pointer;
  background: rgba(124, 58, 237, 0.04);
}
.markdown-content :deep(.locked-content-inner) {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
  padding: 1rem;
  min-height: 6rem;
}
.markdown-content :deep(.locked-content-overlay) {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1rem;
  background: rgba(0,0,0,0.55);
  color: white;
  transition: background 0.2s;
  text-align: center;
  line-height: 1.4;
}
.markdown-content :deep(.locked-content:hover .locked-content-overlay) {
  background: rgba(124, 58, 237, 0.5);
}
.markdown-content :deep(.locked-owner-badge) {
  font-size: 0.7rem;
  color: #a78bfa;
  padding: 0.25rem 0.75rem;
  text-align: right;
  opacity: 0.7;
}

/* Voting bar */
.markdown-content :deep(.locked-content-voting) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid rgba(124,58,237,0.2);
  flex-wrap: wrap;
}
.markdown-content :deep(.vote-label) {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-right: 0.25rem;
}
.markdown-content :deep(.vote-btn) {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
}
.markdown-content :deep(.vote-working) {
  border-color: rgba(16,185,129,0.3);
  color: #6ee7b7;
}
.markdown-content :deep(.vote-working:hover),
.markdown-content :deep(.vote-active-working) {
  background: rgba(16,185,129,0.15);
  border-color: #10b981;
  color: #10b981;
}
.markdown-content :deep(.vote-not-working) {
  border-color: rgba(239,68,68,0.3);
  color: #fca5a5;
}
.markdown-content :deep(.vote-not-working:hover),
.markdown-content :deep(.vote-active-not-working) {
  background: rgba(239,68,68,0.15);
  border-color: #ef4444;
  color: #ef4444;
}
.markdown-content :deep(.vote-count) {
  font-weight: 700;
  font-size: 0.7rem;
  opacity: 0.85;
}
</style>

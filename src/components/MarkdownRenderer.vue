<script setup>
import { computed, inject, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import { useAuthStore } from '../stores/auth'
import { unlockContent } from '../services/api'

const props = defineProps({
  content: { type: String, default: '' },
  renderedContent: { type: String, default: '' },
})

const isDark = inject('isDark')
const authStore = useAuthStore()
const container = ref(null)

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

function bindLockedContent() {
  if (!container.value) return
  container.value.querySelectorAll('.locked-content').forEach((el) => {
    if (el.dataset.bound) return
    el.dataset.bound = '1'

    // Add overlay
    if (!el.querySelector('.locked-content-overlay')) {
      const overlay = document.createElement('div')
      overlay.className = 'locked-content-overlay'
      overlay.innerHTML = `<i class="fa-solid fa-lock"></i><span>Click to unlock (${el.dataset.cost || '?'} credits)</span>`
      el.appendChild(overlay)
    }

    el.addEventListener('click', async () => {
      if (el.dataset.unlocked === '1') return
      const hash = el.dataset.hash
      const cost = parseInt(el.dataset.cost || '0')
      try {
        const res = await unlockContent({ content_hash: hash, cost })
        if (res.data.unlocked) {
          el.dataset.unlocked = '1'
          const inner = el.querySelector('.locked-content-inner')
          if (inner) inner.style.filter = 'none'
          const overlay = el.querySelector('.locked-content-overlay')
          if (overlay) overlay.remove()
          if (!res.data.already_owned && res.data.credits_spent) {
            await authStore.fetchUser()
          }
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to unlock'
        alert(msg)
      }
    })
  })
}

watch(rendered, () => nextTick(() => { bindSpoilers(); bindLockedContent() }))

onBeforeUnmount(() => {
  if (!container.value) return
  container.value.querySelectorAll('.spoiler-content').forEach((el) => {
    el.removeEventListener('click', toggleSpoiler)
  })
})
</script>

<template>
  <div
    ref="container"
    class="markdown-content max-w-none text-sm leading-relaxed"
    :class="isDark ? 'text-gray-300' : 'text-gray-700'"
    v-html="rendered"
  />
</template>

<style scoped>
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
.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}
.markdown-content :deep(blockquote) {
  border-left: 3px solid #7c3aed;
  padding-left: 1rem;
  margin: 0.75rem 0;
  opacity: 0.85;
}
.markdown-content :deep(a) {
  color: #7c3aed;
  text-decoration: underline;
}
.markdown-content :deep(ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-content :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-content :deep(li) { margin-bottom: 0.25rem; }
.markdown-content :deep(hr) { border-color: #374151; margin: 1rem 0; }
.markdown-content :deep(img) { max-width: 100%; border-radius: 0.5rem; }

/* s9e/TextFormatter emoji images — keep them inline sized */
.markdown-content :deep(img.emoji) {
  display: inline;
  height: 1.2em;
  width: 1.2em;
  vertical-align: -0.2em;
  margin: 0;
  border-radius: 0;
}

/* BBCode spoiler */
.markdown-content :deep(.spoiler-content) {
  background: #1f2937;
  color: transparent;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  user-select: none;
}
.markdown-content :deep(.spoiler-content:hover),
.markdown-content :deep(.spoiler-content.revealed) {
  color: inherit;
}

/* @mention links */
.markdown-content :deep(.mention) {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
}
.markdown-content :deep(.mention:hover) {
  text-decoration: underline;
}

/* Locked content */
.markdown-content :deep(.locked-content) {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.3);
  margin: 0.5rem 0;
  cursor: pointer;
}
.markdown-content :deep(.locked-content-inner) {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
  padding: 0.75rem;
  min-height: 4rem;
}
.markdown-content :deep(.locked-content-overlay) {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>

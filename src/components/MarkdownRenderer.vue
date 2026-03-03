<script setup>
import { computed, inject, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: { type: String, default: '' },
  renderedContent: { type: String, default: '' },
})

const isDark = inject('isDark')
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

watch(rendered, () => nextTick(bindSpoilers))

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
</style>

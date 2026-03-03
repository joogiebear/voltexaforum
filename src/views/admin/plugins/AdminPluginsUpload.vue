<script setup>
import { ref } from 'vue'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const isDragging = ref(false)
const uploadedFiles = ref([])

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.zip'))
  if (files.length === 0) {
    toast.show('Only .zip files are accepted', 'error')
    return
  }
  files.forEach(f => {
    uploadedFiles.value.unshift({ name: f.name, size: f.size, date: new Date().toLocaleString(), status: 'queued' })
  })
  toast.show('Plugin upload is not yet connected to a backend', 'error')
}

function onFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.name.endsWith('.zip'))
  if (files.length === 0) {
    toast.show('Only .zip files are accepted', 'error')
    return
  }
  files.forEach(f => {
    uploadedFiles.value.unshift({ name: f.name, size: f.size, date: new Date().toLocaleString(), status: 'queued' })
  })
  toast.show('Plugin upload is not yet connected to a backend', 'error')
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Upload zone -->
    <div
      class="bg-gray-800 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer"
      :class="isDragging ? 'border-violet-500 bg-violet-500/5' : 'border-gray-700 hover:border-gray-600'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="$refs.fileInput.click()"
    >
      <input ref="fileInput" type="file" accept=".zip" multiple class="hidden" @change="onFileSelect" />
      <div class="flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-full flex items-center justify-center" :class="isDragging ? 'bg-violet-500/20' : 'bg-gray-700/50'">
          <i class="fa-solid fa-cloud-arrow-up text-2xl" :class="isDragging ? 'text-violet-400' : 'text-gray-500'"></i>
        </div>
        <div>
          <p class="text-sm font-medium" :class="isDragging ? 'text-violet-300' : 'text-gray-300'">
            {{ isDragging ? 'Drop plugin here' : 'Drag & drop plugin .zip file' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">or click to browse files</p>
        </div>
      </div>
    </div>

    <!-- Recently uploaded -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <h3 class="text-base font-semibold text-white mb-4">Recently Uploaded</h3>

      <div v-if="uploadedFiles.length === 0" class="py-8 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
            <i class="fa-solid fa-puzzle-piece text-gray-500 text-xl"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-400">No plugins uploaded yet</p>
            <p class="text-xs text-gray-500 mt-1">Upload a .zip file to install a new plugin.</p>
          </div>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(file, i) in uploadedFiles"
          :key="i"
          class="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-file-zipper text-gray-500"></i>
            <div>
              <div class="text-sm text-gray-200">{{ file.name }}</div>
              <div class="text-xs text-gray-500">{{ formatSize(file.size) }} &middot; {{ file.date }}</div>
            </div>
          </div>
          <span class="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">{{ file.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

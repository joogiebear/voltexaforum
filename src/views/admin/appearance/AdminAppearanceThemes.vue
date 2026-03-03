<script setup>
const themes = [
  { name: 'Default Theme', description: 'The default dark theme with violet accents', active: true },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-white">Themes</h3>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Active theme -->
      <div
        v-for="theme in themes"
        :key="theme.name"
        class="bg-gray-800 rounded-xl border-2 p-5 space-y-3"
        :class="theme.active ? 'border-violet-500' : 'border-gray-700/50'"
      >
        <!-- Theme preview swatch -->
        <div class="h-24 rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-violet-900/30 flex items-center justify-center">
          <i class="fa-solid fa-palette text-2xl text-violet-400"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-200">{{ theme.name }}</span>
            <span v-if="theme.active" class="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ theme.description }}</p>
        </div>
      </div>

      <!-- Install theme placeholder slots -->
      <div
        v-for="i in 2"
        :key="'slot-' + i"
        class="bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700 p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] hover:border-gray-600 transition-colors cursor-pointer group"
      >
        <div class="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
          <i class="fa-solid fa-plus text-gray-500 group-hover:text-gray-400 transition-colors"></i>
        </div>
        <span class="text-xs font-medium text-gray-500 group-hover:text-gray-400 transition-colors">Install Theme</span>
      </div>
    </div>
  </div>
</template>

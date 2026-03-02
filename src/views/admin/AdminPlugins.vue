<script setup>
const pluginCapabilities = [
  { icon: '📊', text: 'Register admin panel sections' },
  { icon: '📌', text: 'Add nav menu items' },
  { icon: '⚡', text: 'Hook into credit events' },
  { icon: '🏪', text: 'Add store item types' },
  { icon: '🏆', text: 'Add achievement triggers' },
]

const codeExample = `// forum-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',

  // Register admin panel section
  adminRoutes: [
    {
      path: '/admin/my-plugin',
      component: () => import('./MyPluginAdmin.vue'),
      meta: { title: 'My Plugin' },
    },
  ],

  // Add navigation items
  navItems: [
    { to: '/my-plugin', label: 'My Feature', icon: '🔌' },
  ],

  // Hook into credit events
  hooks: {
    onCreditEarn(user, amount, reason) {
      // Handle credit earn event
    },
    onPurchase(user, item) {
      // Handle purchase event
    },
  },

  // Register custom store item type
  storeItemTypes: [
    {
      id: 'custom-command',
      label: 'Custom Command',
      onPurchase: (user, item) => {
        // Execute custom delivery logic
      },
    },
  ],

  // Register achievement triggers
  achievementTriggers: [
    {
      id: 'plugin-action',
      label: 'Plugin Action',
      check: (user, target) => {
        // Return true when achievement should unlock
      },
    },
  ],
}`
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-white">Plugin System</h2>
      <span class="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-xs font-semibold">Coming Soon</span>
    </div>

    <!-- Explanation -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-4">
      <p class="text-sm text-gray-300">
        The plugin system allows extending the forum with custom features, integrations, and automations.
        Plugins can hook into the core platform to add functionality without modifying the base code.
      </p>

      <h4 class="text-sm font-semibold text-white">What plugins will be able to do:</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="cap in pluginCapabilities"
          :key="cap.text"
          class="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-lg"
        >
          <span class="text-base">{{ cap.icon }}</span>
          <span class="text-sm text-gray-300">{{ cap.text }}</span>
        </div>
      </div>
    </div>

    <!-- Code example -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
        <h4 class="text-sm font-semibold text-white">Plugin Registration API (Preview)</h4>
        <span class="text-xs text-gray-500 font-mono">forum-plugin.js</span>
      </div>
      <pre class="p-5 overflow-x-auto text-sm leading-relaxed"><code class="text-gray-300">{{ codeExample }}</code></pre>
    </div>

    <!-- Installed Plugins empty state -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-white">Installed Plugins</h4>
        <button disabled class="px-4 py-2 bg-gray-700 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed opacity-50">
          Install Plugin
        </button>
      </div>
      <div class="text-center py-8">
        <div class="text-4xl mb-3">🧩</div>
        <p class="text-sm text-gray-500">No plugins installed</p>
        <p class="text-xs text-gray-600 mt-1">Plugins will appear here once the system is available</p>
      </div>
    </div>
  </div>
</template>

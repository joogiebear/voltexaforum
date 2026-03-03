<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getStoreItems, purchaseWithCredits, createCheckout } from '../services/api'

const isDark = inject('isDark')
const authStore = useAuthStore()

const items = ref([])
const loading = ref(true)
const error = ref(null)
const purchaseMessage = ref(null)
const purchaseError = ref(null)
const purchasingId = ref(null)

const categoryFilter = ref('all')


const categoryTabs = computed(() => {
  const cats = new Set(items.value.map(i => i.category))
  const tabs = [{ id: 'all', label: 'All' }]
  for (const cat of cats) {
    tabs.push({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })
  }
  return tabs
})

async function fetchStore() {
  loading.value = true
  error.value = null
  try {
    const res = await getStoreItems()
    items.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load store items. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStore)

const filteredItems = computed(() => {
  return items.value.filter(item => {
    if (false) return false // payment filter removed
    if (categoryFilter.value !== 'all' && item.category !== categoryFilter.value) return false
    return true
  })
})

const featuredItem = computed(() => items.value.find(i => i.featured))

function canAfford(creditPrice) {
  return authStore.credits >= creditPrice
}

async function handlePurchase(item) {
  purchaseMessage.value = null
  purchaseError.value = null
  purchasingId.value = item.id
  try {
    await purchaseWithCredits({ store_item_id: item.id, payment_method: 'credits' })
    purchaseMessage.value = `Successfully purchased ${item.name}!`
    await authStore.fetchUser()
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Purchase failed. Please try again.'
  } finally {
    purchasingId.value = null
  }
}

async function handleMoneyPurchase(item) {
  purchaseMessage.value = null
  purchaseError.value = null
  purchasingId.value = item.id
  try {
    const res = await createCheckout({ store_item_id: item.id })
    const url = res.data?.url || res.data?.checkout_url
    if (url) window.location.href = url
    else purchaseError.value = 'Could not start checkout. Please try again.'
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Checkout failed. Please try again.'
  } finally {
    purchasingId.value = null
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 rounded w-1/4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <div class="h-12 w-12 rounded-full mx-auto mb-4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="h-5 rounded w-1/2 mx-auto mb-2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="h-3 rounded w-3/4 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <span class="text-5xl">&#128533;</span>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="fetchStore"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 class="text-2xl font-bold">Store</h1>
        <div class="flex items-center gap-4">
          <div
            v-if="authStore.isLoggedIn"
            class="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold"
            :class="isDark ? 'bg-gray-800 text-purple-accent' : 'bg-purple-50 text-purple-accent'"
          >
            <i class="fa-solid fa-coins text-sm"></i>
            <span>{{ authStore.credits.toLocaleString() }} credits</span>
          </div>
          <router-link
            to="/credits"
            class="text-sm font-medium transition-colors hover:text-purple-accent"
            :class="isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Earn More Credits
          </router-link>
        </div>
      </div>

      <!-- Toast messages -->
      <div v-if="purchaseMessage" class="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center justify-between">
        {{ purchaseMessage }}
        <button @click="purchaseMessage = null" class="text-green-400 hover:text-green-300">&#10005;</button>
      </div>
      <div v-if="purchaseError" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
        {{ purchaseError }}
        <button @click="purchaseError = null" class="text-red-400 hover:text-red-300">&#10005;</button>
      </div>

      <!-- Featured banner -->
      <div
        v-if="featuredItem"
        class="rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-purple-accent/20 via-purple-accent/10 to-purple-700/20 border"
        :class="isDark ? 'border-purple-accent/30' : 'border-purple-accent/20'"
      >
        <div class="bg-gradient-to-r from-purple-accent to-purple-700 h-1" />
        <div class="p-6 flex flex-col sm:flex-row items-center gap-6">
          <span class="text-6xl">{{ featuredItem.icon }}</span>
          <div class="flex-1 text-center sm:text-left">
            <div class="text-xs font-semibold uppercase tracking-wider text-purple-accent mb-1">Most Popular</div>
            <h2 class="text-xl font-bold">{{ featuredItem.name }}</h2>
            <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ featuredItem.description }}
            </p>
          </div>
          <div v-if="featuredItem.price_money" class="text-center shrink-0">
            <div class="text-2xl font-bold text-green-400 mb-2">${{ featuredItem.price_money?.toFixed(2) }}</div>
            <button
              class="px-8 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <!-- Category tabs -->
      <div class="flex gap-2 mb-8 overflow-x-auto">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          @click="categoryFilter = tab.id"
          class="px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
          :class="categoryFilter === tab.id
            ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
            : isDark ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="filteredItems.length === 0" class="text-center py-16">
        <p class="text-4xl mb-3">&#128269;</p>
        <p class="text-lg font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No items match your filters</p>
        <button
          @click="paymentFilter = 'all'; categoryFilter = 'all'"
          class="mt-3 text-sm text-purple-accent hover:underline"
        >
          Clear filters
        </button>
      </div>

      <!-- Items grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] relative"
          :class="isDark ? 'bg-gray-900 hover:shadow-lg hover:shadow-purple-accent/10' : 'bg-white shadow-sm hover:shadow-lg hover:shadow-purple-accent/15'"
        >
          <!-- Owned banner -->
          <div
            v-if="item.owned"
            class="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400"
          >
            &#10003; Owned
          </div>

          <div class="p-5">
            <div class="text-center mb-4">
              <span class="text-5xl">{{ item.icon }}</span>
            </div>
            <h3 class="font-bold text-center text-lg">{{ item.name }}</h3>
            <p class="text-sm text-center mt-1.5 mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ item.description }}
            </p>

            <!-- Price badges -->
            <div class="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <span
                v-if="item.price_money"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/15 text-green-400"
              >
                ${{ item.price_money.toFixed(2) }}
              </span>
              <span
                v-if="item.price_credits"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
                :class="isDark ? 'bg-purple-accent/15 text-purple-accent' : 'bg-purple-50 text-purple-accent'"
              >
                <i class="fa-solid fa-coins mr-1 text-xs"></i>{{ item.price_credits.toLocaleString() }}
              </span>
            </div>

            <!-- Buttons -->
            <div v-if="!item.owned" class="flex gap-2">
              <button
                v-if="item.price_money"
                @click="handleMoneyPurchase(item)"
                :disabled="purchasingId === item.id || !authStore.isLoggedIn"
                class="flex-1 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ purchasingId === item.id ? 'Redirecting...' : `$${Number(item.price_money).toFixed(2)}` }}
              </button>
              <button
                v-if="item.price_credits && authStore.isLoggedIn"
                @click="handlePurchase(item)"
                :disabled="!canAfford(item.price_credits) || purchasingId === item.id"
                class="flex-1 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 text-sm"
                :class="canAfford(item.price_credits)
                  ? 'bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'"
                :title="!canAfford(item.price_credits) ? 'Insufficient credits' : ''"
              >
                {{ purchasingId === item.id ? 'Purchasing...' : 'Purchase' }}
              </button>
            </div>
            <div v-else class="w-full py-2.5 rounded-lg font-semibold bg-green-500/10 text-green-400 text-center text-sm">
              &#10003; Already Owned
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

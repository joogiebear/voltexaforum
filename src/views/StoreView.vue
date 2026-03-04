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

const activeSection = ref('all')

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

// Build sidebar nav: All + dynamic categories + Owned (if logged in)
const sidebarLinks = computed(() => {
  const cats = [...new Set(items.value.map(i => i.category).filter(Boolean))]
  const links = [
    { id: 'all', label: 'All Items', icon: 'fa-solid fa-store' },
    ...cats.map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: categoryIcon(cat),
    })),
  ]
  if (authStore.isLoggedIn) {
    links.push({ id: 'owned', label: 'My Purchases', icon: 'fa-solid fa-bag-shopping' })
  }
  return links
})

function categoryIcon(cat) {
  const map = {
    cosmetics: 'fa-solid fa-palette',
    rank: 'fa-solid fa-crown',
    ranks: 'fa-solid fa-crown',
    badge: 'fa-solid fa-certificate',
    badges: 'fa-solid fa-certificate',
    bundle: 'fa-solid fa-box-open',
    bundles: 'fa-solid fa-box-open',
    credits: 'fa-solid fa-coins',
    boost: 'fa-solid fa-bolt',
    boosts: 'fa-solid fa-bolt',
  }
  return map[cat.toLowerCase()] || 'fa-solid fa-tag'
}

const featuredItem = computed(() => items.value.find(i => i.featured))

const filteredItems = computed(() => {
  if (activeSection.value === 'owned') return items.value.filter(i => i.owned)
  if (activeSection.value === 'all') return items.value
  return items.value.filter(i => i.category === activeSection.value)
})

function canAfford(creditPrice) {
  return authStore.credits >= creditPrice
}

function clearMessages() {
  purchaseMessage.value = null
  purchaseError.value = null
}

async function handlePurchase(item) {
  clearMessages()
  purchasingId.value = item.id
  try {
    await purchaseWithCredits({ store_item_id: item.id, payment_method: 'credits' })
    purchaseMessage.value = `Successfully purchased ${item.name}!`
    await authStore.fetchUser()
    await fetchStore()
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Purchase failed. Please try again.'
  } finally {
    purchasingId.value = null
  }
}

async function handleMoneyPurchase(item) {
  clearMessages()
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
    <h1 class="text-2xl font-bold mb-6">Store</h1>

    <!-- Toast messages -->
    <div v-if="purchaseMessage" class="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center justify-between">
      {{ purchaseMessage }}
      <button @click="purchaseMessage = null" class="text-green-400 hover:text-green-300">&#10005;</button>
    </div>
    <div v-if="purchaseError" class="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
      {{ purchaseError }}
      <button @click="purchaseError = null" class="text-red-400 hover:text-red-300">&#10005;</button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col lg:flex-row gap-6">
      <div class="hidden lg:block w-64 shrink-0">
        <div class="rounded-xl animate-pulse h-64" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'" />
      </div>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Mobile: category dropdown -->
        <div class="lg:hidden mb-2">
          <select
            v-model="activeSection"
            class="w-full px-4 py-3 rounded-lg font-medium border transition-colors"
            :class="isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900'"
          >
            <option v-for="link in sidebarLinks" :key="link.id" :value="link.id">
              {{ link.label }}
            </option>
          </select>
        </div>

        <!-- Desktop sidebar -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div
            class="rounded-xl overflow-hidden sticky top-20"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <!-- Credits display (logged in) -->
            <template v-if="authStore.isLoggedIn">
              <div class="p-5 text-center border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <div
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg"
                  :class="isDark ? 'bg-gray-800 text-purple-accent' : 'bg-purple-50 text-purple-accent'"
                >
                  <i class="fa-solid fa-coins text-base"></i>
                  {{ authStore.credits.toLocaleString() }}
                </div>
                <p class="text-xs mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Your credits</p>
                <router-link
                  to="/credits"
                  class="text-xs font-medium text-purple-accent hover:underline mt-1 inline-block"
                >
                  Earn More &rarr;
                </router-link>
              </div>
            </template>
            <template v-else>
              <div class="p-5 text-center border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <i class="fa-solid fa-store text-3xl mb-2" :class="isDark ? 'text-gray-600' : 'text-gray-300'"></i>
                <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  <router-link to="/login" class="text-purple-accent hover:underline">Log in</router-link> to purchase
                </p>
              </div>
            </template>

            <!-- Category nav -->
            <nav class="p-2">
              <button
                v-for="link in sidebarLinks"
                :key="link.id"
                @click="activeSection = link.id; clearMessages()"
                class="w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-3"
                :class="activeSection === link.id
                  ? 'bg-purple-accent/15 text-purple-accent'
                  : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
              >
                <i :class="[link.icon, 'w-4 text-center']"></i>
                {{ link.label }}
              </button>
            </nav>
          </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1 min-w-0">

          <!-- Featured banner (only on "all" tab) -->
          <div
            v-if="featuredItem && activeSection === 'all'"
            class="rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-purple-accent/20 via-purple-accent/10 to-purple-700/20 border"
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
                <div class="text-2xl font-bold text-green-400 mb-2">${{ Number(featuredItem.price_money).toFixed(2) }}</div>
                <button
                  @click="handleMoneyPurchase(featuredItem)"
                  :disabled="!!purchasingId"
                  class="px-8 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="filteredItems.length === 0"
            class="rounded-xl p-12 text-center"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <p class="text-4xl mb-3">{{ activeSection === 'owned' ? '🛍️' : '🔍' }}</p>
            <p class="text-lg font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ activeSection === 'owned' ? "You haven't purchased anything yet." : 'No items in this category.' }}
            </p>
            <button
              v-if="activeSection !== 'all'"
              @click="activeSection = 'all'"
              class="mt-3 text-sm text-purple-accent hover:underline"
            >
              View all items
            </button>
          </div>

          <!-- Items grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    ${{ Number(item.price_money).toFixed(2) }}
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
                  <div
                    v-if="!authStore.isLoggedIn"
                    class="flex-1 py-2.5 rounded-lg text-sm text-center font-medium"
                    :class="isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'"
                  >
                    <router-link to="/login" class="text-purple-accent hover:underline">Log in</router-link> to buy
                  </div>
                </div>
                <div v-else class="w-full py-2.5 rounded-lg font-semibold bg-green-500/10 text-green-400 text-center text-sm">
                  &#10003; Already Owned
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

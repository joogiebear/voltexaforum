<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminPurchases, deliverPurchase } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const statusFilter = ref('all')
const methodFilter = ref('all')
const purchases = ref([])
const totalRevenue = ref({ money: 0, credits: 0 })

const filteredPurchases = computed(() => {
  return purchases.value.filter(p => {
    const matchStatus = statusFilter.value === 'all' || p.status === statusFilter.value
    const matchMethod = methodFilter.value === 'all' || p.method === methodFilter.value
    return matchStatus && matchMethod
  })
})

async function fetchPurchases() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminPurchases()
    const d = res.data
    purchases.value = d.data || d || []
    totalRevenue.value = d.meta?.revenue || d.revenue || { money: 0, credits: 0 }
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load purchases'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function doDeliver(purchase) {
  try {
    await deliverPurchase(purchase.id)
    purchase.status = 'completed'
    toast.show('Purchase delivered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to deliver purchase', 'error')
  }
}

function statusBadge(status) {
  const map = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    completed: 'bg-green-500/10 text-green-400',
    failed: 'bg-red-500/10 text-red-400',
    refunded: 'bg-gray-500/10 text-gray-400',
  }
  return map[status] || map.pending
}

onMounted(fetchPurchases)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchPurchases" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Revenue summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
        <template v-if="loading">
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-700 rounded w-24"></div>
            <div class="h-8 bg-gray-700 rounded w-32"></div>
          </div>
        </template>
        <template v-else>
          <div class="text-sm text-gray-400">Revenue (Money)</div>
          <div class="text-2xl font-bold text-green-400 mt-1">${{ Number(totalRevenue.money).toFixed(2) }}</div>
          <div class="text-xs text-gray-500 mt-1">This month</div>
        </template>
      </div>
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
        <template v-if="loading">
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-700 rounded w-24"></div>
            <div class="h-8 bg-gray-700 rounded w-32"></div>
          </div>
        </template>
        <template v-else>
          <div class="text-sm text-gray-400">Credits Spent</div>
          <div class="text-2xl font-bold text-violet-400 mt-1"><i class="fa-solid fa-coins text-sm mr-1"></i>{{ Number(totalRevenue.credits).toLocaleString() }}</div>
          <div class="text-xs text-gray-500 mt-1">This month</div>
        </template>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <select
        v-model="statusFilter"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>
      <select
        v-model="methodFilter"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
      >
        <option value="all">All Methods</option>
        <option value="money">Money ($)</option>
        <option value="credits">Credits</option>
      </select>
    </div>

    <!-- Purchases table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">User</th>
              <th class="px-5 py-3">Item</th>
              <th class="px-5 py-3">Method</th>
              <th class="px-5 py-3">Amount</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-24"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-28"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-8"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-28"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="p in filteredPurchases" :key="p.id" class="hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <UserAvatar :name="p.user?.username || p.user" :color="p.user?.avatar_color || p.userColor || 'bg-violet-500'" size="sm" />
                    <span class="font-medium text-gray-200">{{ p.user?.username || p.user }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-gray-300">{{ p.item?.name || p.item }}</td>
                <td class="px-5 py-3">
                  <span class="text-base">{{ p.method === 'money' ? '💳' : '' }}</span>
                  <i v-if="p.method !== 'money'" class="fa-solid fa-coins text-violet-400"></i>
                </td>
                <td class="px-5 py-3 text-gray-300 font-medium">
                  <template v-if="p.method === 'money'">${{ Number(p.amount).toFixed(2) }}</template>
                  <template v-else><i class="fa-solid fa-coins text-xs mr-0.5"></i>{{ p.amount }}</template>
                </td>
                <td class="px-5 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize" :class="statusBadge(p.status)">
                    {{ p.status }}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-400 whitespace-nowrap">{{ p.created_at || p.date }}</td>
                <td class="px-5 py-3">
                  <button
                    v-if="p.status === 'pending' || p.status === 'failed'"
                    @click="doDeliver(p)"
                    class="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-xs font-medium rounded-lg hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                  >
                    Manual Deliver
                  </button>
                  <span v-else class="text-gray-600 text-xs">—</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !filteredPurchases.length" class="px-5 py-12 text-center text-sm text-gray-500">
        No purchases found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminReports, updateAdminReport, getAdminThreads, pinThread, lockThread, solveThread, adminDeletePost } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)

// Reports
const reportTab = ref('pending')
const reports = ref({ pending: [], reviewed: [], dismissed: [] })

async function fetchReports(status) {
  try {
    const res = await getAdminReports({ status })
    reports.value[status] = res.data.data || res.data || []
  } catch {}
}

async function fetchAllReports() {
  loading.value = true
  await Promise.all([
    fetchReports('pending'),
    fetchReports('reviewed'),
    fetchReports('dismissed'),
  ])
  loading.value = false
}

async function markReviewed(report) {
  const idx = reports.value.pending.findIndex(r => r.id === report.id)
  if (idx !== -1) reports.value.pending.splice(idx, 1)
  report.status = 'reviewed'
  reports.value.reviewed.unshift(report)
  try {
    await updateAdminReport(report.id, { status: 'reviewed' })
    toast.show('Report marked as reviewed')
  } catch (e) {
    // rollback
    reports.value.reviewed = reports.value.reviewed.filter(r => r.id !== report.id)
    report.status = 'pending'
    reports.value.pending.splice(idx, 0, report)
    toast.show(e.response?.data?.message || 'Failed to update report', 'error')
  }
}

async function dismissReport(report) {
  const sourceTab = report.status === 'reviewed' ? 'reviewed' : 'pending'
  const idx = reports.value[sourceTab].findIndex(r => r.id === report.id)
  if (idx !== -1) reports.value[sourceTab].splice(idx, 1)
  report.status = 'dismissed'
  reports.value.dismissed.unshift(report)
  try {
    await updateAdminReport(report.id, { status: 'dismissed' })
    toast.show('Report dismissed')
  } catch (e) {
    reports.value.dismissed = reports.value.dismissed.filter(r => r.id !== report.id)
    report.status = sourceTab
    reports.value[sourceTab].splice(idx, 0, report)
    toast.show(e.response?.data?.message || 'Failed to dismiss report', 'error')
  }
}

const currentReports = computed(() => reports.value[reportTab.value] || [])
const pendingCount = computed(() => reports.value.pending.length)

function truncate(text, len = 80) {
  if (!text) return '—'
  return text.length > len ? text.slice(0, len) + '...' : text
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchAllReports)
</script>

<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <div class="flex border-b border-gray-700">
      <button
        v-for="tab in ['pending', 'reviewed', 'dismissed']"
        :key="tab"
        @click="reportTab = tab"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize relative"
        :class="reportTab === tab ? 'text-violet-400 border-violet-400' : 'text-gray-500 border-transparent hover:text-gray-300'"
      >
        {{ tab }}
        <span
          v-if="tab === 'pending' && pendingCount > 0"
          class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white"
        >
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- Reports Table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Reports</h2>
        <span class="text-xs text-gray-500">{{ currentReports.length }} reports</span>
      </div>

      <!-- Loading -->
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-gray-700/30 animate-pulse">
          <div class="h-4 bg-gray-700 rounded flex-1"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
          <div class="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </template>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reported By</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="currentReports.length" class="divide-y divide-gray-700/50">
            <tr v-for="report in currentReports" :key="report.id" class="hover:bg-gray-700/30 transition-colors">
              <td class="px-5 py-3">
                <span
                  class="px-2 py-0.5 rounded text-xs font-semibold"
                  :class="report.reportable_type?.includes('Thread') ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'"
                >
                  {{ report.reportable_type?.includes('Thread') ? 'Thread' : 'Post' }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-300 max-w-xs">{{ truncate(report.reportable?.body || report.reportable?.title || report.content_preview) }}</td>
              <td class="px-5 py-3 text-gray-400">{{ report.reporter?.username || report.reported_by || '—' }}</td>
              <td class="px-5 py-3 text-gray-400 max-w-xs">{{ truncate(report.reason, 60) }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(report.created_at) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="reportTab !== 'reviewed'"
                    @click="markReviewed(report)"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    Reviewed
                  </button>
                  <button
                    v-if="reportTab !== 'dismissed'"
                    @click="dismissReport(report)"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-600/30 text-gray-400 hover:bg-gray-600/50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-500">
                No {{ reportTab }} reports
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { verifyEmail, resendVerification } from '../services/api'

const isDark = inject('isDark')
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const errorMsg = ref('')
const resending = ref(false)
const resendSuccess = ref(false)

onMounted(async () => {
  const { id, hash, expires, signature } = route.query
  if (!id || !hash) {
    loading.value = false
    errorMsg.value = 'Verification link is invalid.'
    return
  }
  try {
    await verifyEmail({ id, hash, expires, signature })
    success.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Verification link invalid or expired.'
  } finally {
    loading.value = false
  }
})

async function handleResend() {
  resending.value = true
  try {
    await resendVerification()
    resendSuccess.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Failed to resend verification email.'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div
      class="w-full max-w-md rounded-xl p-8 text-center"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-lg'"
    >
      <!-- Loading -->
      <template v-if="loading">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-10 w-10 text-purple-accent" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">Verifying your email...</p>
        </div>
      </template>

      <!-- Success -->
      <template v-else-if="success">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
            <i class="fa-solid fa-check-circle text-3xl text-green-400"></i>
          </div>
          <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Email Verified!</h2>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">Your email has been verified. You can now log in.</p>
          <router-link
            to="/login"
            class="mt-2 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </router-link>
        </div>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
            <i class="fa-solid fa-circle-xmark text-3xl text-red-400"></i>
          </div>
          <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Verification Failed</h2>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ errorMsg }}</p>

          <template v-if="resendSuccess">
            <p class="text-green-400 text-sm">Verification email sent! Check your inbox.</p>
          </template>
          <template v-else>
            <button
              @click="handleResend"
              :disabled="resending"
              class="mt-2 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {{ resending ? 'Sending...' : 'Resend Verification Email' }}
            </button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

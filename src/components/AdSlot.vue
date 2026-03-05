<script setup>
import { ref, onMounted } from 'vue'
import { getAds } from '../services/api'

const props = defineProps({
  position: { type: String, required: true },
})

const currentAd = ref(null)

onMounted(async () => {
  try {
    const res = await getAds()
    const ads = res.data.data || []
    currentAd.value = ads.find(a => a.position === props.position) || null
  } catch {}
})
</script>

<template>
  <div v-if="currentAd">
    <a v-if="currentAd.url" :href="currentAd.url" target="_blank" rel="noopener noreferrer">
      <img
        v-if="currentAd.image_url"
        :src="currentAd.image_url"
        :alt="currentAd.title"
        class="w-full object-cover rounded-lg"
        :class="position === 'header' ? 'max-h-24' : 'max-h-64'"
      />
    </a>
    <img
      v-else-if="currentAd.image_url"
      :src="currentAd.image_url"
      :alt="currentAd.title"
      class="w-full object-cover rounded-lg"
      :class="position === 'header' ? 'max-h-24' : 'max-h-64'"
    />
  </div>
</template>

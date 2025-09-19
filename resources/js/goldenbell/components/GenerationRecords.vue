<template>
  <div class="generation-records w-full min-h-screen bg-white relative sm:max-w-[393px] sm:mx-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full min-h-full">
      <img 
        src="/images/poster.png" 
        alt="Golden Bell Background" 
        class="w-full h-full min-h-screen object-cover"
      />
    </div>

    <!-- Status Bar (Optional) -->
    <div class="flex w-full h-[47px] justify-center items-center relative z-10">
    </div>

    <!-- Main Container -->
    <div class="flex w-full h-[781px] pt-[24px] px-[20px] flex-col items-start gap-[24px] relative z-10">
      <!-- Header -->
      <PageHeader
        title="應援海報生成紀錄"
        :showBadge="true"
        :badgeText="`已生成：${generatedCount}/10`"
        @goBack="goBack"
      />

      <!-- Records Container -->
      <div class="flex flex-col items-start gap-[16px] w-full overflow-y-auto">
        <!-- Empty State -->
        <div v-if="records.length === 0" class="flex flex-col items-center justify-center w-full py-20">
          <div class="text-white text-center opacity-60">
            <div class="text-lg mb-2">尚未生成任何海報</div>
            <div class="text-sm">開始創建您的第一張應援海報吧！</div>
          </div>
        </div>
        
        <!-- History grid -->
        <div v-else class="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
          <div 
            v-for="(item, index) in records" 
            :key="item.id || index"
            class="flex w-full h-40 p-4 items-center gap-3 bg-[#6A6A6A] rounded-[5px] cursor-pointer hover:bg-[#7A7A7A] transition-colors"
            @click="viewHistoryItem(item)"
          >
            <div class="flex w-full flex-col items-start gap-3">
              <!-- 海報圖片區域 -->
              <div class="relative h-24 w-full rounded overflow-hidden">
                <img 
                  v-if="getHistoryImage(item)"
                  :src="getHistoryImage(item)" 
                  :alt="`生成圖片 ${index + 1}`" 
                  class="h-full w-full object-cover"
                  @error="handleImageError"
                />
                <div v-else class="h-full w-full bg-[#444444] flex items-center justify-center">
                  <span class="text-[#999999] text-xs">無圖片</span>
                </div>
                
                <!-- 應援文字覆蓋層 -->
                <div v-if="item.text" class="absolute inset-0 flex items-center justify-center p-2">
                  <div class="text-center">
                    <div class="text-white font-bold text-[10px] leading-[120%] tracking-[-0.1px] break-words">
                      {{ item.text }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 時間戳記 -->
              <div class="text-white font-normal text-xs">
                {{ formatDate(item.created_at || item.date || item.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, computed } from 'vue'
import PageHeader from './PageHeader.vue'

// Props
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['goBack', 'viewItem'])

// Computed properties
const records = computed(() => props.records)

const generatedCount = computed(() => records.value.length)

// Methods
const goBack = () => {
  emit('goBack')
}

const viewHistoryItem = (item) => {
  emit('viewItem', item)
}

const getHistoryImage = (item) => {
  // 支援多種圖片屬性名稱
  return item.imageUrl || item.image_url || item.poster_image || item.image || null
}

const handleImageError = (event) => {
  console.warn('圖片載入失敗:', event.target.src)
  // 可以在這裡設置預設圖片
  // event.target.src = '/images/default-poster.png'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // 如果不是有效日期，直接返回原字串
    return dateString
  }
  
  // 格式化為 YYYY/MM/DD HH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.generation-records {
  font-family: 'Noto Serif HK', serif;
}
</style>

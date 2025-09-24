<template>
  <div class="generation-records w-full min-h-screen bg-white relative sm:max-w-[393px] sm:mx-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full min-h-full">
      <img 
        :src="backgroundImage" 
        :alt="eventType === 'award_speech' ? 'Award Speech Background' : 'Golden Bell Background'"
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
        :title="pageTitle"
        :showBadge="true"
        :badgeText="`已生成：${generatedCount}/10`"
        @goBack="goBack"
      />

      <!-- Records Container -->
      <div class="flex flex-col items-start gap-[16px] w-full overflow-y-auto">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center w-full py-20">
          <div class="text-white text-center opacity-60">
            <div class="text-lg mb-2">載入中...</div>
            <div class="text-sm">正在獲取您的應援海報記錄</div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="apiError" class="flex flex-col items-center justify-center w-full py-20">
          <div class="text-red-400 text-center">
            <div class="text-lg mb-2">載入失敗</div>
            <div class="text-sm">{{ apiError }}</div>
            <button 
              @click="loadImageHistory"
              class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新載入
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="records.length === 0" class="flex flex-col items-center justify-center w-full py-20">
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
                
                <!-- 文字覆蓋層 - 根據事件類型調整位置 -->
                <div v-if="item.text" :class="getTextOverlayClass()" class="absolute p-1">
                  <div :class="getTextContainerClass()">
                    <div :class="getTextClass()" :style="getTextStyle()">
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
import { defineEmits, computed, onMounted, ref } from 'vue'
import PageHeader from './PageHeader.vue'
import { apiService } from '../../services/apiService.js'
import { getCurrentEventType } from '../../config/themeConfig.js'
import { getThemeImages } from '../../assets/images.js'

// Props
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['goBack', 'viewItem'])

// Reactive data
const apiRecords = ref([])
const isLoading = ref(false)
const apiError = ref('')
const eventType = getCurrentEventType() // 動態獲取當前事件類型

// Computed properties
const records = computed(() => {
  // 優先使用從 API 載入的記錄，如果沒有則使用 props
  return apiRecords.value.length > 0 ? apiRecords.value : props.records
})

const generatedCount = computed(() => records.value.length)

// 根據 event_type 動態標題
const pageTitle = computed(() => {
  return eventType === 'award_speech' ? '專屬感言卡生成紀錄' : '應援海報生成紀錄'
})

// 根據 event_type 動態背景圖片
const backgroundImage = computed(() => {
  const themeImages = getThemeImages(eventType)
  return themeImages.detailBackground  // 使用 detailBackground (award_background.png)
})

// 生命週期
onMounted(async () => {
  await loadImageHistory()
})

// Methods
/**
 * 載入圖片歷史記錄
 */
const loadImageHistory = async () => {
  console.log('🔍 [GenerationRecords] 開始載入圖片歷史記錄...')
  console.log('📡 [GenerationRecords] API 服務可用性:', apiService.isApiAvailable())
  console.log('🌐 [GenerationRecords] 當前環境:', {
    hostname: window.location.hostname,
    enableLiff: window.endpoint?.enableLiff,
    eventType: eventType,
    propsRecords: props.records.length
  })
  
  if (!apiService.isApiAvailable()) {
    console.warn('⚠️ [GenerationRecords] API 服務不可用，使用 props 中的記錄')
    apiError.value = 'API 服務不可用'
    return
  }

  try {
    isLoading.value = true
    apiError.value = ''
    
    const result = await apiService.getImageHistory(eventType)
    
    if (result && result.data) {
      // 根據 API 回應格式處理數據
      let historyData = []
      
      if (typeof result.data === 'string') {
        try {
          historyData = JSON.parse(result.data)
        } catch (e) {
          console.warn('⚠️ 無法解析歷史記錄數據:', result.data)
          historyData = []
        }
      } else if (Array.isArray(result.data)) {
        historyData = result.data
      }
      
      // 轉換數據格式以符合元件需求
      apiRecords.value = historyData.map((item, index) => ({
        id: item.id || index,
        text: item.text || '',
        imageUrl: item.image_url || item.imageUrl || null,
        created_at: item.created_at || item.timestamp || new Date().toISOString(),
        ...item // 保留其他屬性
      }))
      
      console.log('✅ 圖片歷史載入成功:', apiRecords.value)
    }
    
  } catch (error) {
    console.error('❌ 載入圖片歷史失敗:', error)
    apiError.value = error.message
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  emit('goBack')
}

const viewHistoryItem = async (item) => {
  try {
    // 如果是從 API 載入的項目且有ID，可以獲取詳細資訊
    if (item.id && apiService.isApiAvailable()) {
      console.log('🔍 查看圖片詳情:', item.id)
      
      try {
        const detailResult = await apiService.getImageDetail(item.id)
        if (detailResult && detailResult.data) {
          // 合併詳細資訊
          const detailedItem = { ...item, ...detailResult.data }
          emit('viewItem', detailedItem)
          return
        }
      } catch (error) {
        console.warn('⚠️ 無法獲取詳細資訊，使用基本資訊:', error.message)
      }
    }
    
    // 使用基本資訊
    emit('viewItem', item)
    
  } catch (error) {
    console.error('❌ 查看項目失敗:', error)
    emit('viewItem', item) // 發生錯誤時仍然嘗試顯示
  }
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

// 文字覆蓋層樣式函數
const getTextOverlayClass = () => {
  if (eventType === 'award_speech') {
    // 感言卡：文字在白色信紙區域（大約在圖片中央偏上的位置）
    return 'top-[20%] left-[30px] w-[70%]'
  } else {
    // 應援海報：文字居中
    return 'inset-0 flex items-center justify-center'
  }
}

const getTextContainerClass = () => {
  if (eventType === 'award_speech') {
    return 'w-full'  // 使用完整寬度，位置已經在 overlay 層控制
  } else {
    return 'text-center max-w-[90%]'
  }
}

const getTextClass = () => {
  if (eventType === 'award_speech') {
    // 感言卡：黑色文字，稍微大一點以便在小圖中顯示
    return 'text-black font-bold text-[10px] leading-[120%] break-words whitespace-pre-wrap'
  } else {
    // 應援海報：白色文字
    return 'text-white font-bold text-[9px] leading-[110%] break-words whitespace-pre-wrap'
  }
}

const getTextStyle = () => {
  if (eventType === 'award_speech') {
    return {
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      textAlign: 'left',
      transform: 'rotate(-3deg)',  // 配合信紙角度
      transformOrigin: 'top left'
    }
  } else {
    return {
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
      wordBreak: 'break-word',
      overflowWrap: 'break-word'
    }
  }
}
</script>

<style scoped>
.generation-records {
  font-family: 'Noto Serif HK', serif;
}
</style>

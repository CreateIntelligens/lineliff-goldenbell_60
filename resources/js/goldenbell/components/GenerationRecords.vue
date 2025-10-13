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
        :badgeText="`已生成：${generatedCount}/${maxGenerations}`"
        @goBack="goBack"
      />

      <!-- Records Container -->
      <div class="flex flex-col items-start gap-[16px] w-full overflow-y-auto">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center w-full py-20">
          <div class="text-white text-center opacity-60">
            <div class="text-lg mb-2">載入中...</div>
            <div class="text-sm">
              {{ eventType === 'award_speech' ? '正在獲取您的感言卡記錄' : '正在獲取您的應援小卡記錄' }}
            </div>
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
            <div class="text-lg mb-2">
              {{ eventType === 'award_speech' ? '尚未生成任何感言卡' : '尚未生成任何小卡' }}
            </div>
            <div class="text-sm">
              {{ eventType === 'award_speech' ? '開始創建您的第一張專屬感言卡吧！' : '開始創建您的第一張應援小卡吧！' }}
            </div>
          </div>
        </div>
        
        <!-- History grid -->
        <div v-else class="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
          <div 
            v-for="(item, index) in records" 
            :key="item.id || index"
            class="flex w-full p-3 items-center gap-3 bg-[#6A6A6A] rounded-[5px] cursor-pointer hover:bg-[#7A7A7A] transition-colors"
            @click="viewHistoryItem(item)"
          >
            <div class="flex w-full flex-col items-start gap-3">
              <!-- 小卡圖片區域 -->
              <div class="relative aspect-square w-full max-w-[150px] mx-auto rounded overflow-hidden">
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
                
                <!-- 移除文字覆蓋層 - 後端圖片已包含文字 -->
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
import { defineEmits, computed, onMounted, ref, watch } from 'vue'
import PageHeader from './PageHeader.vue'
import { apiService } from '../../services/apiService.js'
import { getCurrentEventType } from '../../config/themeConfig.js'
import { getThemeImages } from '../../assets/images.js'

// Props
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  refreshTrigger: {
    type: Number,
    default: 0
  },
  generationState: {
    type: Object,
    default: () => ({
      generationCount: 0,
      maxGenerations: 10,
      remainingCount: 10
    })
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

// 使用從 App.vue 傳來的正確計數資料
const generatedCount = computed(() => {
  // 優先使用從 generationState 傳來的正確計數
  return props.generationState?.generationCount || records.value.length
})

// 計算最大生成次數
const maxGenerations = computed(() => {
  // 優先使用從 generationState 傳來的正確限制
  return props.generationState?.maxGenerations || 10
})

// 根據 event_type 動態標題
const pageTitle = computed(() => {
  return eventType === 'award_speech' ? '專屬感言卡生成紀錄' : '應援小卡生成紀錄'
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

// 監聽 refreshTrigger 變化，重新載入資料
watch(() => props.refreshTrigger, async (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    console.log('🔄 收到刷新請求，重新載入歷史記錄...')
    await loadImageHistory()
  }
})

// Methods
/**
 * 載入圖片歷史記錄
 */
const loadImageHistory = async () => {
  
  if (!apiService.isApiAvailable()) {
    console.warn('⚠️ API 服務不可用')
    apiError.value = 'API 服務暫時不可用，請稍後再試'
    return
  }

  try {
    isLoading.value = true
    apiError.value = ''
    
    
    const result = await apiService.getImageHistory(eventType)
    
    
    if (result) {
      // 根據不同的 API 回應格式處理數據
      let historyData = []
      
      // 嘗試多種可能的資料路徑
      let rawData = null
      if (result.result && result.result.data) {
        rawData = result.result.data
      } else if (result.data) {
        rawData = result.data
      } else if (result.result) {
        rawData = result.result
      } else {
        rawData = result
      }
      
      if (typeof rawData === 'string') {
        try {
          historyData = JSON.parse(rawData)
        } catch (e) {
          console.warn('⚠️ 無法解析歷史記錄數據:', rawData)
          historyData = []
        }
      } else if (Array.isArray(rawData)) {
        historyData = rawData
      } else if (rawData && typeof rawData === 'object') {
        // 如果是物件，嘗試查找陣列屬性
        const possibleArrayKeys = ['data', 'items', 'records', 'list']
        for (const key of possibleArrayKeys) {
          if (Array.isArray(rawData[key])) {
            historyData = rawData[key]
            break
          }
        }
        if (historyData.length === 0) {
          console.warn('⚠️ 無法在物件中找到陣列資料')
        }
      } else {
        console.warn('⚠️ 無法處理的資料格式')
        historyData = []
      }
      
      // 轉換數據格式以符合元件需求，並過濾當前事件類型的記錄
      
      // 🔧 簡化過濾邏輯：完全信任後端的 event_type 標記
      const strictlyFilteredData = historyData.filter(item => {
        // 1. 基本事件類型檢查
        const itemEventType = item.event_type || item.eventType
        
        if (!itemEventType) {
          console.warn('⚠️ 發現沒有事件類型的記錄，將被過濾:', item)
          return false
        }
        
        // 2. 標準化比較
        const normalizedItemType = String(itemEventType).trim().toLowerCase()
        const normalizedCurrentType = String(eventType).trim().toLowerCase()
        const basicMatch = normalizedItemType === normalizedCurrentType
        
        // 3. 添加調試日誌
        if (basicMatch) {
          console.log('✅ 記錄匹配成功:', {
            itemId: item.id,
            eventType: itemEventType,
            textLength: (item.text || '').length,
            imageUrl: item.image_url || item.imageUrl || '無圖片'
          })
        } else {
          console.log('❌ 記錄不匹配:', {
            itemId: item.id,
            itemEventType: itemEventType,
            currentEventType: eventType,
            reason: 'event_type 不匹配'
          })
        }
        
        return basicMatch
      })
      
      // 添加過濾統計日誌
      console.log('📊 過濾統計:', {
        原始記錄數: historyData.length,
        過濾後記錄數: strictlyFilteredData.length,
        當前事件類型: eventType,
        過濾掉的記錄數: historyData.length - strictlyFilteredData.length
      })
      
      apiRecords.value = strictlyFilteredData
        .map((item, index) => ({
          id: item.id || index,
          text: item.text || '',
          imageUrl: item.image_url || item.imageUrl || null,
          created_at: item.created_at || item.timestamp || new Date().toISOString(),
          event_type: item.event_type || item.eventType || eventType, // 確保事件類型存在
          ...item // 保留其他屬性
        }))
      
    } else {
      console.warn('❌ API 回應無效或為空:', result)
      apiRecords.value = []
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

// 移除不再需要的文字樣式函數 - 後端圖片已包含文字
</script>

<style scoped>
.generation-records {
  font-family: 'Noto Serif HK', serif;
}
</style>

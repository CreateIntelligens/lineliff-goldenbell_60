<template>
  <div class="app font-primary">
    <!-- 載入中狀態 -->
    <div v-if="!isInitialized" class="loading-screen">
      <div class="loading-content">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p class="text-gray-600">金鐘獎應用載入中...</p>
      </div>
    </div>

    <!-- 主要應用內容 -->
    <div v-else class="main-content">
      <!-- 根據 event_type 選擇不同的首頁 -->
      <GoldenBellHomepage
        v-if="currentView === 'homepage' && getCurrentEventType() === 'cheer'"
        @createPoster="goToPosterCreation"
      />
      
      <AwardSpeechHomepage
        v-else-if="currentView === 'homepage' && getCurrentEventType() === 'award_speech'"
        @createPoster="goToPosterCreation"
        @viewRecords="goToImageRecord"
      />

      <!-- Poster Creation View -->
      <PosterCreation
        v-else-if="currentView === 'poster' && getCurrentEventType() === 'cheer'"
        :initialState="generationStates.cheer"
        @goToImageRecord="goToImageRecord"
        @goBack="goToHomepage"
        @posterGenerated="addGenerationRecord"
        @stateUpdated="updateGenerationState"
      />
      
      <!-- Award Poster Creation View -->
      <AwardPosterCreation
        v-else-if="currentView === 'poster' && getCurrentEventType() === 'award_speech'"
        :initialState="generationStates.award_speech"
        @goToImageRecord="goToImageRecord"
        @goBack="goToHomepage"
        @posterGenerated="addGenerationRecord"
        @stateUpdated="updateGenerationState"
      />

      <!-- Generation Records View -->
      <GenerationRecords
        v-else-if="currentView === 'records'"
        :records="generationRecords"
        :refreshTrigger="recordsRefreshTrigger"
        @goBack="goBackFromRecords"
        @viewItem="viewGenerationRecord"
      />

      <!-- Poster Detail View -->
      <PosterDetail
        v-else-if="currentView === 'detail' && selectedRecord"
        :recordData="selectedRecord"
        :generatedCount="generationRecords.length"
        @goBack="goBackToRecords"
        @regeneratePoster="regenerateFromDetail"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, computed } from 'vue'
import { liffService } from '../services/liffService.js'
import { apiService } from '../services/apiService.js'
import { API_CONFIG } from '../config/config.js'
import GoldenBellHomepage from './components/GoldenBellHomepage.vue'
import AwardSpeechHomepage from './components/AwardSpeechHomepage.vue'
import PosterCreation from './components/PosterCreation.vue'
import AwardPosterCreation from './components/AwardPosterCreation.vue'
import GenerationRecords from './components/GenerationRecords.vue'
import PosterDetail from './components/PosterDetail.vue'
import { getCurrentEventType } from '../config/themeConfig.js'

// 狀態管理
const isInitialized = ref(false)
const userId = ref('')
const liffStatus = ref({
  success: false,
  isLoggedIn: false,
  isFriend: false,
  message: '初始化中...'
})

// 視圖導航狀態
const currentView = ref('homepage') // 'homepage', 'poster', 'records', 'detail'

// 生成紀錄狀態
const generationRecords = ref([])
const selectedRecord = ref(null) // 當前查看的紀錄
const recordsRefreshTrigger = ref(0) // 用於觸發記錄頁面刷新

// 各事件類型的生成狀態追蹤
const generationStates = ref({
  cheer: {
    hasGenerated: false,
    generatedText: '',
    generationCount: 0,
    maxGenerations: 10,
    remainingCount: 10
  },
  award_speech: {
    hasGenerated: false,
    generatedText: '',
    generationCount: 0,
    maxGenerations: 10,
    remainingCount: 10
  }
})

// 計算屬性
const liffEnabled = computed(() => window.endpoint?.enableLiff || false)
const isInClient = computed(() => liffService.isInClient())
const canShare = computed(() => {
  return liffStatus.value.success && liffService.isApiAvailable('shareTargetPicker')
})

// LIFF 初始化函數
async function initializeLiff() {
  try {
    console.log('🔧 開始初始化 LIFF...')
    
    const result = await liffService.initializeLiff()
    liffStatus.value = result
    
    if (result.success && result.userId) {
      userId.value = result.userId
      console.log('✅ LIFF 初始化成功，用戶 ID:', userId.value)
    } else {
      console.log('⚠️ LIFF 初始化失敗或用戶未登入')
      userId.value = result.userId || 'unknown'
    }
    
  } catch (error) {
    console.error('❌ LIFF 初始化過程發生錯誤:', error)
    liffStatus.value = {
      success: false,
      isLoggedIn: false,
      isFriend: false,
      message: '初始化失敗: ' + error.message
    }
    userId.value = 'error_user'
  }
}

// 主要初始化函數
async function initializeApp() {
  console.log('=== 金鐘獎應用程序初始化開始 ===')

  try {
    // 初始化 LIFF (添加超時保護)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LIFF 初始化超時')), 5000)
    })
    
    await Promise.race([initializeLiff(), timeoutPromise])
    
    console.log('當前狀態:', {
      userId: userId.value,
      liffStatus: liffStatus.value,
      liffEnabled: liffEnabled.value
    })
    
    // 初始化後載入用戶歷史記錄
    await loadUserHistory()
    
  } catch (error) {
    console.error('應用初始化過程發生錯誤:', error)
    // 設置默認狀態
    liffStatus.value = {
      success: false,
      isLoggedIn: false,
      isFriend: false,
      message: '初始化超時或失敗，使用預設模式'
    }
    userId.value = 'default_user_' + Date.now()
  }
  
  console.log('=== 金鐘獎應用程序初始化完成 ===')
}

// 導航功能函數
async function goToPosterCreation() {
  console.log('導航到應援海報製作頁面')
  currentView.value = 'poster'
  
  // 進入海報製作頁面時，確保載入最新的計數資料
  if (apiService.isApiAvailable()) {
    const currentEventType = getCurrentEventType()
    try {
      const countData = await apiService.getImageCount(currentEventType)
      if (countData && countData.data) {
        generationStates.value[currentEventType].generationCount = parseInt(countData.data.current_count) || 0
        generationStates.value[currentEventType].maxGenerations = parseInt(countData.data.limit) || 10
        generationStates.value[currentEventType].remainingCount = parseInt(countData.data.remaining) || 10
        console.log('🔄 更新海報製作頁面計數:', countData.data)
      }
    } catch (error) {
      console.warn('⚠️ 載入計數資料失敗:', error.message)
    }
  }
}

function goToHomepage() {
  currentView.value = 'homepage'
}

async function goToImageRecord() {
  console.log('導航到圖片生成紀錄頁面')
  currentView.value = 'records'
  
  // 觸發記錄頁面重新載入資料
  recordsRefreshTrigger.value = Date.now()
}

function goBackFromRecords() {
  const eventType = getCurrentEventType()
  
  if (eventType === 'award_speech') {
    console.log('從感言卡生成紀錄返回到感言卡製作頁面')
    currentView.value = 'poster'
  } else {
    console.log('從應援海報生成紀錄返回到應援海報製作頁面')
    currentView.value = 'poster'
  }
}

// 生成紀錄相關函數
function addGenerationRecord(posterData) {
  const currentEventType = getCurrentEventType()
  
  const newRecord = {
    id: Date.now(), // 使用時間戳作為唯一 ID
    imageUrl: posterData.imageUrl || '', // 海報圖片 URL
    image_url: posterData.imageUrl || '', // 備用屬性名
    poster_image: posterData.imageUrl || '', // 備用屬性名
    text: posterData.text || '', // 應援文字
    created_at: new Date().toISOString(), // 創建時間
    timestamp: new Date().toISOString(), // 備用時間屬性
    date: new Date().toISOString() // 備用時間屬性
  }
  
  // 檢查是否已存在相同的記錄（避免重複）
  const existingRecordIndex = generationRecords.value.findIndex(record => 
    record.text === newRecord.text && 
    Math.abs(new Date(record.created_at) - new Date(newRecord.created_at)) < 5000 // 5秒內的重複
  )
  
  if (existingRecordIndex === -1) {
    // 添加到紀錄開頭（最新的在前面）
    generationRecords.value.unshift(newRecord)
  } else {
    // 更新現有記錄
    generationRecords.value[existingRecordIndex] = { ...generationRecords.value[existingRecordIndex], ...newRecord }
  }
  
  // 更新對應事件類型的生成狀態
  if (generationStates.value[currentEventType]) {
    generationStates.value[currentEventType].hasGenerated = true
    generationStates.value[currentEventType].generatedText = posterData.text || ''
    generationStates.value[currentEventType].generationCount = posterData.generationCount || generationStates.value[currentEventType].generationCount + 1
    
    // 如果有從 posterData 傳來的計數資訊，更新它
    if (posterData.maxGenerations !== undefined) {
      generationStates.value[currentEventType].maxGenerations = posterData.maxGenerations
    }
    if (posterData.remainingCount !== undefined) {
      generationStates.value[currentEventType].remainingCount = posterData.remainingCount
    }
  }
  
  console.log('新增生成紀錄:', newRecord)
  console.log('更新生成狀態:', generationStates.value[currentEventType])
  console.log('目前總紀錄數:', generationRecords.value.length)
  
  // 觸發記錄頁面刷新（如果有需要的話）
  recordsRefreshTrigger.value = Date.now()
}

function updateGenerationState(eventType, stateData) {
  if (generationStates.value[eventType]) {
    Object.assign(generationStates.value[eventType], stateData)
    console.log('更新生成狀態:', eventType, stateData)
  }
}

async function loadUserHistory() {
  if (!apiService.isApiAvailable()) {
    console.warn('⚠️ API 服務不可用，跳過歷史記錄載入')
    return
  }

  try {
    console.log('📚 開始載入用戶歷史記錄和計數資料...')
    
    // 並行載入歷史記錄和計數資料
    const [cheerHistory, awardHistory, cheerCount, awardCount] = await Promise.allSettled([
      apiService.getImageHistory('cheer'),
      apiService.getImageHistory('award_speech'),
      apiService.getImageCount('cheer'),
      apiService.getImageCount('award_speech')
    ])
    
    // 更新計數狀態
    if (cheerCount.status === 'fulfilled' && cheerCount.value?.data) {
      const data = cheerCount.value.data
      generationStates.value.cheer.generationCount = parseInt(data.current_count) || 0
      generationStates.value.cheer.maxGenerations = parseInt(data.limit) || 10
      generationStates.value.cheer.remainingCount = parseInt(data.remaining) || 10
      console.log('✅ 載入應援海報計數:', data)
    }
    
    if (awardCount.status === 'fulfilled' && awardCount.value?.data) {
      const data = awardCount.value.data
      generationStates.value.award_speech.generationCount = parseInt(data.current_count) || 0
      generationStates.value.award_speech.maxGenerations = parseInt(data.limit) || 10
      generationStates.value.award_speech.remainingCount = parseInt(data.remaining) || 10
      console.log('✅ 載入感言卡計數:', data)
    }
    
    const allHistoryRecords = []
    
    // 處理應援海報歷史記錄
    if (cheerHistory.status === 'fulfilled') {
      const records = parseHistoryData(cheerHistory.value, 'cheer')
      allHistoryRecords.push(...records)
    }
    
    // 處理感言卡歷史記錄
    if (awardHistory.status === 'fulfilled') {
      const records = parseHistoryData(awardHistory.value, 'award_speech')
      allHistoryRecords.push(...records)
    }
    
    // 按時間排序並更新記錄
    if (allHistoryRecords.length > 0) {
      allHistoryRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      generationRecords.value = allHistoryRecords
      console.log('✅ 總共載入歷史記錄:', allHistoryRecords.length, '筆')
      
      // 更新各事件類型的狀態
      updateStatesFromHistory(allHistoryRecords)
    } else {
      console.log('📝 沒有找到歷史記錄')
    }
    
    console.log('🎯 最終計數狀態:', {
      cheer: generationStates.value.cheer,
      award_speech: generationStates.value.award_speech
    })
    
  } catch (error) {
    console.error('❌ 載入用戶歷史記錄失敗:', error)
  }
}

// 解析歷史數據的通用函數
function parseHistoryData(historyResult, eventType) {
  if (!historyResult) return []
  
  let historyData = null
  
  // 智能解析 API 回應格式
  if (historyResult.result && historyResult.result.data) {
    historyData = historyResult.result.data
  } else if (historyResult.data) {
    historyData = historyResult.data
  } else if (historyResult.result) {
    historyData = historyResult.result
  } else if (Array.isArray(historyResult)) {
    historyData = historyResult
  }
  
  // 解析 JSON 字串
  if (typeof historyData === 'string') {
    try {
      historyData = JSON.parse(historyData)
    } catch (e) {
      console.warn('⚠️ 無法解析 JSON:', e)
      return []
    }
  }
  
  // 處理陣列數據
  if (!Array.isArray(historyData)) return []
  
  return historyData.map((item, index) => ({
    id: item.id || `${eventType}_${Date.now()}_${index}`,
    imageUrl: item.image_url || item.imageUrl || item.poster_image || null,
    image_url: item.image_url || item.imageUrl || item.poster_image || null,
    poster_image: item.image_url || item.imageUrl || item.poster_image || null,
    text: item.text || item.content || '',
    created_at: item.created_at || item.timestamp || item.date || new Date().toISOString(),
    timestamp: item.created_at || item.timestamp || item.date || new Date().toISOString(),
    date: item.created_at || item.timestamp || item.date || new Date().toISOString(),
    event_type: eventType
  }))
}

// 從歷史記錄更新狀態
function updateStatesFromHistory(records) {
  // 重置狀態
  generationStates.value.cheer.hasGenerated = false
  generationStates.value.award_speech.hasGenerated = false
  
  // 根據記錄更新狀態
  records.forEach(record => {
    const eventType = record.event_type
    if (generationStates.value[eventType]) {
      generationStates.value[eventType].hasGenerated = true
      if (!generationStates.value[eventType].generatedText) {
        generationStates.value[eventType].generatedText = record.text
      }
    }
  })
}

function viewGenerationRecord(record) {
  console.log('查看生成紀錄:', record)
  selectedRecord.value = record
  currentView.value = 'detail'
}

function goBackToRecords() {
  selectedRecord.value = null
  currentView.value = 'records'
}

function regenerateFromDetail(recordData) {
  console.log('從詳細頁面重新生成，導航到製作頁面:', recordData)
  
  // 導航到海報製作頁面
  currentView.value = 'poster'
}

// LIFF 分享功能
async function shareToFriends() {
  try {
    if (!canShare.value) {
      alert('分享功能目前不可用')
      return
    }
    
    console.log('🔗 開啟分享選擇器...')
    
    // 準備要分享的訊息
    const messages = [
      {
        type: 'text',
        text: `🏆 我正在使用金鐘獎 LIFF 應用！\n用戶 ID: ${userId.value}\n快來一起體驗吧！`
      }
    ]
    
    // 開啟分享選擇器
    await liffService.shareTargetPicker(messages)
    console.log('✅ 分享選擇器已開啟')
    
  } catch (error) {
    console.error('❌ 分享失敗:', error)
    
    if (liffEnabled.value) {
      alert(`分享失敗: ${error.message}`)
    } else {
      alert('開發模式下無法使用分享功能\n請在 LINE 應用內測試')
    }
  }
}

// 生命週期
onBeforeMount(() => {
  // 立即設置為已初始化，避免無限載入
  isInitialized.value = true
  
  // 異步初始化 LIFF，但不阻塞 UI
  initializeApp().catch(error => {
    console.error('初始化失敗:', error)
    liffStatus.value = {
      success: false,
      isLoggedIn: false,
      isFriend: false,
      message: '初始化失敗: ' + error.message
    }
  })
})

onMounted(() => {
  console.log('Vue 組件已掛載')
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #000000; /* 改為深色背景 */
  font-family: 'Noto Serif HK', serif;
}

.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #000000; /* 改為深色背景 */
}

.loading-content {
  text-align: center;
  padding: 2rem;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .loading-content {
    padding: 1rem;
  }
}

.main-content {
  position: relative;
  width: 100%;
  overflow-x: hidden;
}
</style>
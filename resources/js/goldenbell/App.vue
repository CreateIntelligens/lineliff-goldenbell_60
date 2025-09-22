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
      <!-- Golden Bell Homepage -->
      <GoldenBellHomepage
        v-if="currentView === 'homepage'"
        @createPoster="goToPosterCreation"
      />

      <!-- Poster Creation View -->
      <PosterCreation
        v-else-if="currentView === 'poster'"
        @goToImageRecord="goToImageRecord"
        @goBack="goToHomepage"
        @posterGenerated="addGenerationRecord"
      />

      <!-- Generation Records View -->
      <GenerationRecords
        v-else-if="currentView === 'records'"
        :records="generationRecords"
        @goBack="goToHomepage"
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
import { API_CONFIG } from '../config/config.js'
import GoldenBellHomepage from './components/GoldenBellHomepage.vue'
import PosterCreation from './components/PosterCreation.vue'
import GenerationRecords from './components/GenerationRecords.vue'
import PosterDetail from './components/PosterDetail.vue'

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
function goToPosterCreation() {
  console.log('導航到應援海報製作頁面')
  currentView.value = 'poster'
}

function goToHomepage() {
  currentView.value = 'homepage'
}

function goToImageRecord() {
  console.log('導航到圖片生成紀錄頁面')
  currentView.value = 'records'
}

// 生成紀錄相關函數
function addGenerationRecord(posterData) {
  const newRecord = {
    id: Date.now(), // 使用時間戳作為唯一 ID
    imageUrl: posterData.imageUrl || '/images/poster.png', // 海報圖片 URL
    image_url: posterData.imageUrl || '/images/poster.png', // 備用屬性名
    poster_image: posterData.imageUrl || '/images/poster.png', // 備用屬性名
    text: posterData.text || '', // 應援文字
    created_at: new Date().toISOString(), // 創建時間
    timestamp: new Date().toISOString(), // 備用時間屬性
    date: new Date().toISOString() // 備用時間屬性
  }
  
  // 添加到紀錄開頭（最新的在前面）
  generationRecords.value.unshift(newRecord)
  
  console.log('新增生成紀錄:', newRecord)
  console.log('目前總紀錄數:', generationRecords.value.length)
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
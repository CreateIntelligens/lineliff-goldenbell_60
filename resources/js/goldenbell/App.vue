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
      <!-- Header -->
      <header class="app-header">
        <h1 class="text-2xl font-bold text-center py-4">金鐘獎 LIFF</h1>
        
        <!-- 開發資訊 (僅在調試模式顯示) -->
        <div v-if="showDebugInfo" class="debug-info bg-gray-100 p-3 m-4 rounded-lg text-sm">
          <p><strong>用戶 ID:</strong> {{ userId }}</p>
          <p><strong>LIFF 狀態:</strong> {{ liffStatus.message }}</p>
          <p><strong>環境:</strong> {{ isInClient ? 'LINE 應用內' : '瀏覽器' }}</p>
          <p><strong>LIFF 開關:</strong> {{ liffEnabled ? '開啟' : '關閉 (開發模式)' }}</p>
        </div>
      </header>

      <!-- 主要內容區域 -->
      <main class="app-main p-4">
        <div class="welcome-section text-center mb-8">
          <h2 class="text-xl font-semibold mb-4">歡迎使用金鐘獎 LIFF 應用</h2>
          
          <!-- 用戶資訊 -->
          <div class="user-info bg-blue-50 p-4 rounded-lg mb-6">
            <p class="text-gray-700">
              <span v-if="liffStatus.isLoggedIn">
                👋 您好！用戶 ID: {{ userId }}
              </span>
              <span v-else>
                🎭 開發模式：使用模擬用戶
              </span>
            </p>
            
            <p v-if="liffStatus.isFriend" class="text-green-600 mt-2">
              ✅ 已加入好友
            </p>
            <p v-else-if="liffStatus.isLoggedIn" class="text-orange-600 mt-2">
              ⚠️ 尚未加入好友
            </p>
          </div>

           <!-- 文字過濾測試區域 -->
           <div class="filter-test-section mb-8">
             <h3 class="text-lg font-medium mb-4">📝 文字過濾測試</h3>
             
             <div class="max-w-md mx-auto">
               <TextInputFilter
                 ref="textFilterRef"
                 :placeholder="'金鐘60是最喜歡的努力創作者的舞台！願每份心血都能獲得肯定，每份真情都能被正視！滿台灣影視人才濟濟…'"
                 :max-length="50"
                 :show-preview="true"
                 :show-stats="showDebugInfo"
                 :debug-mode="showDebugInfo"
                 @input="onTextInput"
                 @filtered="onTextFiltered"
                 @warning="onTextWarning"
                 @valid="onTextValid"
               />
               
               <!-- 測試按鈕 -->
               <div class="mt-4 space-y-2">
                 <button 
                   @click="testFilterWithSample"
                   class="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded-lg transition-colors text-sm"
                 >
                   🧪 測試過濾功能
                 </button>
                 
                 <button 
                   @click="clearFilterInput"
                   class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                 >
                   🗑️ 清空內容
                 </button>
               </div>
               
               <!-- 結果顯示 -->
               <div v-if="filterResult" class="mt-4 p-3 bg-gray-100 rounded-lg">
                 <h4 class="font-medium text-sm mb-2">過濾結果：</h4>
                 <p class="text-sm text-gray-700">{{ filterResult }}</p>
               </div>
             </div>
           </div>

          <!-- 開發工具 -->
          <div v-if="showDebugInfo" class="dev-tools mt-8 p-4 bg-yellow-50 rounded-lg">
            <h4 class="font-medium mb-3">開發工具</h4>
            <div class="flex flex-wrap gap-2 justify-center">
              <button 
                @click="toggleLiffMode"
                class="dev-btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                切換 LIFF 模式
              </button>
              
              <button 
                @click="refreshUser"
                class="dev-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                重新載入用戶
              </button>
              
              <button 
                @click="showLiffInfo"
                class="dev-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                LIFF 資訊
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, computed } from 'vue'
import { liffService } from '../services/liffService.js'
import { API_CONFIG } from '../config/config.js'
import TextInputFilter from './components/TextInputFilter.vue'
// import { apiService } from '../services/apiService.js'  

// 狀態管理
const isInitialized = ref(false)
const userId = ref('')
const liffStatus = ref({
  success: false,
  isLoggedIn: false,
  isFriend: false,
  message: '初始化中...'
})

// 文字過濾相關狀態
const textFilterRef = ref(null)
const filterResult = ref('')

// 計算屬性
const showDebugInfo = computed(() => API_CONFIG.debug)
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

// 功能函數
function showFeature(featureName) {
  console.log(`顯示功能: ${featureName}`)
  alert(`功能 ${featureName} 即將推出！`)
}

// 文字過濾相關函數
function onTextInput(data) {
  console.log('文字輸入:', data)
}

function onTextFiltered(data) {
  console.log('文字已過濾:', data)
  filterResult.value = `原文: "${data.originalText}"\n過濾後: "${data.filteredText}"`
}

function onTextWarning(warnings) {
  console.log('過濾警告:', warnings)
}

function onTextValid(data) {
  console.log('文字驗證通過:', data)
  filterResult.value = `✅ 驗證通過: "${data.filteredText}"`
}

function testFilterWithSample() {
  if (textFilterRef.value) {
    // 測試包含各種過濾詞的範例
    const sampleTexts = [
      '我要為金鐘60加油！這些智障評審真的很廢物。',
      '金鐘獎真棒！有興趣投資賺錢的加LINE群組。',
      '支持台獨運動！金鐘獎萬歲！',
      '金鐘60最棒的節目就是這個了！',
    ]
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)]
    textFilterRef.value.setInputText(randomText)
  }
}

function clearFilterInput() {
  if (textFilterRef.value) {
    textFilterRef.value.clearInput()
    filterResult.value = ''
  }
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

// 開發工具函數
function toggleLiffMode() {
  const newValue = !window.endpoint.enableLiff
  window.endpoint.enableLiff = newValue
  console.log(`LIFF 模式已${newValue ? '開啟' : '關閉'}`)
  alert(`LIFF 模式已${newValue ? '開啟' : '關閉'}，請重新載入頁面生效`)
}

function refreshUser() {
  console.log('重新載入用戶資料...')
  initializeLiff()
}

function showLiffInfo() {
  const info = liffService.getStatus()
  const devInfo = liffService.getDevInfo()
  
  console.log('LIFF 狀態:', info)
  console.log('開發資訊:', devInfo)
  
  alert(`LIFF 狀態:\n已初始化: ${info.isInitialized}\n已登入: ${info.isLoggedIn}\n用戶 ID: ${info.userId}`)
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
  
  // 在調試模式下輸出額外資訊
  if (showDebugInfo.value) {
    console.log('🔧 調試模式已開啟')
    console.log('當前配置:', API_CONFIG)
    console.log('LIFF 開發資訊:', liffService.getDevInfo())
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #ffffff;
}

.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
}

.loading-content {
  text-align: center;
  padding: 2rem;
}

.app-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.app-main {
  max-width: 600px;
  margin: 0 auto;
}

.feature-btn {
  font-family: 'Noto Serif HK', serif;
  font-weight: 500;
}

.dev-btn {
  font-family: 'Noto Serif HK', serif;
}

.debug-info {
  font-family: 'Noto Serif HK', serif;
  border: 1px solid #d1d5db;
}

.dev-tools {
  border: 1px solid #fbbf24;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .app-main {
    padding: 1rem;
  }
  
  .welcome-section h2 {
    font-size: 1.25rem;
  }
}
</style>

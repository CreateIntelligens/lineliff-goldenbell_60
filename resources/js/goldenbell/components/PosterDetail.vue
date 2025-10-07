<template>
  <div class="poster-detail w-full min-h-screen bg-white relative sm:max-w-[393px] sm:mx-auto overflow-y-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full h-full">
      <img 
        :src="backgroundImage" 
        :alt="eventType === 'award_speech' ? 'Award Speech Background' : 'Golden Bell Background'"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Main Content -->
    <div class="flex w-full pt-[47px] px-[20px] pb-[40px] flex-col items-start gap-[42px] relative z-10">
      <!-- Content Container -->
      <div class="flex flex-col items-center gap-[24px] w-full">
        <!-- Header -->
        <PageHeader
          :title="pageTitle"
          :showBadge="true"
          :badgeText="`已生成：${generatedCount}/${maxGenerations}`"
          @goBack="goBack"
        />

        <!-- Image Section -->
        <div class="flex flex-col items-start gap-[8px] w-full">
          <!-- Poster Preview -->
          <div class="relative h-[353px] w-full rounded-[4px] overflow-hidden">
            <img 
              class="h-full w-full object-cover"
              :src="recordData.imageUrl || recordData.image_url || recordData.poster_image || getThemeImages(eventType).poster"
              alt="Poster Detail"
            />
            
            <!-- 移除文字覆蓋層 - 後端圖片已包含文字 -->
          </div>
          
          <!-- Generation Info -->
          <div class="flex justify-between items-center w-full">
            <!-- <div class="text-[#9D9D9D] font-bold text-[10px] leading-[100%] tracking-[0.6px]">
              生成時間：{{ formatDate(recordData.created_at || recordData.date || recordData.timestamp) }}
            </div> -->
            <div class="text-[#9D9D9D] font-bold text-[10px] leading-[100%] tracking-[0.6px]" v-if="recordData.isRegeneration">
              重新生成
            </div>
          </div>

          <!-- Button Container -->
          <div class="flex items-center gap-[8px] w-full">
            <!-- Regenerate Button -->
            <div
              class="flex w-[150px] h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
              style="background: linear-gradient(180deg, #E8FF02 -77.78%, #000 166.67%)"
              @click.stop="regeneratePoster"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                重新生成
              </div>
            </div>

            <!-- Download Button -->
            <div
              class="flex w-[150px] h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
              style="background: linear-gradient(180deg, #A4A4A4 -77.78%, #000 166.67%)"
              @click.stop="downloadToOfficial"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                下載至官方帳號
              </div>
            </div>

            <!-- Share Icon Button -->
            <div
              class="flex w-[37px] h-[36px] justify-center items-center gap-[10px] rounded-[6px] cursor-pointer hover:opacity-90 transition-opacity shadow-[0_0_4px_0_rgba(0,0,0,0.25)]"
              style="background: linear-gradient(180deg, #A4A4A4 -77.78%, #000 166.67%)"
              @click.stop="sharePoster"
            >
              <svg class="w-[22px] h-[22px] flex-shrink-0" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.0835 20.1663C15.3196 20.1663 14.6703 19.899 14.1356 19.3643C13.6009 18.8295 13.3335 18.1802 13.3335 17.4163C13.3335 17.3247 13.3564 17.1108 13.4022 16.7747L6.96266 13.0163C6.71822 13.2455 6.43558 13.425 6.11475 13.5549C5.79391 13.6847 5.45016 13.7497 5.0835 13.7497C4.31961 13.7497 3.6703 13.4823 3.13558 12.9476C2.60086 12.4129 2.3335 11.7636 2.3335 10.9997C2.3335 10.2358 2.60086 9.58648 3.13558 9.05176C3.6703 8.51704 4.31961 8.24967 5.0835 8.24967C5.45016 8.24967 5.79391 8.3146 6.11475 8.44447C6.43558 8.57433 6.71822 8.75384 6.96266 8.98301L13.4022 5.22467C13.3717 5.11773 13.3526 5.0146 13.345 4.9153C13.3373 4.81599 13.3335 4.70523 13.3335 4.58301C13.3335 3.81912 13.6009 3.16981 14.1356 2.63509C14.6703 2.10037 15.3196 1.83301 16.0835 1.83301C16.8474 1.83301 17.4967 2.10037 18.0314 2.63509C18.5661 3.16981 18.8335 3.81912 18.8335 4.58301C18.8335 5.3469 18.5661 5.9962 18.0314 6.53092C17.4967 7.06565 16.8474 7.33301 16.0835 7.33301C15.7168 7.33301 15.3731 7.26808 15.0522 7.13822C14.7314 7.00835 14.4488 6.82884 14.2043 6.59967L7.76475 10.358C7.7953 10.465 7.8144 10.5681 7.82204 10.6674C7.82968 10.7667 7.8335 10.8775 7.8335 10.9997C7.8335 11.1219 7.82968 11.2327 7.82204 11.332C7.8144 11.4313 7.7953 11.5344 7.76475 11.6413L14.2043 15.3997C14.4488 15.1705 14.7314 14.991 15.0522 14.8611C15.3731 14.7313 15.7168 14.6663 16.0835 14.6663C16.8474 14.6663 17.4967 14.9337 18.0314 15.4684C18.5661 16.0031 18.8335 16.6525 18.8335 17.4163C18.8335 18.1802 18.5661 18.8295 18.0314 19.3643C17.4967 19.899 16.8474 20.1663 16.0835 20.1663ZM16.0835 18.333C16.3432 18.333 16.5609 18.2452 16.7366 18.0695C16.9123 17.8938 17.0002 17.6761 17.0002 17.4163C17.0002 17.1566 16.9123 16.9389 16.7366 16.7632C16.5609 16.5875 16.3432 16.4997 16.0835 16.4997C15.8238 16.4997 15.6061 16.5875 15.4304 16.7632C15.2547 16.9389 15.1668 17.1566 15.1668 17.4163C15.1668 17.6761 15.2547 17.8938 15.4304 18.0695C15.6061 18.2452 15.8238 18.333 16.0835 18.333ZM5.0835 11.9163C5.34322 11.9163 5.56093 11.8285 5.73662 11.6528C5.91232 11.4771 6.00016 11.2594 6.00016 10.9997C6.00016 10.74 5.91232 10.5222 5.73662 10.3465C5.56093 10.1709 5.34322 10.083 5.0835 10.083C4.82377 10.083 4.60607 10.1709 4.43037 10.3465C4.25468 10.5222 4.16683 10.74 4.16683 10.9997C4.16683 11.2594 4.25468 11.4771 4.43037 11.6528C4.60607 11.8285 4.82377 11.9163 5.0835 11.9163ZM16.0835 5.49967C16.3432 5.49967 16.5609 5.41183 16.7366 5.23613C16.9123 5.06044 17.0002 4.84273 17.0002 4.58301C17.0002 4.32329 16.9123 4.10558 16.7366 3.92988C16.5609 3.75419 16.3432 3.66634 16.0835 3.66634C15.8238 3.66634 15.6061 3.75419 15.4304 3.92988C15.2547 4.10558 15.1668 4.32329 15.1668 4.58301C15.1668 4.84273 15.2547 5.06044 15.4304 5.23613C15.6061 5.41183 15.8238 5.49967 16.0835 5.49967Z" fill="white"/>
              </svg>
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
import { liffService } from '../../services/liffService.js'
import { posterImageService } from '../../services/posterImageService.js'
import { getCurrentEventType } from '../../config/themeConfig.js'
import { getThemeImages } from '../../assets/images.js'

// Props
const props = defineProps({
  recordData: {
    type: Object,
    required: true
  },
  generatedCount: {
    type: Number,
    default: 0
  },
  maxGenerations: {
    type: Number,
    default: 10
  }
})

// Emits
const emit = defineEmits(['goBack', 'regeneratePoster'])

// 動態獲取當前事件類型
const eventType = getCurrentEventType()

// 根據 event_type 動態標題
const pageTitle = computed(() => {
  return eventType === 'award_speech' ? '專屬感言卡生成紀錄' : '應援海報生成紀錄'
})

// 根據 event_type 動態背景圖片
const backgroundImage = computed(() => {
  const themeImages = getThemeImages(eventType)
  return themeImages.detailBackground
})

// Methods
const goBack = () => {
  emit('goBack')
}

const regeneratePoster = (event) => {
  // 阻止事件冒泡，防止意外觸發其他功能
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  console.log('🔄 重新生成海報被點擊:', props.recordData)
  console.log('📝 只執行重新生成功能，不觸發分享')
  
  emit('regeneratePoster', props.recordData)
}

// 將相對路徑轉換為絕對 URL 的輔助函數
const convertToAbsoluteUrl = (url) => {
  if (!url) return url
  
  // 如果已經是絕對 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 對於本地圖片路徑，確保正確處理
  if (url.startsWith('/')) {
    // 使用當前頁面的 origin 作為基礎 URL
    return `${window.location.origin}${url}`
  }
  
  // 如果是相對路徑（如 'images/xxx.png'），添加正確的前綴
  if (!url.startsWith('./') && !url.startsWith('../')) {
    return `${window.location.origin}/${url}`
  }
  
  // 處理 ./ 和 ../ 開頭的路徑
  const baseUrl = new URL(window.location.href)
  return new URL(url, baseUrl).href
}

const downloadToOfficial = async () => {
  console.log('下載到官方帳號:', props.recordData)
  
  try {
    // 🔧 簡化方案：直接使用後端圖片 URL，避免本地圖片載入問題
    let imageUrl = props.recordData.imageUrl || 
                   props.recordData.image_url || 
                   props.recordData.poster_image
    
    if (!imageUrl) {
      alert('找不到圖片，請重新生成海報')
      return
    }
    
    // 確保使用完整 URL
    if (!imageUrl.startsWith('http')) {
      imageUrl = convertToAbsoluteUrl(imageUrl)
    }
    
    console.log('🖼️ 使用後端圖片 URL:', imageUrl)
    
    const text = props.recordData.text || ''
    const fileName = eventType === 'award_speech' 
      ? `金鐘60得獎感言卡_${props.recordData.id || new Date().getTime()}`
      : `金鐘60應援海報_${props.recordData.id || new Date().getTime()}`
    
    // 🔧 測試：先試試直接發送 URL，看是否是圖片生成的問題
    console.log('📤 直接發送後端圖片 URL...')
    await liffService.sendImage(imageUrl, fileName, '', eventType)
    
    console.log('✅ 海報已發送到官方帳號')
    alert('海報已發送到官方帳號！')
    
  } catch (error) {
    console.error('❌ 下載失敗:', error)
    
    // 提供更詳細的用戶可見錯誤訊息
    let userMessage = '下載失敗：'
    
    if (error.message.includes('load failed') || error.message.includes('圖片載入失敗')) {
      userMessage += '圖片載入失敗，請檢查網路連線'
    } else if (error.message.includes('LIFF')) {
      userMessage += '請在 LINE 應用內使用此功能'
    } else if (error.message.includes('登入')) {
      userMessage += '請重新登入 LINE'
    } else {
      userMessage += error.message || '系統錯誤，請稍後再試'
    }
    
    alert(userMessage)
  }
}

// 根據文字長度計算下載用的字體大小（比畫面顯示稍大一些）
const getDownloadFontSize = (text) => {
  if (!text) return 40
  
  const length = text.length
  
  if (eventType === 'award_speech') {
    // 感言卡字體大小
    if (length <= 8) {
      return 32  // 短文字
    } else if (length <= 15) {
      return 28  // 中等長度
    } else if (length <= 25) {
      return 24  // 較長文字
    } else {
      return 20  // 很長的文字
    }
  } else {
    // 應援海報字體大小（比原來大一些）
    if (length <= 4) {
      return 60  // 非常短的文字，如"加油"
    } else if (length <= 8) {
      return 50  // 短文字
    } else if (length <= 12) {
      return 40  // 中等長度
    } else if (length <= 16) {
      return 35  // 較長文字
    } else {
      return 30  // 很長的文字
    }
  }
}

const sharePoster = async () => {
  try {
    console.log('🎯 海報詳情頁面分享按鈕被點擊了！')
    console.log('分享海報:', props.recordData)
    
    // 取得海報資訊
    let imageUrl = props.recordData.imageUrl || props.recordData.image_url || props.recordData.poster_image
    const text = props.recordData.text || ''
    const posterId = props.recordData.id || props.recordData.poster_id
    
    // 🔧 將相對路徑轉換為絕對 URL（為將來可能的圖片分享做準備）
    if (imageUrl) {
      imageUrl = convertToAbsoluteUrl(imageUrl)
    }
    
    // 🔧 根據 LINE 官方文檔實現純前端分享
    console.log('📝 實現前端分享功能')
    
    // 檢查 shareTargetPicker API 是否可用
    if (!liffService.isApiAvailable('shareTargetPicker')) {
      console.warn('⚠️ shareTargetPicker API 不可用')
      alert('分享功能在此環境中不可用，請在 LINE 應用內使用')
      return
    }
    
    // 防止重複點擊
    if (liffService.shareInProgress) {
      console.log('⚠️ 分享已在進行中，請稍後再試')
      return
    }
    
    // 準備分享訊息 - 根據事件類型從配置中讀取文案模板
    const shareConfig = window.GOLDENBELL_CONFIG?.liff?.shareTargetPicker
    const shareConfigType = eventType === 'award_speech' ? 'award_speech' : 'cheer'
    
    let shareText = ''
    if (eventType === 'award_speech') {
      if (text) {
        shareText = `「金鐘60得獎感言卡｜我的金鐘夢想成真！」\n\n我的得獎感言：${text}\n\n金鐘盛典即將登場！快來製作你的專屬得獎感言卡，想像自己站在金鐘獎台上的光榮時刻！\n\n讓你的夢想化作「得獎感言卡」，閃耀金鐘榮光 ✨`
      } else {
        shareText = `「金鐘60得獎感言卡｜我的金鐘夢想成真！」\n\n金鐘盛典即將登場！快來製作你的專屬得獎感言卡，想像自己站在金鐘獎台上的光榮時刻！\n\n讓你的夢想化作「得獎感言卡」，閃耀金鐘榮光 ✨`
      }
    } else {
      if (text) {
        shareText = `「金鐘60星光打Call｜為心愛的節目瘋狂應援！」\n\n我的應援：${text}\n\n金鐘盛典即將登場！快來製作你的專屬應援海報，為最愛的節目和藝人加油打氣，一起點亮金鐘星光大道！\n\n讓你的心意化作「星光打Call卡」，在典禮閃耀 ❤`
      } else {
        shareText = `「金鐘60星光打Call｜為心愛的節目瘋狂應援！」\n\n金鐘盛典即將登場！快來製作你的專屬應援海報，為最愛的節目和藝人加油打氣，一起點亮金鐘星光大道！\n\n讓你的心意化作「星光打Call卡」，在典禮閃耀 ❤`
      }
    }
    
    const messages = shareConfig?.messages?.[shareConfigType] || [{
      type: 'text',
      text: shareText
    }]
    
    console.log('📝 準備分享的訊息:', messages)
    
    // 使用 LIFF 分享功能
    await liffService.shareTargetPicker(messages)
    console.log('✅ 海報分享成功')
    
  } catch (error) {
    console.error('❌ 分享海報失敗:', error)
    
    // 根據環境顯示不同的錯誤訊息
    if (liffService.isInClient()) {
      alert(`分享失敗: ${error.message}`)
    } else {
      alert('請在 LINE 應用內使用分享功能')
    }
  }
}

/**
 * 根據文字長度和內容動態計算文字大小類別
 */
const getTextSizeClass = (text) => {
  if (!text) return 'text-[16px]'
  
  const length = text.length
  
  if (length <= 8) {
    return 'text-[18px] md:text-[20px]' // 短文字使用較大字體
  } else if (length <= 15) {
    return 'text-[16px] md:text-[18px]' // 中等長度
  } else {
    return 'text-[14px] md:text-[16px]' // 長文字使用較小字體
  }
}

/**
 * 根據文字內容動態計算文字樣式
 */
const getTextStyle = (text) => {
  if (!text) return {}
  
  const length = text.length
  const hasEnglish = /[a-zA-Z]/.test(text)
  const hasChinese = /[\u4e00-\u9fa5]/.test(text)
  const hasNumbers = /[0-9]/.test(text)
  
  // 基礎樣式
  let style = {
    lineHeight: '1.4',
    letterSpacing: '-0.1px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' // 增加文字陰影提高可讀性
  }
  
  // 根據文字類型調整樣式
  if (hasChinese && hasEnglish) {
    // 中英文混合
    style.lineHeight = '1.5'
    style.letterSpacing = '0px'
    style.wordSpacing = '2px'
  } else if (hasChinese) {
    // 純中文
    style.letterSpacing = '1px'
    style.lineHeight = '1.4'
  } else if (hasEnglish) {
    // 純英文
    style.letterSpacing = '0.5px'
    style.wordSpacing = '1px'
    style.lineHeight = '1.3'
  }
  
  // 根據長度調整行高
  if (length > 15) {
    style.lineHeight = '1.3'
  }
  
  return style
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
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

// 文字覆蓋層樣式函數（詳細頁面版本）
const getTextOverlayClass = () => {
  if (eventType === 'award_speech') {
    // 感言卡：文字在卡片區域，絕對定位
    return 'top-[105px] left-[85px] p-[10px]'
  } else {
    // 應援海報：文字居中
    return 'inset-0 flex items-center justify-center p-[15px]'
  }
}

const getTextContainerClass = () => {
  if (eventType === 'award_speech') {
    return 'w-[240px]'
  } else {
    return 'w-full max-w-[300px] text-center px-[10px]'
  }
}

const getTextClass = (text) => {
  const sizeClass = getTextSizeClass(text)
  const baseClass = 'font-bold break-words whitespace-pre-wrap'
  
  if (eventType === 'award_speech') {
    return `text-black ${baseClass} ${sizeClass}`
  } else {
    return `text-white text-center ${baseClass} ${sizeClass}`
  }
}

const getDetailTextStyle = (text) => {
  if (eventType === 'award_speech') {
    // 感言卡樣式：黑色文字，左對齊，輕微旋轉
    return {
      textAlign: 'left',
      transform: 'rotate(-7deg)',
      transformOrigin: 'top left',
      lineHeight: '1.2',
      wordBreak: 'break-word',
      overflowWrap: 'break-word'
    }
  } else {
    // 應援海報樣式：使用原有的 getTextStyle
    return getTextStyle(text)
  }
}
</script>

<style scoped>
.poster-detail {
  font-family: 'Noto Serif HK', serif;
  scroll-behavior: smooth;
}

/* 主容器滾軸樣式 */
.poster-detail::-webkit-scrollbar {
  width: 6px;
}

.poster-detail::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.poster-detail::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.poster-detail::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 針對行動裝置優化滾動 */
@media (max-width: 768px) {
  .poster-detail {
    -webkit-overflow-scrolling: touch;
  }
}
</style>

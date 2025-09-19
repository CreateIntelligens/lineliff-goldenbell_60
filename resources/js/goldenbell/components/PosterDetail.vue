<template>
  <div class="poster-detail w-full min-h-screen bg-white relative sm:max-w-[393px] sm:mx-auto overflow-y-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full h-full">
      <img 
        src="/images/poster.png" 
        alt="Golden Bell Background" 
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Main Content -->
    <div class="flex w-full pt-[47px] px-[20px] pb-[40px] flex-col items-start gap-[42px] relative z-10">
      <!-- Content Container -->
      <div class="flex flex-col items-center gap-[24px] w-full">
        <!-- Header -->
        <PageHeader
          title="應援海報生成紀錄"
          :showBadge="true"
          :badgeText="`已生成：${generatedCount}/10`"
          @goBack="goBack"
        />

        <!-- Image Section -->
        <div class="flex flex-col items-start gap-[8px] w-full">
          <!-- Poster Preview -->
          <div class="relative h-[353px] w-full rounded-[4px] overflow-hidden">
            <img 
              class="h-full w-full object-cover"
              :src="recordData.imageUrl || recordData.image_url || recordData.poster_image || '/images/poster.png'"
              alt="Poster Detail"
            />
            
            <!-- 應援文字覆蓋層 -->
            <div v-if="recordData.text" class="absolute inset-0 flex items-center justify-center p-[20px]">
              <div class="p-[16px] max-w-[280px] text-center">
                <div class="text-white font-bold text-[16px] leading-[140%] tracking-[-0.2px] break-words">
                  {{ recordData.text }}
                </div>
              </div>
            </div>
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
              @click="regeneratePoster"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                重新生成
              </div>
            </div>

            <!-- Download Button -->
            <div
              class="flex w-[150px] h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
              style="background: linear-gradient(180deg, #A4A4A4 -77.78%, #000 166.67%)"
              @click="downloadToOfficial"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                下載至官方帳號
              </div>
            </div>

            <!-- Share Icon Button -->
            <div
              class="flex w-[37px] h-[36px] justify-center items-center gap-[10px] rounded-[6px] cursor-pointer hover:opacity-90 transition-opacity shadow-[0_0_4px_0_rgba(0,0,0,0.25)]"
              style="background: linear-gradient(180deg, #A4A4A4 -77.78%, #000 166.67%)"
              @click="sharePoster"
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
import { defineEmits } from 'vue'
import PageHeader from './PageHeader.vue'
import { liffService } from '../../services/liffService.js'

// Props
const props = defineProps({
  recordData: {
    type: Object,
    required: true
  },
  generatedCount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['goBack', 'regeneratePoster'])

// Methods
const goBack = () => {
  emit('goBack')
}

const regeneratePoster = () => {
  console.log('重新生成海報:', props.recordData)
  emit('regeneratePoster', props.recordData)
}

const downloadToOfficial = () => {
  console.log('下載到官方帳號:', props.recordData)
  // 下載邏輯
}

const sharePoster = async () => {
  try {
    console.log('🎯 海報詳情頁面分享按鈕被點擊了！')
    console.log('分享海報:', props.recordData)
    
    // 準備分享的訊息內容
    const messages = [
      {
        type: 'text',
        text: `「金鐘60星光打Call｜為心愛的節目瘋狂應援！」\n\n金鐘盛典即將登場！快來製作你的專屬應援海報，為最愛的節目和藝人加油打氣，一起點亮金鐘星光大道！\n\n我的應援內容：${props.recordData.text}\n\n點擊下方連結，留下想對節目或藝人說的話 讓你的心意化作「星光打Call卡」，在典禮閃耀 ❤`
      }
    ]
    
    // 如果有海報圖片，也可以分享圖片
    if (props.recordData.imageUrl || props.recordData.image_url || props.recordData.poster_image) {
      const imageUrl = props.recordData.imageUrl || props.recordData.image_url || props.recordData.poster_image
      messages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      })
    }
    
    // 檢查 LIFF 服務狀態
    console.log('LIFF 服務狀態:', liffService.getStatus())
    
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

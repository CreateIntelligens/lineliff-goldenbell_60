<template>
  <div class="golden-bell-homepage w-full min-h-screen bg-black relative sm:max-w-[393px] sm:mx-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full h-[120vh] overflow-hidden">
      <img 
        :src="getThemeImages(getCurrentEventType()).background" 
        alt="Background" 
        class="w-full h-full object-cover object-bottom"
      />
    </div>
    
    <!-- 好友檢查警告 -->
    <div
      v-if="isFriendChecked && !isFriend"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
    >
      <div class="bg-white rounded-lg mx-4 max-w-sm text-center shadow-lg">
        <!-- 主要訊息 -->
        <div class="px-6 py-6">
          <div class="text-gray-800 text-base font-medium">
            您尚未加為好友，無法使用此服務。<br />
            請先加為好友後再試。
          </div>
        </div>
        <!-- 按鈕區域 -->
        <div class="px-6 py-4">
          <button
            @click="closeAlert"
            class="w-full text-gray-800 text-base font-bold py-2 rounded hover:bg-gray-50 transition-colors"
          >
            確定
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex w-full pt-[40px] px-[20px] pb-[80px] flex-col items-center gap-[25px] relative z-10">
      <div class="flex flex-col items-start gap-[104px] w-full">
        <!-- Awards Info -->
        <div class="flex flex-col items-start gap-[358px] w-full">
          <!-- Awards Header -->
          <div class="flex flex-col items-start gap-[28px] w-full" v-if="getThemeContent('title') || getThemeContent('subtitle') || getThemeEvents().length > 0">
            <!-- Title Container -->
            <div class="flex flex-col items-center gap-[8px] w-full" v-if="getThemeContent('title') || getThemeContent('subtitle')">
              <div v-if="getThemeContent('title')" class="h-[24px] w-full text-white text-center font-bold text-[24px] leading-[24px]">
                {{ getThemeContent('title') }}
              </div>
              <div v-if="getThemeContent('subtitle')" class="h-[14px] w-full text-white text-center font-bold text-[14px] leading-[14px]">
                {{ getThemeContent('subtitle') }}
              </div>
            </div>

            <!-- Event Dates Container -->
            <div v-if="getThemeEvents().length > 0" class="flex justify-center items-center gap-[32px] w-full">
              <!-- Dynamic Events -->
              <div 
                v-for="(event, index) in getThemeEvents()" 
                :key="index"
                class="flex items-center gap-[8px]"
              >
                <div 
                  class="w-[1px] h-[40px] bg-gradient-to-b to-black"
                  :style="{ backgroundImage: `linear-gradient(to bottom, ${getThemeColor('accent')}, black)` }"
                ></div>
                <div class="flex flex-col items-start gap-[5px]">
                  <div 
                    class="text-[18px] font-normal leading-[18px]"
                    :style="{ color: getThemeColor('accent') }"
                  >
                    <span class="text-[18px]">{{ event.date }} </span>
                    <span class="text-[13px]">/{{ event.day }}</span>
                  </div>
                  <div 
                    class="text-[18px] font-normal leading-[18px]"
                    :style="{ color: getThemeColor('accent') }"
                  >
                    {{ event.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Section -->
          <div class="flex flex-col items-center gap-[12px] w-full">
            <!-- Title with Blur Effect -->
            <div class="flex flex-col justify-center items-center w-full">
              <div class="h-[32px] w-full relative">
                <!-- Blurred background title -->
                <div class="absolute inset-0 w-full h-[32px] text-white text-center font-bold text-[32px] leading-[32px] tracking-[0.32px] blur-[2px]">
                  {{ getThemeContent('mainTitle') }}
                </div>
                <!-- Sharp foreground title -->
                <div class="absolute inset-0 w-full h-[32px] text-white text-center font-bold text-[32px] leading-[32px] tracking-[0.32px]">
                  {{ getThemeContent('mainTitle') }}
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="h-[87px] w-full">
              <div class="w-full text-white text-center font-bold text-[18px] leading-[29px] tracking-[1.44px]">
                <template v-for="(line, index) in getThemeContent('description')" :key="index">
                  {{ line }}<br v-if="index < getThemeContent('description').length - 1"/>
                </template>
              </div>
            </div>

            <!-- Call to Action Button -->
            <div class="flex px-[4px] justify-center items-center gap-[5px] w-full">
              <div 
                class="font-normal text-[20px] leading-[20px] underline cursor-pointer" 
                :style="{ color: getThemeColor('accent') }"
                @click="handleCreatePoster"
              >
                {{ getThemeContent('buttonText') }}
              </div>
              <svg 
                class="w-[13px] h-[13px] cursor-pointer" 
                :style="{ fill: getThemeColor('accent') }"
                @click="handleCreatePoster" 
                width="13" 
                height="14" 
                viewBox="0 0 13 14" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10.1621 7.86292H0.834671C0.598181 7.86292 0.399947 7.78076 0.239968 7.61643C0.0799893 7.45211 0 7.24849 0 7.00557C0 6.76266 0.0799893 6.55904 0.239968 6.39471C0.399947 6.23038 0.598181 6.14822 0.834671 6.14822H10.1621L6.07223 1.94721C5.9053 1.77574 5.82531 1.57569 5.83226 1.34706C5.83922 1.11844 5.92616 0.918387 6.0931 0.746917C6.26003 0.589736 6.45479 0.507573 6.67737 0.500429C6.89995 0.493284 7.0947 0.575447 7.26164 0.746917L12.7705 6.40543C12.8539 6.49116 12.9131 6.58404 12.9478 6.68407C12.9826 6.78409 13 6.89126 13 7.00557C13 7.11989 12.9826 7.22705 12.9478 7.32708C12.9131 7.4271 12.8539 7.51998 12.7705 7.60572L7.26164 13.2642C7.10861 13.4214 6.91734 13.5 6.6878 13.5C6.45827 13.5 6.26003 13.4214 6.0931 13.2642C5.92616 13.0928 5.8427 12.8891 5.8427 12.6534C5.8427 12.4176 5.92616 12.214 6.0931 12.0425L10.1621 7.86292Z"/>
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, onMounted } from 'vue'
import { 
  getThemeImage, 
  getThemeContent, 
  getThemeColor, 
  getThemeEvents,
  getCurrentEventType,
  logCurrentTheme 
} from '../../config/themeConfig.js'
import { getThemeImages } from '../../assets/images.js'

// Props
const props = defineProps({
  isFriendChecked: {
    type: Boolean,
    default: false
  },
  isFriend: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['createPoster'])

// Methods
const handleCreatePoster = () => {
  // 如果不是好友，不允許創建海報
  if (props.isFriendChecked && !props.isFriend) {
    return
  }
  emit('createPoster')
}

const closeAlert = () => {
  // 關閉警告後可以選擇重新檢查好友狀態或跳轉到其他頁面
  // 這裡我們可以重新檢查好友狀態
  window.location.reload()
}

// 生命週期
onMounted(() => {
  // 調試：輸出當前主題
  console.log('🎨 首頁載入，當前事件類型:', getCurrentEventType())
  if (window.GOLDENBELL_CONFIG?.debug) {
    logCurrentTheme()
  }
})
</script>

<style scoped>
.golden-bell-homepage {
  font-family: 'Noto Serif HK', serif;
}
</style>

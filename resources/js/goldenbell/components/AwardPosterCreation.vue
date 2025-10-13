<template>
  <div class="award-poster-creation w-full min-h-screen relative sm:max-w-[393px] sm:mx-auto overflow-y-auto">
    
    <!-- Background Image -->
    <img 
      :src="getThemeImages('award_speech').detailBackground"
      alt="Award Background"
      class="absolute inset-0 w-full h-full object-cover"
    />
    
    <!-- Animation Queue -->
    <div class="flex w-full h-[47px] justify-center items-center relative z-10"></div>
    
    <!-- Main Content -->
    <div class="flex w-full pt-[47px] px-[20px] pb-[40px] flex-col items-start gap-[42px] relative z-10">
      
      <!-- Content Container -->
      <div class="flex flex-col items-center gap-[24px] w-full">
        
        <!-- Input Section -->
        <div class="flex flex-col items-start gap-[24px] w-full">
          
          <!-- Header Container -->
          <div class="flex flex-col items-center gap-[6px] w-full">
            
            <!-- Description -->
            <div class="text-white text-center font-normal text-[14px] leading-[180%] tracking-[-0.266px] w-full">
              <div>
                <span class="font-normal text-[17px]">【</span>
                <span class="font-normal text-[17px]"> </span>
                <span class="font-bold text-[17px]">寫下你的金鐘60得獎感言</span>
                <span class="font-normal text-[17px]"> </span>
                <span class="font-normal text-[17px]">】</span>
              </div>
              <div class="font-bold text-[14px] mt-1">
                手握獎盃化身金鐘得主，寫下屬於你的獲獎感言
              </div>
            </div>
            
            <!-- Input Container -->
            <div class="flex flex-col items-start gap-[3px] w-full">
              
              <!-- Text Input Area -->
              <div class="flex h-[187px] p-[10px_12px] items-start gap-[10px] w-full rounded-[12px] border border-[#B3C400] bg-[#272727]">
                <div class="flex w-full flex-col justify-center items-start gap-[8px]">
                  
                  <!-- Input Textarea -->
                  <textarea 
                    ref="textInput"
                    v-model="displayText"
                    class="h-[101px] w-full text-[13px] font-semibold leading-[160%] tracking-[-0.247px] outline-none resize-none bg-transparent border-none"
                    :class="{ 
                      'text-white': isEditing || inputText,
                      'text-[rgba(255,255,255,0.45)]': !isEditing && !inputText,
                      'text-orange-400': hasWarnings,
                      'text-green-400': inputText && !hasWarnings && !isOverLimit,
                      'text-red-400': isOverLimit
                    }"
                    :placeholder="!inputText ? '想像自己拿下金鐘，寫下一段真心的感謝吧！' : ''"
                    :maxlength="maxLength"
                    @input="onTextInput"
                    @focus="onFocus"
                    @blur="onBlur"
                    @keydown="onKeyDown"
                    @paste="onPaste"
                    @compositionstart="onCompositionStart"
                    @compositionend="onCompositionEnd"
                  ></textarea>

                  <!-- Controls Container -->
                  <div class="flex flex-col items-start gap-[5px] w-full">
                    
                    <!-- Character Count Container -->
                    <div class="flex justify-between items-center w-full">
                      <div 
                        class="flex flex-col justify-end flex-1 text-right font-semibold text-[10.5px] leading-[160%]"
                        :class="{ 
                          'text-red-400': isOverLimit, 
                          'text-yellow-400': !isOverLimit && hasWarnings,
                          'text-[rgba(255,255,255,0.5)]': !isOverLimit && !hasWarnings
                        }"
                      >
                        <span class="font-bold text-[11px]">{{ displayLength }}/{{ maxLength }}</span>
                      </div>
                    </div>

                    <!-- Create Button -->
                    <div 
                      class="flex w-full h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer transition-all"
                      @click="createPoster"
                      :class="{ 'opacity-50 cursor-not-allowed': !canCreate }"
                      :style="getButtonStyle()"
                    >
                      <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                        <span>{{ isLoading ? '製作中...' : '製作我的專屬感言卡 ✨' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggestion Text -->
              <div class="flex pl-[6px] justify-center items-center gap-[10px] w-full">
                <div class="flex-1 text-[#E6E6E6] font-semibold text-[11px] leading-[160%] tracking-[-0.209px]">
                  <span class="font-bold">✻ 建議字數 50–100 字，讓你的榮耀時刻更完整。</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Image Section -->
        <div class="flex flex-col items-start gap-[8px] w-full">
          
          <!-- Poster Preview -->
          <div class="relative aspect-square w-full rounded-[4px] overflow-hidden">
            <img 
              class="h-full w-full object-cover"
              :src="posterImage"
              alt="Award Speech Poster Preview"
            />
            
            <!-- 🔧 前端預覽文字覆蓋層 - 只用於預覽，後端會生成完整圖片 -->
            <div v-if="generatedText" 
                 class="absolute text-black font-bold break-words whitespace-pre-wrap"
                 :class="getTextSizeClass(generatedText)"
                 :style="getAbsoluteTextStyle(generatedText)"
                 style="top: 105px; left: 85px; transform: rotate(-7deg); width: 240px; line-height: 1.2; padding: 10px; text-align: left;">
              {{ generatedText }}
            </div>
          </div>
          
          <!-- Generation Count -->
          <div class="flex justify-end items-center gap-[10px] w-full">
            <div class="text-[#9D9D9D] font-bold text-[10px] leading-[100%] tracking-[0.6px]">
              生成次數{{ generationCount }}/{{ maxGenerations }}
            </div>
          </div>

          <!-- Button Container - 只有在已生成後才顯示 -->
          <div v-if="hasGenerated" class="flex items-center gap-[8px] w-full">
            <!-- Regenerate Button -->
            <div
              class="flex w-[150px] h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
              :class="{ 'opacity-50 cursor-not-allowed': remainingCount <= 0 || isLoading }"
              style="background: linear-gradient(180deg, #E8FF02 -77.78%, #000 166.67%)"
              @click="regeneratePoster"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                重新生成 ({{ generationCount }}/{{ maxGenerations }})
              </div>
            </div>

            <!-- Download Button -->
            <div
              class="flex w-[150px] h-[36px] justify-center items-center gap-[10px] rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
              style="background: linear-gradient(180deg, #A4A4A4 -77.78%, #000 166.67%)"
              @click="downloadToOfficial"
            >
              <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                下載至LINE
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

      <!-- Image Generation Record Link -->
      <div class="flex items-center justify-center gap-[4px] w-full">
        <div 
          class="text-white font-bold text-[16px] leading-[100%] tracking-[0.64px] underline cursor-pointer hover:text-[#E8FF02] transition-colors"
          @click="goToImageRecord"
        >
          <span>圖片生成紀錄</span>
        </div>
        <svg 
          class="w-[13px] h-[13px] fill-white cursor-pointer" 
          @click="goToImageRecord" 
          width="13" 
          height="14" 
          viewBox="0 0 13 14" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10.1621 7.86292H0.834671C0.598181 7.86292 0.399946 7.78076 0.239968 7.61643C0.0799893 7.45211 0 7.24849 0 7.00557C0 6.76266 0.0799893 6.55904 0.239968 6.39471C0.399946 6.23038 0.598181 6.14822 0.834671 6.14822H5.49839H10.1621L6.07223 1.94721C5.9053 1.77574 5.82531 1.57569 5.83226 1.34706C5.83922 1.11844 5.92616 0.918387 6.0931 0.746917C6.26003 0.589736 6.45479 0.507573 6.67737 0.500429C6.89995 0.493284 7.0947 0.575447 7.26164 0.746917L12.7705 6.40543C12.8539 6.49116 12.9131 6.58404 12.9478 6.68407C12.9826 6.78409 13 6.89126 13 7.00557C13 7.11989 12.9826 7.22705 12.9478 7.32708C12.9131 7.4271 12.8539 7.51998 12.7705 7.60572L7.26164 13.2642C7.10861 13.4214 6.91734 13.5 6.6878 13.5C6.45827 13.5 6.26003 13.4214 6.0931 13.2642C5.92616 13.0928 5.8427 12.8891 5.8427 12.6534C5.8427 12.4176 5.92616 12.214 6.0931 12.0425L10.1621 7.86292Z" fill="white"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, onMounted, nextTick, watch } from 'vue'
import { contentFilterService } from '../../services/contentFilterService.js'
import { liffService } from '../../services/liffService.js'
import { apiService } from '../../services/apiService.js'
import { posterImageService } from '../../services/posterImageService.js'
import { getThemeImages } from '../../assets/images.js'

// Props
const props = defineProps({
  initialState: {
    type: Object,
    default: () => ({
      hasGenerated: false,
      generatedText: '',
      generationCount: 0,
      maxGenerations: 10,
      remainingCount: 10
    })
  },
  regenerateData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['goToImageRecord', 'goBack', 'posterGenerated', 'stateUpdated'])

// Reactive data
const inputText = ref('')
const filteredText = ref('')
const generatedText = ref('')
const warnings = ref([])
const filterStats = ref({ level1: 0, level2: 0, level3: 0 })
const generationCount = ref(0)
const maxGenerations = ref(10)
const remainingCount = ref(10)
const isCreating = ref(false)
const isEditing = ref(false)
const hasGenerated = ref(false)
const isLoading = ref(false)
const apiError = ref('')
const maxLength = 100  // Award speech allows more characters
const eventType = 'award_speech' // Award speech event type
const textInput = ref(null)
const isComposing = ref(false)

// Default poster image for award speech
const posterImage = computed(() => {
  const themeImages = getThemeImages('award_speech')
  
  // 檢查是否有任何文字（輸入中的或已生成的）
  const hasInputText = inputText.value && inputText.value.trim().length > 0
  const hasGeneratedText = generatedText.value && generatedText.value.trim().length > 0
  const hasAnyText = hasInputText || hasGeneratedText
  
  
  // 如果有任何文字（輸入中或已生成），使用有文字的版本
  if (hasAnyText) {
    return themeImages.posterWithText
  }
  // 沒有文字時使用預設版本
  return themeImages.poster
})

// Computed properties
const canCreate = computed(() => {
  const result = inputText.value.trim().length > 0 && 
         remainingCount.value > 0 && 
         !isOverLimit.value &&
         !isLoading.value
  
  return result
})

const hasWarnings = computed(() => {
  return warnings.value.length > 0
})

const displayText = computed({
  get() {
    return filteredText.value || inputText.value
  },
  set(value) {
    inputText.value = value
    if (!isComposing.value) {
      processInput()
    }
  }
})

const displayLength = computed(() => {
  return displayText.value.length
})

const isOverLimit = computed(() => {
  return displayLength.value > maxLength
})

// Lifecycle
onMounted(async () => {
  // 首先使用從 App.vue 傳來的初始狀態
  if (props.initialState) {
    generationCount.value = props.initialState.generationCount
    maxGenerations.value = props.initialState.maxGenerations
    remainingCount.value = props.initialState.remainingCount
    hasGenerated.value = props.initialState.hasGenerated
    generatedText.value = props.initialState.generatedText
    
    // 如果有已生成的文字，設置為已創建狀態
    if (props.initialState.hasGenerated && props.initialState.generatedText) {
      isCreating.value = true
    }
    
    console.log('✅ 使用初始狀態:', props.initialState)
  }
  
  // 然後嘗試從 API 載入最新數據（如果可用）
  await loadUserData()
})

// 監聽重新生成資料
watch(() => props.regenerateData, (newData) => {
  if (newData && newData.isRegenerate) {
    console.log('🔄 收到重新生成請求:', newData)
    
    // 設置要重新生成的文字
    inputText.value = newData.text || ''
    generatedText.value = newData.text || ''
    
    // 設置為已生成狀態，但不實際生成圖片
    hasGenerated.value = true
    isCreating.value = true
    
    // 不消耗生成次數，不調用 API
    console.log('✅ 重新生成模式：已設置文字內容，不消耗生成次數')
    
    // 更新 App.vue 中的狀態
    emit('stateUpdated', eventType, {
      hasGenerated: hasGenerated.value,
      generatedText: generatedText.value,
      generationCount: generationCount.value,
      maxGenerations: maxGenerations.value,
      remainingCount: remainingCount.value
    })
  }
}, { immediate: true })

// Methods
const loadUserData = async () => {
  if (!apiService.isApiAvailable()) {
    console.log('⚠️ API 服務不可用，跳過計數載入')
    return
  }

  try {
    isLoading.value = true
    apiError.value = ''
    
    console.log('📡 呼叫 getImageCount API，事件類型:', eventType)
    const countData = await apiService.getImageCount(eventType)
    console.log('📦 API 回應:', countData)
    
    // API 回應格式：{status: 'success', result: {data: {...}}}
    const apiData = countData?.result?.data || countData?.data
    if (apiData) {
      const oldCount = generationCount.value
      const oldRemaining = remainingCount.value
      
      // 更新計數，但保持合理的範圍
      const newCurrentCount = parseInt(apiData.current_count) || 0
      const newLimit = parseInt(apiData.limit) || 10
      const newRemaining = parseInt(apiData.remaining) || 0
      
      // 確保計數不會異常增加（防止 API 錯誤導致計數重置）
      if (newCurrentCount >= generationCount.value) {
        generationCount.value = newCurrentCount
      }
      
      // 更新最大次數
      maxGenerations.value = newLimit
      
      // 更新剩餘次數，但確保不會異常增加
      if (newRemaining <= oldRemaining || oldRemaining === 0) {
        remainingCount.value = newRemaining
      }
      
      console.log('✅ 計數更新成功:', {
        舊計數: oldCount,
        新計數: generationCount.value,
        最大次數: maxGenerations.value,
        剩餘次數: remainingCount.value,
        API剩餘次數: newRemaining
      })
    } else {
      console.warn('⚠️ API 回應格式異常:', countData)
      // 不重置計數，保持現有狀態
    }
    
  } catch (error) {
    console.error('❌ 載入計數失敗:', error)
    apiError.value = ''
    
    // 不要重置計數，保留現有狀態
    console.log('🔄 保留現有計數狀態:', {
      generationCount: generationCount.value,
      maxGenerations: maxGenerations.value,
      remainingCount: remainingCount.value
    })
  } finally {
    isLoading.value = false
  }
}

const savePosterToAPI = async (text, imageUrl, fontOptions = {}) => {
  if (!apiService.isApiAvailable()) {
    return null
  }

  try {
    // 🔧 創建包含文字的感言卡圖片，傳入事件類型以應用正確樣式和字體選項
    const imageBlob = await apiService.createPosterBlob(imageUrl, text, eventType, fontOptions)
    const result = await apiService.saveImage(text, imageBlob, eventType)
    return result
  } catch (error) {
    throw error
  }
}

const onTextInput = (event) => {
  let newText = event.target.value || ''
  
  const lines = newText.split('\n')
  const maxLines = 6 // More lines for award speech
  
  if (lines.length > maxLines) {
    newText = lines.slice(0, maxLines).join('\n')
  }
  
  if (newText.length > maxLength) {
    newText = newText.substring(0, maxLength)
  }
  
  // 更新原始輸入文字，計算屬性會自動處理過濾
  inputText.value = newText
  
  // 只有在非中文輸入法狀態下才進行過濾處理
  if (!isComposing.value) {
    processInput()
  }
}

const onCompositionStart = () => {
  isComposing.value = true
}

const onCompositionEnd = (event) => {
  isComposing.value = false
  setTimeout(() => {
    onTextInput(event)
  }, 0)
}

const handlePaste = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText()
    const cleanClipboardText = clipboardText.replace(/\r/g, '').replace(/\t/g, ' ')
    let newText = inputText.value + cleanClipboardText
    
    const lines = newText.split('\n')
    const maxLines = 6
    
    if (lines.length > maxLines) {
      newText = lines.slice(0, maxLines).join('\n')
    }
    
    if (newText.length > maxLength) {
      newText = newText.substring(0, maxLength)
    }
    
    inputText.value = newText
    processInput()
    
    await nextTick()
    if (textInput.value) {
      textInput.value.value = newText
      textInput.value.focus()
    }
  } catch (err) {
    // Cannot read clipboard
  }
}

const onFocus = () => {
  isEditing.value = true
}

const onBlur = () => {
  isEditing.value = false
  if (inputText.value.length > maxLength) {
    inputText.value = inputText.value.substring(0, maxLength)
    processInput()
  }
}

const onPaste = (event) => {
  event.preventDefault()
  handlePaste()
}

const onKeyDown = (event) => {
  if (event.key === 'Enter') {
    const currentText = event.target.value || ''
    const lines = currentText.split('\n')
    const maxLines = 6
    
    if (lines.length >= maxLines) {
      event.preventDefault()
      return
    }
  }
  
  const currentLength = inputText.value.length
  const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown'
  const isModifierKey = event.ctrlKey || event.metaKey || event.altKey
  const isSpecialKey = event.key === 'Tab' || event.key === 'Escape'
  
  if (currentLength >= maxLength && !isDeleteKey && !isModifierKey && !isSpecialKey) {
    event.preventDefault()
    return
  }
  
  if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
    event.preventDefault()
    handlePaste()
  }
}

const processInput = () => {
  if (!inputText.value) {
    filteredText.value = ''
    warnings.value = []
    filterStats.value = { level1: 0, level2: 0, level3: 0 }
    return
  }

  if (inputText.value.length > maxLength) {
    inputText.value = inputText.value.substring(0, maxLength)
  }

  const filterResult = contentFilterService.filterContent(inputText.value, 'all')
  const validationResult = contentFilterService.validateInput(inputText.value)
  
  if (filterResult.filteredText !== inputText.value && 
      filterResult.filteredText.length < inputText.value.length * 0.8) {
    filteredText.value = inputText.value
    filterStats.value = { level1: 0, level2: 0, level3: 0 }
    warnings.value = []
  } else {
    filteredText.value = filterResult.filteredText
    filterStats.value = filterResult.filterStats
    warnings.value = [...validationResult.warnings]
  }
  
  const originalLength = inputText.value.length
  const filteredLength = filteredText.value.length
  
  if (originalLength > maxLength) {
    warnings.value.push(`原始內容超過 ${maxLength} 字限制，已自動截斷`)
  }
  
  if (filteredLength > maxLength) {
    warnings.value.push(`過濾後內容超過 ${maxLength} 字限制，已自動截斷`)
  }
  
  if (originalLength > maxLength * 0.9) {
    warnings.value.push(`字數即將達到 ${maxLength} 字限制`)
  }
}

const createPoster = async () => {
  if (!canCreate.value) return
  
  try {
    isLoading.value = true
    apiError.value = ''
    
    const textToUse = filteredText.value || inputText.value
    generatedText.value = textToUse
    
    isCreating.value = true
    hasGenerated.value = true
    
    // 🔧 準備字體選項 - 支援字體大小調整
    const fontOptions = {
      fontSizeMultiplier: getFontSizeMultiplier(textToUse), // 根據文字長度動態調整
      baseFontRatio: 0.05 // 調整基礎字體大小比例，使下載文字與預覽一致
    }
    
    let savedResult = null
    try {
      savedResult = await savePosterToAPI(textToUse, posterImage.value, fontOptions)
      
      console.log('📦 API 完整回應:', savedResult)
      
      // 🔧 儲存後端返回的圖片 URL - 修正數據結構處理
      let imageUrl = null
      
      if (savedResult) {
        // 嘗試不同的數據結構路徑
        imageUrl = savedResult.image_url ||           // 直接在 savedResult
                   savedResult.result?.data?.image_url ||  // 在 result.data 中
                   savedResult.data?.image_url             // 在 data 中
      }
      
      if (imageUrl) {
        backendImageUrl.value = imageUrl
        console.log('✅ 成功儲存後端圖片 URL:', imageUrl)
      } else {
        console.log('⚠️ 未找到 image_url 在回應中:', savedResult)
      }
    } catch (saveError) {
      console.error('❌ 儲存感言卡失敗:', saveError)
      // API error is normal in development
    }
    
    // 無論 API 是否成功，都重新載入用戶資料以確保計數正確
    // 這樣可以確保顯示的數字始終與伺服器端一致
    try {
      await loadUserData()
    } catch (loadError) {
      // 如果載入失敗，手動更新本地計數
      generationCount.value++
      remainingCount.value = Math.max(0, remainingCount.value - 1)
    }
    
    // 更新 App.vue 中的狀態
    emit('stateUpdated', eventType, {
      hasGenerated: hasGenerated.value,
      generatedText: generatedText.value,
      generationCount: generationCount.value,
      maxGenerations: maxGenerations.value,
      remainingCount: remainingCount.value
    })
    
    const posterData = {
      text: textToUse,
      imageUrl: posterImage.value,
      generationCount: generationCount.value,
      savedResult: savedResult
    }
    
    emit('posterGenerated', posterData)
    
  } catch (error) {
    apiError.value = error.message
    isCreating.value = false
    hasGenerated.value = false
    alert(`創建感言卡失敗: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const goToImageRecord = () => {
  emit('goToImageRecord')
}

// 文字大小和樣式計算函數
const getTextSizeClass = (text) => {
  const length = text ? text.length : 0
  
  if (length <= 20) {
    return 'text-[18px] leading-[1.4]'
  } else if (length <= 40) {
    return 'text-[16px] leading-[1.3]'
  } else if (length <= 60) {
    return 'text-[14px] leading-[1.2]'
  } else if (length <= 80) {
    return 'text-[13px] leading-[1.2]'
  } else {
    return 'text-[12px] leading-[1.1]'
  }
}

const getTextStyle = (text) => {
  const length = text ? text.length : 0
  
  if (length <= 30) {
    return {
      fontWeight: '700',
      transform: 'rotate(1deg) translateY(-5px)',
      color: '#000000'
    }
  } else {
    return {
      fontWeight: '600',
      transform: 'rotate(1deg) translateY(-5px)',
      color: '#000000'
    }
  }
}

// 絕對定位專用的文字樣式
const getAbsoluteTextStyle = (text) => {
  const length = text ? text.length : 0
  
  if (length <= 30) {
    return {
      fontWeight: '700',
      color: '#000000'
    }
  } else {
    return {
      fontWeight: '600', 
      color: '#000000'
    }
  }
}

// 重新生成小卡
const regeneratePoster = async () => {
  if (remainingCount.value <= 0 || isLoading.value || !generatedText.value) return
  
  console.log('🔄 重新生成按鈕被點擊 - 只重新生成圖片，不消耗次數')
  
  try {
    isLoading.value = true
    apiError.value = ''
    
    // 使用已生成的文字，但不消耗生成次數
    const textToUse = generatedText.value
    
    // 清空輸入框和生成結果，讓用戶知道已經重新生成
    inputText.value = ''
    filteredText.value = ''
    generatedText.value = ''
    warnings.value = []
    
    // ❌ 移除：不再實際儲存到後端或消耗次數
    console.log('✅ 重新生成完成：使用現有文字', textToUse)
    console.log('🧹 已清空輸入框')
    
    // ❌ 移除：不重新載入用戶資料或更新計數器
    
    // 更新 App.vue 中的狀態（但不改變計數）
    emit('stateUpdated', eventType, {
      hasGenerated: hasGenerated.value,
      generatedText: generatedText.value,
      generationCount: generationCount.value, // 保持原計數
      maxGenerations: maxGenerations.value,
      remainingCount: remainingCount.value    // 保持原剩餘次數
    })
    
    // 創建小卡數據（但不觸發實際生成）
    const posterData = {
      text: textToUse,
      imageUrl: posterImage.value,
      generationCount: generationCount.value,
      savedResult: null, // 沒有實際保存
      isRegeneration: true, // 標記這是重新生成
      skipGeneration: true  // 標記跳過實際生成
    }
    
    // 不發送 posterGenerated 事件，避免觸發實際生成
    console.log('🎯 重新生成完成，不觸發實際圖片生成')
    
  } catch (error) {
    apiError.value = error.message
    alert(`重新生成感言卡失敗: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

// 儲存後端返回的圖片 URL
const backendImageUrl = ref('')

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

// 下載至LINE
const downloadToOfficial = async () => {
  if (!hasGenerated.value) {
    alert('請先生成感言卡')
    return
  }

  try {
    console.log('📤 開始發送感言卡到官方帳號...')
    console.log('🔍 檢查 backendImageUrl:', backendImageUrl.value)
    
    const fileName = `金鐘60得獎感言卡_${new Date().getTime()}`
    
    // 🔧 如果有後端圖片 URL，直接使用（最佳情況）
    if (backendImageUrl.value) {
      let imageUrl = backendImageUrl.value
      
      // 確保使用完整 URL
      if (!imageUrl.startsWith('http')) {
        imageUrl = convertToAbsoluteUrl(imageUrl)
      }
      
      console.log('🖼️ 使用後端圖片 URL:', imageUrl)
      await liffService.sendImage(imageUrl, fileName, '', 'award_speech')
      
    } else {
      // 🔧 如果沒有後端 URL，提示用戶重新生成
      console.log('⚠️ 沒有後端圖片 URL，無法下載')
      alert('圖片尚未準備好，請重新生成感言卡後再試')
      return
    }
    
    console.log('✅ 感言卡已發送到官方帳號')
    alert('感言卡已發送到官方帳號！')
    
  } catch (error) {
    console.error('❌ 發送失敗:', error)
    
    // 提供更詳細的用戶可見錯誤訊息
    let userMessage = '發送失敗：'
    
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

// 🔧 根據文字長度計算字體大小倍數（感言卡版本）
const getFontSizeMultiplier = (text) => {
  if (!text) return 1.0
  
  const length = text.length
  
  // 感言卡字體大小倍數 - 可以在這裡調整整體字體大小
  if (length <= 15) {
    return 1.3  // 短文字，字體放大30%
  } else if (length <= 30) {
    return 1.1  // 中短文字，字體放大10%
  } else if (length <= 50) {
    return 1.0  // 中等長度，正常大小
  } else if (length <= 60) {
    return 0.8  // 較長文字，字體縮小20%
  } else {
    return 0.6  // 很長的文字，字體縮小40%
  }
}

// 根據文字長度計算下載用的字體大小（感言卡版本）- 保留以供參考
const getDownloadFontSize = (text) => {
  if (!text) return 32
  
  const length = text.length
  
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
}

const sharePoster = async () => {
  try {
    // 檢查是否有生成的小卡
    if (!hasGenerated.value) {
      alert('請先生成感言卡再進行分享')
      return
    }
    
    // 🔧 根據 LINE 官方文檔實現純前端分享
    
    // 檢查 shareTargetPicker API 是否可用
    if (!liffService.isApiAvailable('shareTargetPicker')) {
      alert('分享功能在此環境中不可用，請在 LINE 應用內使用')
      return
    }
    
    // 防止重複點擊
    if (liffService.shareInProgress) {
      console.log('⚠️ 分享已在進行中，請稍後再試')
      return
    }
    
    // 準備分享訊息 - 從配置中讀取文案模板
    const shareConfig = window.GOLDENBELL_CONFIG?.liff?.shareTargetPicker
    
    
    const messages = shareConfig?.messages?.award_speech || [{
      type: 'text',
      text: generatedText.value ? 
        `「金鐘60得獎感言卡｜我的金鐘夢想成真！」\n\n我的得獎感言：${generatedText.value}\n\n金鐘盛典即將登場！快來製作你的專屬得獎感言卡，想像自己站在金鐘獎台上的光榮時刻！\n\n讓你的夢想化作「得獎感言卡」，閃耀金鐘榮光 ✨` :
        `「金鐘60得獎感言卡｜我的金鐘夢想成真！」\n\n金鐘盛典即將登場！快來製作你的專屬得獎感言卡，想像自己站在金鐘獎台上的光榮時刻！\n\n讓你的夢想化作「得獎感言卡」，閃耀金鐘榮光 ✨`
    }]
    
    
    // 檢查 LIFF 服務狀態
    
    // 使用 LIFF 分享功能
    const result = await liffService.shareTargetPicker(messages)
    
    // 根據返回值判斷分享是否真的完成
    if (result && result.status === 'success') {
      // 分享真的完成了，顯示成功訊息
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        alert('分享成功！')
      } else {
        alert('分享成功！請切換至手機版以獲得最佳體驗')
      }
    } else {
      // 分享被取消或失敗，不顯示成功訊息
      console.log('分享被取消或失敗')
    }
    
  } catch (error) {
    
    // 根據環境顯示不同的錯誤訊息
    if (liffService.isInClient()) {
      alert(`分享失敗: ${error.message}`)
    } else {
      alert('請在 LINE 應用內使用分享功能')
    }
  }
}

// 按鈕樣式函數
const getButtonStyle = () => {
  if (!canCreate.value) {
    return 'background: #4C4C4C'
  }
  
  if (isCreating.value || hasGenerated.value) {
    // 點擊後使用漸層色：#E8FF02 到 #000000
    return 'background: linear-gradient(180deg, #E8FF02 -77.78%, #000000 166.67%)'
  }
  
  // 默認顏色
  return 'background: #4C4C4C'
}
</script>

<style scoped>
.award-poster-creation {
  font-family: 'Noto Serif HK', serif;
  scroll-behavior: smooth;
}

.award-poster-creation::-webkit-scrollbar {
  width: 6px;
}

.award-poster-creation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.award-poster-creation::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.award-poster-creation::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

@media (max-width: 768px) {
  .award-poster-creation {
    -webkit-overflow-scrolling: touch;
  }
}

textarea {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: pre-wrap !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  line-height: 1.6 !important;
  word-wrap: break-word !important;
  box-shadow: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.45);
  opacity: 1;
}

@media (max-width: 640px) {
  textarea {
    font-size: 16px !important;
    transform: scale(0.8125);
    transform-origin: top left;
    width: 123%;
  }
}

@media (max-width: 640px) and (-webkit-min-device-pixel-ratio: 1) {
  textarea {
    font-size: 13px !important;
    transform: none;
    width: 100%;
  }
}
</style>

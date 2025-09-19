<template>
  <div class="poster-creation w-full min-h-screen bg-white relative sm:max-w-[393px] sm:mx-auto overflow-y-auto">
    <!-- Background Image -->
    <div class="absolute inset-0 w-full h-full">
      <img 
        src="/images/poster.png" 
        alt="Golden Bell Background" 
        class="w-full h-full object-cover"
      />
    </div>
  <!-- Animation Queue -->
  <div class="flex w-full h-[47px] justify-center items-center relative z-10">
    </div>
    <!-- Main Content -->
    <div class="flex w-full pt-[47px] px-[20px] pb-[40px] flex-col items-start gap-[42px] relative z-10">
      <!-- Content Container -->
      <div class="flex flex-col items-center gap-[24px] w-full">
        <!-- Input Section -->
        <div class="flex flex-col items-start gap-[24px] w-full">
          <!-- Header Container -->
          <div class="flex flex-col items-center gap-[6px] w-full">
            <!-- Title Description -->
            <!-- Main Title -->
            <div class="text-white text-center font-normal text-[17px] leading-[180%] tracking-[-0.266px] w-full">
              <span class="font-normal">【</span>
              <span class="font-normal"> </span>
              <span class="font-bold">一起為金鐘60打Call！</span>
              <span class="font-normal">】</span>
            </div>
            
            <!-- Description Text -->
            <div class="text-white text-center font-bold text-[14px] leading-[180%] w-full">
              在這裡輸入你的應援文字，為最愛的節目或藝人加油
            </div>

            <!-- Input Container -->
            <div class="flex flex-col items-start gap-[3px] w-full">
              <!-- Text Input Area -->
              <div class="flex h-[146px] p-[10px_12px] items-start gap-[10px] w-full rounded-[12px] border border-[#B3C400] bg-[#272727]">
                <div class="flex w-full h-[126px] flex-col justify-start items-start gap-[8px]">
                  <!-- Input Prompt -->
                  <div 
                    class="flex-1 w-full font-bold text-[13px] leading-[160%] tracking-[-0.247px] outline-none cursor-text"
                    :class="{ 
                      'text-white': isEditing || inputText,
                      'text-[rgba(255,255,255,0.45)]': !isEditing && !inputText,
                      'text-orange-400': hasWarnings,
                      'text-green-400': inputText && !hasWarnings && !isOverLimit,
                      'text-red-400': isOverLimit
                    }"
                    contenteditable="true"
                    @input="onContentInput"
                    @focus="onFocus"
                    @blur="onBlur"
                    @keydown="onKeyDown"
                    @paste="onPaste"
                    @keypress="onKeyPress"
                    :data-placeholder="!inputText ? '輸入：「我要為 ______ 加油！」或「給金鐘 60 的一句話」' : ''"
                    :maxlength="maxLength"
                  >{{ inputText }}</div>

                  <!-- Controls Container -->
                  <div class="flex flex-col items-start gap-[5px] w-full">
                    <!-- Character Count -->
                    <div class="flex justify-between items-center w-full">
                      <div 
                        class="flex flex-col justify-end flex-1 text-right font-bold text-[11px] leading-[160%]"
                        :class="{ 
                          'text-red-400': isOverLimit, 
                          'text-yellow-400': !isOverLimit && hasWarnings,
                          'text-[rgba(255,255,255,0.5)]': !isOverLimit && !hasWarnings
                        }"
                      >
                        {{ displayLength }}/{{ maxLength }}
                      </div>
                    </div>

                    <!-- Create Button -->
                    <div 
                      class="flex h-[36px] justify-center items-center gap-[10px] w-full rounded-[8px] cursor-pointer transition-all"
                      @click="createPoster"
                      :class="{ 'opacity-50 cursor-not-allowed': !canCreate }"
                      :style="isCreating ? 'background: linear-gradient(180deg, #E8FF02 -77.78%, #000 166.67%)' : 'background: #4C4C4C'"
                    >
                      <div class="text-white font-bold text-[13px] leading-[100%] tracking-[-0.247px]">
                        製作我的應援海報 ✨
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggestion Text -->
              <div class="flex pl-[6px] justify-center items-center gap-[10px] w-full">
                <div class="flex-1 text-[#E6E6E6] font-bold text-[11px] leading-[160%] tracking-[-0.209px]">
                  ✻ 建議字數 20 字，以簡短有力的應援最能打動人心！
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Image Section -->
        <div class="flex flex-col items-start gap-[8px] w-full">
          <!-- Poster Preview -->
          <div class="relative h-[353px] w-full rounded-[4px] overflow-hidden">
            <img 
              class="h-full w-full object-cover"
              :src="posterImage"
              alt="Poster Preview"
            />
            
            <!-- 應援文字覆蓋層 - 只有在生成後才顯示 -->
            <div v-if="isCreating && generatedText" class="absolute inset-0 flex items-center justify-center p-[20px]">
              <div class="p-[16px] max-w-[280px] text-center">
                <div class="text-white font-bold text-[16px] leading-[140%] tracking-[-0.2px] break-words">
                  {{ generatedText }}
                </div>
              </div>
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
              :class="{ 'opacity-50 cursor-not-allowed': generationCount >= maxGenerations }"
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

      <!-- Image Generation Record Link -->
      <div class="flex items-center justify-end gap-[4px] w-full">
        <div 
          class="text-white font-bold text-[16px] leading-[100%] tracking-[0.64px] underline cursor-pointer hover:text-[#E8FF02] transition-colors"
          @click="goToImageRecord"
        >
          圖片生成紀錄
        </div>
        <svg class="w-[13px] h-[13px] fill-white cursor-pointer" @click="goToImageRecord" width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.1621 7.86292H0.834671C0.598181 7.86292 0.399946 7.78076 0.239968 7.61643C0.0799893 7.45211 0 7.24849 0 7.00557C0 6.76266 0.0799893 6.55904 0.239968 6.39471C0.399946 6.23038 0.598181 6.14822 0.834671 6.14822H5.49839H10.1621L6.07223 1.94721C5.9053 1.77574 5.82531 1.57569 5.83226 1.34706C5.83922 1.11844 5.92616 0.918387 6.0931 0.746917C6.26003 0.589736 6.45479 0.507573 6.67737 0.500429C6.89995 0.493284 7.0947 0.575447 7.26164 0.746917L12.7705 6.40543C12.8539 6.49116 12.9131 6.58404 12.9478 6.68407C12.9826 6.78409 13 6.89126 13 7.00557C13 7.11989 12.9826 7.22705 12.9478 7.32708C12.9131 7.4271 12.8539 7.51998 12.7705 7.60572L7.26164 13.2642C7.10861 13.4214 6.91734 13.5 6.6878 13.5C6.45827 13.5 6.26003 13.4214 6.0931 13.2642C5.92616 13.0928 5.8427 12.8891 5.8427 12.6534C5.8427 12.4176 5.92616 12.214 6.0931 12.0425L10.1621 7.86292Z" fill="white"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'
import { contentFilterService } from '../../services/contentFilterService.js'

// Emits
const emit = defineEmits(['goToImageRecord', 'goBack', 'posterGenerated'])

// Reactive data
const inputText = ref('')
const filteredText = ref('')
const generatedText = ref('')  // 保存已生成的文字
const warnings = ref([])
const filterStats = ref({ level1: 0, level2: 0, level3: 0 })
const generationCount = ref(0)
const isCreating = ref(false)
const isEditing = ref(false)
const hasGenerated = ref(false) // 新增：是否已經生成過海報
const maxLength = 20
const maxGenerations = 10

// Computed properties
const canCreate = computed(() => {
  // 簡化條件，暫時移除內容過濾警告的檢查
  const result = inputText.value.trim().length > 0 && 
         generationCount.value < maxGenerations && 
         !isOverLimit.value
  
  // 調試用 console.log (可以移除)
  // console.log('canCreate 檢查:', { ... })
  
  return result
})

const hasWarnings = computed(() => {
  return warnings.value.length > 0
})

const displayLength = computed(() => {
  return filteredText.value.length || inputText.value.length
})

const isOverLimit = computed(() => {
  return displayLength.value > maxLength
})


const posterImage = ref('/images/Entered1.png')

// Methods
const onTextInput = () => {
  // Handle text input validation if needed
  console.log('Text input:', inputText.value)
}

const onContentInput = (event) => {
  let newText = event.target.textContent || ''
  
  // 移除多餘的空白字符，但保留換行符
  newText = newText.replace(/\t/g, ' ').replace(/\r/g, '')
  
  // 檢查行數限制
  const lines = newText.split('\n')
  const maxLines = 3 // 根據輸入框高度設定最大行數
  
  if (lines.length > maxLines) {
    // 如果超過最大行數，只保留前幾行
    newText = lines.slice(0, maxLines).join('\n')
    event.target.textContent = newText
    setCaretToEnd(event.target)
  }
  
  // 嚴格限制字數
  if (newText.length > maxLength) {
    newText = newText.substring(0, maxLength)
    // 更新 DOM 內容
    event.target.textContent = newText
    // 設置游標到末尾
    setCaretToEnd(event.target)
  }
  
  inputText.value = newText
  processInput()
}

const handlePaste = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText()
    // 清理貼上內容，移除多餘字符但保留換行符
    const cleanClipboardText = clipboardText.replace(/\r/g, '').replace(/\t/g, ' ')
    let newText = inputText.value + cleanClipboardText
    
    // 檢查行數限制
    const lines = newText.split('\n')
    const maxLines = 3 // 根據輸入框高度設定最大行數
    
    if (lines.length > maxLines) {
      // 如果超過最大行數，只保留前幾行
      newText = lines.slice(0, maxLines).join('\n')
    }
    
    // 嚴格限制字數
    if (newText.length > maxLength) {
      newText = newText.substring(0, maxLength)
    }
    
    inputText.value = newText
    processInput()
    
    // 更新 DOM 顯示
    const editableDiv = document.querySelector('[contenteditable="true"]')
    if (editableDiv) {
      editableDiv.textContent = newText
      setCaretToEnd(editableDiv)
    }
  } catch (err) {
    console.log('無法讀取剪貼簿內容')
  }
}

const setCaretToEnd = (element) => {
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

const onFocus = () => {
  isEditing.value = true
}

const onBlur = () => {
  isEditing.value = false
  // 再次檢查長度限制
  if (inputText.value.length > maxLength) {
    inputText.value = inputText.value.substring(0, maxLength)
    processInput()
  }
}

const onPaste = (event) => {
  event.preventDefault()
  handlePaste()
}

const onKeyPress = (event) => {
  // 在字符輸入之前檢查長度
  if (inputText.value.length >= maxLength) {
    event.preventDefault()
    return false
  }
}

const onKeyDown = (event) => {
  // 處理換行鍵 - 檢查是否會超過高度限制
  if (event.key === 'Enter') {
    const currentText = event.target.textContent || ''
    const lines = currentText.split('\n')
    const maxLines = 3 // 根據輸入框高度設定最大行數
    
    if (lines.length >= maxLines) {
      event.preventDefault()
      return
    }
  }
  
  // 嚴格防止超過字數限制
  const currentLength = inputText.value.length
  const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown'
  const isModifierKey = event.ctrlKey || event.metaKey || event.altKey
  const isSpecialKey = event.key === 'Tab' || event.key === 'Escape'
  
  // 如果已經達到最大長度，只允許刪除鍵、方向鍵、修飾鍵和特殊鍵
  if (currentLength >= maxLength && !isDeleteKey && !isModifierKey && !isSpecialKey) {
    event.preventDefault()
    return
  }
  
  // 如果是貼上操作，需要檢查貼上後的長度
  if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
    // 阻止預設貼上，我們將在 onContentInput 中處理
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

  // 先檢查原始輸入長度
  if (inputText.value.length > maxLength) {
    inputText.value = inputText.value.substring(0, maxLength)
  }

  // 執行內容過濾
  const filterResult = contentFilterService.filterContent(inputText.value, 'all')
  const validationResult = contentFilterService.validateInput(inputText.value)
  
  // 更新過濾結果
  filteredText.value = filterResult.filteredText
  filterStats.value = filterResult.filterStats
  
  // 檢查過濾後的長度
  if (filteredText.value.length > maxLength) {
    filteredText.value = filteredText.value.substring(0, maxLength)
  }
  
  // 更新警告信息
  warnings.value = [...validationResult.warnings]
  
  // 嚴格的長度檢查
  const originalLength = inputText.value.length
  const filteredLength = filteredText.value.length
  
  if (originalLength > maxLength) {
    warnings.value.push(`原始內容超過 ${maxLength} 字限制，已自動截斷`)
  }
  
  if (filteredLength > maxLength) {
    warnings.value.push(`過濾後內容超過 ${maxLength} 字限制，已自動截斷`)
  }
  
  // 如果接近字數限制，給予提醒
  if (originalLength > maxLength * 0.9) {
    warnings.value.push(`字數即將達到 ${maxLength} 字限制`)
  }

  console.log('過濾結果:', {
    original: inputText.value,
    originalLength: originalLength,
    filtered: filteredText.value,
    filteredLength: filteredLength,
    warnings: warnings.value
  })
}

const createPoster = () => {
  if (!canCreate.value) return
  
  // 保存要生成的文字
  const textToUse = filteredText.value || inputText.value
  generatedText.value = textToUse
  
  // Set creating state to true (changes button style permanently)
  isCreating.value = true
  
  // 標記已經生成過海報，按鈕區域將一直顯示
  hasGenerated.value = true
  
  // Increment generation count
  generationCount.value++
  
  console.log('Creating poster with filtered text:', textToUse)
  
  // 創建海報數據
  const posterData = {
    text: textToUse,
    imageUrl: posterImage.value, // 使用當前的海報圖片
    generationCount: generationCount.value
  }
  
  // 發送海報生成事件到父元件
  emit('posterGenerated', posterData)
  
  // Add poster creation logic here
  // For example: call API to generate poster with textToUse
  
  // 不清空輸入框，讓用戶可以看到剛才輸入的內容
  // inputText.value = ''
  // filteredText.value = ''
  // warnings.value = []
  // isEditing.value = false
}

const goToImageRecord = () => {
  emit('goToImageRecord')
}

const regeneratePoster = () => {
  if (generationCount.value >= maxGenerations) return

  // 重新生成 = 清空輸入框，讓用戶重新輸入文字
  console.log('Regenerating poster - clearing input for new text')
  
  // 清空輸入框
  inputText.value = ''
  filteredText.value = ''
  warnings.value = []
  isEditing.value = false
  
  // 清空 DOM 內容
  const editableDiv = document.querySelector('[contenteditable="true"]')
  if (editableDiv) {
    editableDiv.textContent = ''
  }
  
  // 重置按鈕狀態，讓用戶可以重新輸入
  isCreating.value = false
  
  // 重新生成不增加次數，用戶需要重新輸入文字後點擊「製作我的應援海報」才會增加次數
  console.log('Input cleared. User needs to enter new text and click create button.')
}

const downloadToOfficial = () => {
  console.log('Downloading to official account')
  // Add download logic here
}

const sharePoster = () => {
  console.log('Sharing poster')
  // Add share logic here
}
</script>

<style scoped>
.poster-creation {
  font-family: 'Noto Serif HK', serif;
  /* 確保主容器的滾動行為 */
  scroll-behavior: smooth;
}

/* 主容器滾軸樣式 */
.poster-creation::-webkit-scrollbar {
  width: 6px;
}

.poster-creation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.poster-creation::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.poster-creation::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* textarea 滾軸樣式 */
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

/* 針對行動裝置優化滾動 */
@media (max-width: 768px) {
  .poster-creation {
    -webkit-overflow-scrolling: touch;
  }
}

/* contenteditable placeholder 效果 */
[contenteditable="true"]:empty:before {
  content: attr(data-placeholder);
  color: rgba(255, 255, 255, 0.45);
  pointer-events: none;
}

[contenteditable="true"]:focus:empty:before {
  content: attr(data-placeholder);
  color: rgba(255, 255, 255, 0.45);
}

/* 移除 contenteditable 的預設樣式 */
[contenteditable="true"] {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: pre-wrap !important; /* 允許換行但保持格式 */
  overflow: hidden !important; /* 隱藏超出內容 */
  height: 126px !important; /* 固定高度 */
  line-height: 1.6 !important; /* 行高 */
  word-wrap: break-word !important; /* 長單詞換行 */
}

/* 防止 iOS 縮放 */
@media (max-width: 640px) {
  [contenteditable="true"] {
    font-size: 13px;
  }
}
</style>

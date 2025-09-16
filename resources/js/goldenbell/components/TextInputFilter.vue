<template>
  <div class="w-full font-primary">
    <!-- 輸入框容器 -->
    <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border-2 border-gray-600 transition-all duration-300 focus-within:border-yellow-400 focus-within:shadow-lg focus-within:shadow-yellow-400/30">
      <textarea
        v-model="inputText"
        @input="onInput"
        @blur="onBlur"
        :placeholder="placeholder"
        :maxlength="maxLength + 50"
        class="filter-textarea w-full min-h-[100px] bg-transparent border-none outline-none text-white text-sm leading-relaxed resize-none placeholder-gray-400"
        :class="{ 
          'text-orange-400': hasWarnings, 
          'text-green-400': isValid && !hasWarnings 
        }"
      ></textarea>
      
      <!-- 字數統計 -->
      <div class="absolute bottom-2 right-3 text-xs bg-black/70 px-2 py-1 rounded-full">
        <span :class="{ 'text-red-400': isOverLimit, 'text-yellow-400': !isOverLimit }">
          {{ displayLength }}/{{ maxLength }}
        </span>
      </div>
    </div>

    <!-- 過濾狀態提示 -->
    <div v-if="hasWarnings" class="mt-2 space-y-1">
      <div 
        v-for="warning in warnings" 
        :key="warning"
        class="bg-orange-500/10 border border-orange-400 text-orange-400 px-3 py-2 rounded-md text-xs"
      >
        ⚠️ {{ warning }}
      </div>
    </div>

    <!-- 預覽過濾結果 -->
    <div v-if="showPreview && filteredText !== inputText" class="mt-3 bg-yellow-400/10 border border-yellow-400 rounded-lg p-3">
      <div class="text-yellow-400 text-xs font-medium mb-1.5">過濾後內容：</div>
      <div class="text-black text-sm leading-relaxed">{{ filteredText }}</div>
    </div>

    <!-- 過濾統計 (開發模式) -->
    <div v-if="showStats && debugMode" class="mt-2 bg-black/30 rounded-md p-2 text-xs">
      <div class="text-black-400 mb-1">過濾統計：</div>
      <div class="flex gap-2 flex-wrap">
        <span 
          v-if="filterStats.level1 > 0" 
          class="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs"
        >
          嚴格過濾: {{ filterStats.level1 }}
        </span>
        <span 
          v-if="filterStats.level2 > 0" 
          class="px-1.5 py-0.5 bg-orange-500/20 text-black-400 rounded-full text-xs"
        >
          中度過濾: {{ filterStats.level2 }}
        </span>
        <span 
          v-if="filterStats.level3 > 0" 
          class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs"
        >
          商業過濾: {{ filterStats.level3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { contentFilterService } from '../../services/contentFilterService.js'

// Props
const props = defineProps({
  placeholder: {
    type: String,
    default: '金鐘60是最喜歡的努力創作者的舞台！願每份心血都能獲得肯定，每份真情都能被正視！滿台灣影視人才濟濟…'
  },
  maxLength: {
    type: Number,
    default: 50
  },
  filterLevel: {
    type: String,
    default: 'all',
    validator: (value) => ['level1', 'level2', 'level3', 'all'].includes(value)
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: false
  },
  autoFilter: {
    type: Boolean,
    default: true
  },
  debugMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'input',
  'filtered',
  'warning',
  'valid',
  'submit'
])

// 響應式數據
const inputText = ref('')
const filteredText = ref('')
const warnings = ref([])
const filterStats = ref({ level1: 0, level2: 0, level3: 0 })

// 計算屬性
const displayLength = computed(() => {
  return props.autoFilter ? filteredText.value.length : inputText.value.length
})

const isOverLimit = computed(() => {
  return displayLength.value > props.maxLength
})

const hasWarnings = computed(() => {
  return warnings.value.length > 0
})

const isValid = computed(() => {
  return !hasWarnings.value && !isOverLimit.value && inputText.value.trim().length > 0
})

// 方法
function onInput() {
  processInput()
  emit('input', {
    originalText: inputText.value,
    filteredText: filteredText.value,
    isValid: isValid.value
  })
}

function onBlur() {
  if (isValid.value) {
    emit('valid', {
      originalText: inputText.value,
      filteredText: filteredText.value
    })
  }
}

function processInput() {
  if (!inputText.value) {
    filteredText.value = ''
    warnings.value = []
    filterStats.value = { level1: 0, level2: 0, level3: 0 }
    return
  }

  // 執行內容過濾
  const filterResult = contentFilterService.filterContent(inputText.value, props.filterLevel)
  const validationResult = contentFilterService.validateInput(inputText.value)
  const lengthCheck = contentFilterService.checkLength(filterResult.filteredText, props.maxLength)

  // 更新過濾結果
  filteredText.value = filterResult.filteredText
  filterStats.value = filterResult.filterStats
  
  // 更新警告信息
  warnings.value = [...validationResult.warnings]
  
  // 添加長度警告
  if (!lengthCheck.isValid) {
    warnings.value.push(`內容超過 ${props.maxLength} 字限制`)
  }

  // 發送過濾事件
  if (filterResult.hasFilteredWords) {
    emit('filtered', {
      originalText: inputText.value,
      filteredText: filteredText.value,
      filteredWords: filterResult.filteredWords
    })
  }

  // 發送警告事件
  if (warnings.value.length > 0) {
    emit('warning', warnings.value)
  }
}

// 公開方法
function getFilteredText() {
  return filteredText.value
}

function getOriginalText() {
  return inputText.value
}

function isValidInput() {
  return isValid.value
}

function clearInput() {
  inputText.value = ''
  processInput()
}

function setInputText(text) {
  inputText.value = text
  processInput()
}

// 暴露方法給父組件
defineExpose({
  getFilteredText,
  getOriginalText,
  isValidInput,
  clearInput,
  setInputText
})

// 生命週期
onMounted(() => {
  if (props.debugMode) {
    console.log('TextInputFilter 組件已載入，過濾模式:', props.filterLevel)
  }
})

// 監聽
watch(() => props.filterLevel, () => {
  if (inputText.value) {
    processInput()
  }
})
</script>

<style scoped>
/* 只保留 Tailwind 無法處理的特殊樣式 */
.filter-textarea::placeholder {
  opacity: 0.6;
}

/* 防止 iOS 縮放 */
@media (max-width: 640px) {
  .filter-textarea {
    font-size: 16px;
  }
}
</style>

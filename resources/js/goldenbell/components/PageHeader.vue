<template>
  <div class="relative flex items-center justify-between w-full">
    <!-- Back Button - 左側 -->
    <div class="flex w-[20px] h-[20px] justify-center items-center cursor-pointer" @click="goBack">
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.21108 9.37156L17.4085 9.37156C17.7178 9.37156 17.977 9.47901 18.1862 9.69389C18.3954 9.90878 18.5 10.1751 18.5 10.4927C18.5 10.8104 18.3954 11.0766 18.1862 11.2915C17.977 11.5064 17.7178 11.6139 17.4085 11.6139L11.3098 11.6139L5.21108 11.6139L10.5594 17.1075C10.7777 17.3317 10.8823 17.5933 10.8732 17.8923C10.8641 18.1913 10.7504 18.4529 10.5321 18.6771C10.3138 18.8827 10.0591 18.9901 9.76806 18.9994C9.47699 19.0088 9.22231 18.9013 9.00401 18.6771L1.80016 11.2775C1.69101 11.1654 1.6137 11.0439 1.56822 10.9131C1.52274 10.7823 1.5 10.6422 1.5 10.4927C1.5 10.3432 1.52274 10.2031 1.56822 10.0723C1.6137 9.94148 1.69101 9.82002 1.80016 9.70791L9.00401 2.30832C9.20412 2.10277 9.45425 2 9.75441 2C10.0546 2 10.3138 2.10277 10.5321 2.30832C10.7504 2.53255 10.8596 2.79882 10.8596 3.10714C10.8596 3.41545 10.7504 3.68173 10.5321 3.90596L5.21108 9.37156Z" fill="white"/>
      </svg>
    </div>

    <!-- Header Container - 右側 -->
    <div class="flex items-center gap-[14px]">
      <!-- Title -->
      <div class="text-white text-center font-bold text-[17px] leading-[170%]">
        {{ title }}
      </div>
      
      <!-- Count Badge (可選) -->
      <div 
        v-if="showBadge && badgeText"
        class="flex py-[8px] px-[12px] justify-center items-center gap-[10px] rounded-[31px] bg-[#404040]"
      >
        <div class="text-white font-bold text-[12px] leading-[100%]">
          {{ badgeText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showBadge: {
    type: Boolean,
    default: false
  },
  badgeText: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['goBack'])

// Methods
const goBack = () => {
  emit('goBack')
}
</script>

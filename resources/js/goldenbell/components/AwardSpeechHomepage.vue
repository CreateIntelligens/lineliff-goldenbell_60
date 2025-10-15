<template>
  <div
    class="award-speech-homepage w-full min-h-screen bg-black relative sm:max-w-[393px] sm:mx-auto"
  >
    <!-- Background Image Container -->
    <div class="absolute inset-0 w-full h-[120vh] overflow-hidden">
      <img
        :src="getThemeImages('award_speech').background"
        alt="Award Speech Background"
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
        <div class="px-6 pt-6 pb-2">
          <div class="text-gray-500 text-sm font-[400] font-sans">
            您尚未加入好友，無法使用此服務。<br />
            請先加入好友後再試。
          </div>
        </div>
        <!-- 按鈕區域 -->
        <div class="px-6 pb-3">
          <button
            @click="closeAlert"
            class=" font-sans w-full text-gray-800 text-sm font-[400] py-2 rounded hover:bg-gray-50 transition-colors"
          >
            確定
          </button>
        </div>
      </div>
    </div>

    <!-- Animation Que -->
    <div class="w-full h-[47px] relative z-10"></div>

    <!-- Main content -->
    <div
      class="flex w-full pt-[40px] px-[20px] flex-col items-start gap-[40px] relative z-10"
    >
      <div class="flex flex-col items-start gap-[456px] w-full">
        <!-- Title -->
        <img
          @click="handleCreateSpeech"
          :src="getThemeImages('award_speech').title"
          alt="Title"
          class="h-[108px] w-full object-contain"
        />

        <!-- Container with buttons -->
        <div class="flex flex-col items-start gap-[16px] w-full">
          <div class="flex flex-col items-start gap-[8px] w-full">
            <!-- First button container -->
            <div class="flex flex-col items-center gap-[10px] w-full">
              <img
                :src="getThemeImages('award_speech').hero"
                alt="2025 Award"
                class="w-[279px] h-[54px]"
              />
            </div>

            <!-- Second button container -->
            <div class="flex flex-col items-center gap-[10px] w-full">
              <img
                :src="getThemeImages('award_speech').button"
                alt="Create Speech Button"
                class="w-[309px] h-[50px] cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
              />
            </div>
          </div>

          <!-- Bottom container -->
          <div class="flex flex-col items-center gap-[10px] w-full">
            <img
              :src="getThemeImages('award_speech').logo"
              alt="Bottom Logo"
              class="w-auto h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, onMounted } from "vue";
import { getThemeImages } from "../../assets/images.js";

// Props
const props = defineProps({
  isFriendChecked: {
    type: Boolean,
    default: false,
  },
  isFriend: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits(["createPoster", "viewRecords"]);

// Methods
const handleCreateSpeech = () => {
  // 如果不是好友，不允許創建感言
  if (props.isFriendChecked && !props.isFriend) {
    return;
  }
  console.log("🎤 開始製作頒獎致詞");
  emit("createPoster");
};

const handleViewRecords = () => {
  // 如果不是好友，不允許查看記錄
  if (props.isFriendChecked && !props.isFriend) {
    return;
  }
  console.log("📋 查看感言紀錄");
  emit("viewRecords");
};

const closeAlert = () => {
  // 關閉警告後可以選擇重新檢查好友狀態或跳轉到其他頁面
  // 這裡我們可以重新檢查好友狀態
  window.location.reload();
};

// 生命週期
onMounted(() => {
  console.log("🎭 頒獎致詞首頁載入完成");
});
</script>

<style scoped>
.award-speech-homepage {
  font-family: "Noto Serif HK", serif;
}

/* 響應式設計 - 在大螢幕上居中顯示 */
@media (min-width: 640px) {
  .award-speech-homepage {
    margin: 0 auto;
  }
}
</style>

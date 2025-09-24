/**
 * 主題配置管理
 * 支援多種 event_type 的主題切換
 */

export const THEME_CONFIG = {
  // 金鐘60應援活動主題
  cheer: {
    // 背景圖片 - 使用 import 方式引用
    images: 'cheer',  // 標記為使用 cheer 主題圖片
    
    // 文字內容
    content: {
      title: '第60屆金鐘獎頒獎典禮',
      subtitle: 'THE 60th GOLDEN BELL AWARDS 2025',
      mainTitle: '金鐘60•星光閃耀',
      description: [
        '快來製作你的專屬應援海報',
        '為最愛的節目和藝人加油打氣，',
        '一起點亮金鐘星光大道！'
      ],
      buttonText: '製作我的應援海報'
    },
    
    // 活動日期
    events: [
      {
        date: '10.11',
        day: 'SAT',
        name: '廣播金鐘'
      },
      {
        date: '10.17',
        day: 'FRI',
        name: '節目金鐘'
      },
      {
        date: '10.18',
        day: 'SAT',
        name: '戲劇金鐘'
      }
    ],
    
    // 顏色主題
    colors: {
      accent: '#E8FF02',      // 主要強調色（黃綠色）
      background: '#000000',   // 背景色
      text: '#FFFFFF'         // 文字色
    }
  },

  // 頒獎致詞主題 (根據提供的設計圖)
  award_speech: {
    // 背景圖片 - 使用 import 方式引用
    images: 'award_speech',  // 標記為使用 award_speech 主題圖片
    
    // 文字內容（根據圖片上的實際文字）
    content: {
      title: '',  // 不顯示頂部標題
      subtitle: '',  // 不顯示副標題
      mainTitle: '寫下你的金鐘致詞',
      description: [
        '如果你是金鐘得主···',
        '你想說什麼？'
      ],
      buttonText: '立刻製作下的專屬獲獎感言'
    },
    
    // 不顯示活動日期
    events: [],
    
    // 顏色主題（根據圖片的金色調整）
    colors: {
      accent: '#FFD700',      // 金色，符合金鐘獎主題
      background: '#000000',  // 黑色背景
      text: '#FFFFFF'         // 白色文字
    }
  }
}

/**
 * 從 URL 參數或配置獲取當前主題類型
 * @returns {string} 主題類型 (cheer 或 award_speech)
 */
export function getCurrentEventType() {
  // 1. 優先從 URL 參數讀取
  const urlParams = new URLSearchParams(window.location.search)
  const eventTypeFromUrl = urlParams.get('event_type')
  
  if (eventTypeFromUrl && THEME_CONFIG[eventTypeFromUrl]) {
    return eventTypeFromUrl
  }
  
  // 2. 從配置檔案讀取
  if (window.GOLDENBELL_CONFIG?.eventType && THEME_CONFIG[window.GOLDENBELL_CONFIG.eventType]) {
    return window.GOLDENBELL_CONFIG.eventType
  }
  
  // 3. 默認使用 cheer
  return 'cheer'
}

/**
 * 獲取當前主題配置
 * @returns {Object} 當前主題的完整配置
 */
export function getCurrentTheme() {
  const eventType = getCurrentEventType()
  return {
    eventType,
    ...THEME_CONFIG[eventType]
  }
}

/**
 * 獲取主題圖片路徑
 * @param {string} imageKey - 圖片鍵名 (background, poster, entered)
 * @returns {string} 圖片路徑
 */
export function getThemeImage(imageKey) {
  const theme = getCurrentTheme()
  return theme.images[imageKey] || ''
}

/**
 * 獲取主題文字內容
 * @param {string} contentKey - 內容鍵名
 * @returns {string|Array} 文字內容
 */
export function getThemeContent(contentKey) {
  const theme = getCurrentTheme()
  return theme.content[contentKey] || ''
}

/**
 * 獲取主題顏色
 * @param {string} colorKey - 顏色鍵名
 * @returns {string} 顏色值
 */
export function getThemeColor(colorKey) {
  const theme = getCurrentTheme()
  return theme.colors[colorKey] || ''
}

/**
 * 獲取主題活動列表
 * @returns {Array} 活動列表
 */
export function getThemeEvents() {
  const theme = getCurrentTheme()
  return theme.events || []
}

// 導出當前主題資訊供調試使用
export function logCurrentTheme() {
  const theme = getCurrentTheme()
  console.log('🎨 當前主題配置:', theme)
  return theme
}

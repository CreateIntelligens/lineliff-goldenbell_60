/**
 * 內容過濾服務
 * 實作三級過濾機制，過濾不當內容
 */

class ContentFilterService {
  constructor() {
    this.filterWords = this.initializeFilterWords()
  }

  /**
   * 初始化過濾詞庫
   */
  initializeFilterWords() {
    return {
      // 第一級：嚴格過濾 - 政治敏感、違法、暴力內容
      level1: [
        // 政治相關
        '台獨', '統一', '一中', '九二共識', '中華民國', '中華人民共和國',
        '小英', '阿扁', '馬英九', '蔡英文', '賴清德', '柯文哲', '韓國瑜',
        '民進黨', '國民黨', '時代力量', '台灣民眾黨',
        '獨立', '統獨', '藍綠', '泛藍', '泛綠',
        '大陸', '內地', '對岸', '祖國', '母國',
        '反中', '親中', '舔共', '426', '支那',
        
        // 違法內容
        '毒品', '大麻', '海洛因', '安非他命', '搖頭丸', 'K他命',
        '吸毒', '販毒', '毒販', '毒蟲', '嗨藥',
        '賭博', '六合彩', '大家樂', '運彩', '地下錢莊',
        '詐騙', '洗錢', '黑錢', '地下匯兌',
        
        // 暴力與色情
        '殺人', '殺死', '自殺', '自殘', '尋死', '想死',
        '強姦', '性侵', '猥褻', '性交', '做愛', '上床',
        '色情', 'A片', '情色', '裸體', '露點',
        '恐嚇', '威脅', '殺掉', '幹掉', '搞死'
      ],
      
      // 第二級：中度過濾 - 不雅用語、髒話
      level2: [
        // 常見髒話
        '媽的', '他媽的', '去死',
        '白癡', '白痴', '智障', '腦殘', '北七', '87', '神經病',
        '王八蛋', '混蛋', '渾蛋', '蛋頭', '廢物', '垃圾',
        '婊子', '賤人', '臭婊子', '死婊子', '機掰',
        '屎', '大便', '拉屎', '吃屎', '狗屎',
        
        // 性相關不雅用語
        '妓女', '做雞', '召妓', '買春',
        '小三', '外遇', '偷情', '劈腿', '綠帽',
        
        // 歧視性用語
        '三八', '番仔', '阿六仔', '外勞', '看護工', '426',
        '死阿公', '死阿嬤', '老不死', '老番癲',
        '客家鬼', '山地人', '平地人', '台北俗', '南部猴',
        '低能', '弱智', '殘障', '跛腳', '瞎子', '啞巴',
        '肥豬', '死胖子', '醜八怪', '醜女', '醜男',
        
        // 台灣特有髒話
        'ㄍㄋㄇ', 'ㄎㄅ', 'ㄍㄢ', 'ㄅㄔ', 'ㄅㄘ',
        '干', '幹林娘', '幹恁娘', '幹恁老師', '趕羚羊',
        '靠北', '靠腰', '靠杯', '機歪', '雞掰', '機車', '白目',
        '龜兒子', '龜孫', '王八', '烏龜',
        '死囝仔', '死查某', '死查埔', '肖查某'
      ],
      
      // 第三級：商業宣傳過濾
      level3: [
        // 聯絡方式
        '加LINE', 'LINE群', '私訊', '密我', '+LINE',
        'http', 'www', '.com', '.tw', '.net',
        
        // 投資理財
        '投資', '賺錢', '獲利', '被動收入', '理財',
        '股票', '期貨', '外匯', '虛擬幣', '比特幣',
        '貸款', '借錢', '信貸', '車貸', '房貸',
        '保險', '儲蓄險', '投資險', '醫療險',
        
        // 銷售用語
        '直銷', '傳銷', '下線', '上線', '業績',
        '微商', '代購', '團購', '批發', '零售',
        '優惠', '折扣', '特價', '促銷', '限時', '免費',
        '試用', '體驗', '諮詢', '預約'
      ]
    }
  }

  /**
   * 主要過濾方法
   * @param {string} text - 要過濾的文字
   * @param {string} filterLevel - 過濾等級 ('level1', 'level2', 'level3', 'all')
   * @returns {Object} 過濾結果
   */
  filterContent(text, filterLevel = 'all') {
    if (!text || typeof text !== 'string') {
      return {
        originalText: text,
        filteredText: text,
        hasFilteredWords: false,
        filteredWords: [],
        filterStats: { level1: 0, level2: 0, level3: 0 }
      }
    }

    let filteredText = text
    const filteredWords = []
    const filterStats = { level1: 0, level2: 0, level3: 0 }

    // 根據過濾等級選擇要過濾的詞庫
    const levelsToFilter = filterLevel === 'all' 
      ? ['level1', 'level2', 'level3']
      : [filterLevel]

    // 執行過濾
    levelsToFilter.forEach(level => {
      this.filterWords[level].forEach(word => {
        if (filteredText.includes(word)) {
          // 記錄被過濾的詞
          filteredWords.push({ word, level })
          filterStats[level]++
          
          // 替換為相同長度的 * 字符
          const replacement = '*'.repeat(word.length)
          filteredText = filteredText.replace(new RegExp(word, 'g'), replacement)
        }
      })
    })

    return {
      originalText: text,
      filteredText: filteredText,
      hasFilteredWords: filteredWords.length > 0,
      filteredWords: filteredWords,
      filterStats: filterStats
    }
  }

  /**
   * 即時檢查輸入內容
   * @param {string} text - 輸入的文字
   * @returns {Object} 檢查結果
   */
  validateInput(text) {
    const result = this.filterContent(text)
    
    return {
      isValid: !result.hasFilteredWords,
      filteredText: result.filteredText,
      warnings: this.generateWarnings(result.filteredWords),
      stats: result.filterStats
    }
  }

  /**
   * 生成警告訊息
   * @param {Array} filteredWords - 被過濾的詞列表
   * @returns {Array} 警告訊息
   */
  generateWarnings(filteredWords) {
    const warnings = []
    
    if (filteredWords.some(item => item.level === 'level1')) {
      warnings.push('包含政治敏感或不當內容，已自動過濾')
    }
    
    if (filteredWords.some(item => item.level === 'level2')) {
      warnings.push('包含不雅用語，已自動過濾')
    }
    
    if (filteredWords.some(item => item.level === 'level3')) {
      warnings.push('包含商業宣傳內容，已自動過濾')
    }
    
    return warnings
  }

  /**
   * 獲取過濾統計
   * @param {string} text - 要分析的文字
   * @returns {Object} 統計結果
   */
  getFilterStats(text) {
    const result = this.filterContent(text)
    return {
      totalWords: result.filteredWords.length,
      byLevel: result.filterStats,
      filteredWords: result.filteredWords
    }
  }

  /**
   * 檢查文字長度
   * @param {string} text - 文字內容
   * @param {number} maxLength - 最大長度
   * @returns {Object} 長度檢查結果
   */
  checkLength(text, maxLength = 50) {
    const length = text ? text.length : 0
    return {
      isValid: length <= maxLength,
      currentLength: length,
      maxLength: maxLength,
      remaining: maxLength - length
    }
  }
}

// 創建單例實例
export const contentFilterService = new ContentFilterService()
export default contentFilterService

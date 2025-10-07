/**
 * LIFF 服務模組
 * 處理 LINE LIFF 相關的操作
 * 包含 LIFF 開關功能，支援開發/生產環境無縫切換
 */

import { API_CONFIG } from '../config/config.js'
import { apiService } from './apiService.js'

class LiffService {
  constructor() {
    this.isInitialized = false
    this.userId = null
    this.userProfile = null
    this.liffId = null
    this.basicId = null
    this.shareInProgress = false // 防止重複分享
    
    // 從配置中讀取 ShareTargetPicker 設定
    this.shareConfig = window.GOLDENBELL_CONFIG?.liff?.shareTargetPicker || {
      enabled: true,
      messages: {
        cheer: [{ type: 'flex', altText: '我製作了金鐘60應援海報！快來一起為心愛的節目加油！' }],
        award: [{ type: 'flex', altText: '我寫了金鐘60得獎感言！快來看看我的感謝話語！' }]
      }
    }
  }

  /**
   * 完整的 LIFF 初始化流程（包含登入驗證和開關功能）
   * @param {Object} options - 配置選項
   * @returns {Promise<Object>} 初始化結果
   */
  async initializeLiff(options = {}) {
    console.log('=== LIFF 初始化開始 ===')
    
    // 🔧 檢查 LIFF 開關 - 核心功能
    if (!window.endpoint?.enableLiff) {
      console.log('🔧 LIFF 功能已關閉，使用開發模式')
      
      // 使用模擬用戶 ID
      const mockUserId = 'dev_user_' + Date.now()
      console.log('🎭 使用模擬用戶 ID:', mockUserId)
      console.log('💡 開發提示：在 index.html 中設置 enableLiff: true 來啟用 LIFF 功能')
      
      // 設置模擬用戶
      this.userId = mockUserId
      this.isInitialized = true
      
      return {
        success: true,
        isLoggedIn: true,
        isFriend: true,
        userId: mockUserId,
        message: 'LIFF 功能已關閉，使用模擬用戶（開發模式）'
      }
    }
    
    // 優先從 window.endpoint 獲取 LIFF ID 和 Basic ID
    let liffId = window.endpoint?.liffId
    let basicId = window.endpoint?.basicId
    
    // 備用方案：從全域變數獲取
    if (!liffId) liffId = window.LIFF_ID
    if (!basicId) basicId = window.LINE_BASIC_ID
    
    // 最後的備用方案：使用配置中的預設值
    if (!liffId) {
      liffId = API_CONFIG.liff?.liffId || 'YOUR_LIFF_ID'
      console.log('使用預設 LIFF ID:', liffId)
    } else {
      console.log('使用動態 LIFF ID:', liffId)
    }
    
    // 檢查是否為有效的 LIFF ID
    if (liffId === 'YOUR_LIFF_ID') {
      console.warn('⚠️ 請在 index.html 中設置正確的 LIFF ID')
      console.log('💡 開發提示：設置 enableLiff: false 可以使用開發模式')
      
      return {
        success: false,
        error: '無效的 LIFF ID',
        message: '請設置正確的 LIFF ID 或關閉 LIFF 功能進行開發'
      }
    }
    
    // Basic ID 是可選的
    if (basicId && basicId !== '@YOUR_BASIC_ID') {
      console.log('使用動態 Basic ID:', basicId)
    } else {
      console.log('未設置有效的 Basic ID，跳過相關功能')
    }

    // 保存到實例變數
    this.liffId = liffId
    this.basicId = basicId

    try {
      // 檢查 LIFF SDK 是否載入
      if (typeof liff === 'undefined') {
        throw new Error('LIFF SDK 未載入')
      }

      // 初始化 LIFF，請求必要的權限
      await liff.init({ 
        liffId
      })
      console.log('✅ LIFF SDK 初始化成功')
      
      if (!liff.isLoggedIn()) {
        console.log('⚠️ 用戶未登入 LIFF')
        
        // 檢查是否在 LINE 應用內
        const isInClient = liff.isInClient()
        console.log('📱 環境檢查:', {
          isInClient,
          userAgent: navigator.userAgent,
          location: window.location.href
        })
        
        if (isInClient) {
          console.log('✅ 在 LINE 應用內，準備執行登入重定向')
        } else {
          console.log('🌐 在瀏覽器中，嘗試 LINE 登入')
          console.log('💡 提示：建議設置 enableLiff: false 進行瀏覽器開發')
        }
        
        // 🔧 從配置中讀取重定向 URL，支援部署後直接修改 index.html
        let redirectUri = window.GOLDENBELL_CONFIG?.liff?.redirectUri
        
        if (!redirectUri) {
          // 如果配置中沒有設置，則自動使用當前頁面 URL
          redirectUri = new URL(window.location).toString()
          console.log('🔗 使用自動生成的重定向 URL:', redirectUri)
        } else {
          console.log('🔗 使用配置中的重定向 URL:', redirectUri)
        }
        
        console.log('⏳ 即將執行 liff.login()，頁面將重定向...')
        console.log('🔄 重定向後會回到此頁面並重新初始化 LIFF')
        console.log('💡 提示：可在 index.html 的 GOLDENBELL_CONFIG.liff.redirectUri 中修改重定向 URL')
        
        // 延遲執行，確保 console.log 能顯示
        setTimeout(() => {
          console.log('🚀 正在執行 liff.login()...')
          liff.login({ redirectUri })
        }, 100)
        
        return {
          success: false,
          isLoggedIn: false,
          isFriend: false,
          userId: null,
          message: isInClient ? '用戶未登入，已重定向至登入頁面' : '在瀏覽器中嘗試 LINE 登入，已跳轉到登入頁面'
        }
      }
      
      console.log('✅ 用戶已登入，繼續 LIFF 初始化流程...')
      
      // 獲取用戶 ID
      const context = liff.getContext()
      const decodedToken = liff.getDecodedIDToken()
      this.userId = context.userId || decodedToken.sub
      
      console.log('成功獲取用戶 ID:', this.userId)
      
      // 跳過好友關係檢查（LINE Login Channel 不支援 friendship API）
      console.log('跳過好友關係檢查（LINE Login Channel）')
      
      // 模擬好友關係為 true
      const isFriend = true
      
      // 用戶已登入
      this.isInitialized = true
      console.log('✅ LIFF 初始化完成，用戶已登入')
      
      return {
        success: true,
        isLoggedIn: true,
        isFriend: isFriend,
        userId: this.userId,
        message: 'LIFF 初始化成功'
      }
      
    } catch (error) {
      console.error('❌ LIFF 初始化失敗:', error)
      
      // 錯誤時的後備機制
      console.log('🔄 LIFF 初始化失敗，提供後備選項:')
      console.log('1. 檢查 LIFF ID 是否正確')
      console.log('2. 設置 enableLiff: false 使用開發模式')
      console.log('3. 在 LINE 應用內測試')
      
      return {
        success: false,
        error: error.message,
        message: 'LIFF 初始化失敗，請檢查配置或使用開發模式'
      }
    }
  }

  /**
   * 檢查用戶是否已登入
   * @returns {boolean} 是否已登入
   */
  isLoggedIn() {
    if (!this.isInitialized || typeof liff === 'undefined') {
      return false
    }
    return liff.isLoggedIn()
  }

  /**
   * 獲取用戶資料
   * @returns {Promise<Object|null>} 用戶資料或 null
   */
  async getUserProfile() {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ LIFF 尚未初始化')
        return null
      }

      if (!this.isLoggedIn()) {
        console.log('⚠️ 用戶未登入')
        return null
      }

      const profile = await liff.getProfile()
      this.userProfile = profile
      this.userId = profile.userId
      
      console.log('👤 用戶資料已獲取:', profile)
      return profile
    } catch (error) {
      console.error('❌ 獲取用戶資料失敗:', error)
      return null
    }
  }

  /**
   * 獲取用戶 ID
   * @returns {string|null} 用戶 ID 或 null
   */
  getUserId() {
    return this.userId
  }

  /**
   * 獲取用戶資料 (相容性方法，與 getUserProfile 相同)
   * @returns {Promise<Object|null>} 用戶資料或 null
   */
  async getProfile() {
    // 在開發模式下，直接返回模擬用戶資料
    if (!window.endpoint?.enableLiff) {
      const mockProfile = {
        userId: this.userId || 'dev_user_' + Date.now(),
        displayName: '開發用戶',
        pictureUrl: '',
        statusMessage: '開發模式用戶'
      }
      
      console.log('🎭 返回模擬用戶資料:', mockProfile)
      return mockProfile
    }

    // 正常模式下調用 getUserProfile
    return await this.getUserProfile()
  }

  /**
   * 登入
   * @param {string} redirectUri - 登入後重定向的 URI
   */
  // login(redirectUri = null) {
  //   if (!this.isInitialized || typeof liff === 'undefined') {
  //     console.warn('⚠️ LIFF 尚未初始化')
  //     return
  //   }

  //   if (redirectUri) {
  //     liff.login({ redirectUri })
  //   } else {
  //     liff.login()
  //   }
  // }

  /**
   * 登出
   */
  logout() {
    if (!this.isInitialized || typeof liff === 'undefined') {
      console.warn('⚠️ LIFF 尚未初始化')
      return
    }

    liff.logout()
  }

  /**
   * 檢查是否在 LINE 應用內
   * @returns {boolean} 是否在 LINE 應用內
   */
  isInClient() {
    if (!this.isInitialized || typeof liff === 'undefined') {
      return false
    }
    return liff.isInClient()
  }

  /**
   * 獲取 LIFF 環境資訊
   * @returns {Object} LIFF 環境資訊
   */
  getEnvironment() {
    if (!this.isInitialized || typeof liff === 'undefined') {
      return null
    }

    return {
      os: liff.getOS(),
      language: liff.getLanguage(),
      version: liff.getVersion(),
      lineVersion: liff.getLineVersion(),
      isInClient: liff.isInClient(),
      isLoggedIn: liff.isLoggedIn()
    }
  }

  /**
   * 發送訊息到當前聊天室
   * 
   * @param {Array} messages - 訊息陣列
   * @returns {Promise<void>} 發送結果
   */
  async sendMessages(messages) {
    try {
      if (!this.isInitialized || typeof liff === 'undefined') {
        throw new Error('LIFF 尚未初始化')
      }

      await liff.sendMessages(messages)
      console.log('✅ 訊息發送成功')
      
    } catch (error) {
      console.error('❌ 發送訊息失敗:', error)
      throw error
    }
  }

  /**
   * 發送圖片到官方帳號（支援 URL 字串或 Blob 物件）
   * 
   * @param {string|Blob} imageData - 圖片 URL 或 Blob 物件
   * @param {string} fileName - 檔案名稱
   * @param {string} text - 可選的文字訊息
   * @param {string} eventType - 事件類型
   * @returns {Promise<void>} 發送結果
   */
  async sendImage(imageData, fileName, text = '', eventType = '') {
    try {
      // 檢查 LIFF 是否可用
      if (typeof liff === 'undefined') {
        throw new Error('LIFF SDK 未載入，無法發送圖片')
      }

      // 檢查 LIFF 是否已初始化
      if (!this.isInitialized) {
        throw new Error('LIFF 尚未初始化，無法發送圖片')
      }

      // 檢查是否已登入 - 這是最重要的檢查
      if (!liff.isLoggedIn()) {
        throw new Error('請先登入 LINE 才能發送圖片')
      }

      // 檢查用戶 ID 是否存在
      if (!this.userId) {
        throw new Error('無法獲取用戶 ID，請重新登入')
      }

      // 記錄環境資訊以供調試
      const environment = this.getEnvironment()
      console.log('🔍 LIFF 環境資訊:', {
        isInClient: environment?.isInClient,
        isLoggedIn: environment?.isLoggedIn,
        version: environment?.version,
        userId: this.userId
      })

      console.log('📤 準備發送圖片到官方帳號...', {
        fileName,
        imageDataType: typeof imageData,
        isBlob: imageData instanceof Blob,
        hasText: !!text,
        userId: this.userId
      })

      let imageUrl
      
      // 處理不同類型的圖片資料
      if (imageData instanceof Blob) {
        // LIFF sendMessages 不支援 blob: URL，需要轉換為 base64 data URL
        imageUrl = await this.blobToDataURL(imageData)
        console.log('🔗 將 Blob 轉換為 Data URL，大小:', imageData.size, 'bytes')
      } else if (typeof imageData === 'string') {
        // 如果是字串，檢查是否為 blob URL
        if (imageData.startsWith('blob:')) {
          throw new Error('不支援 blob: URL，請使用 Blob 物件或 HTTP URL')
        }
        // 如果是普通 URL，直接使用
        imageUrl = imageData
        console.log('🔗 使用現有圖片 URL:', imageUrl)
      } else {
        throw new Error('不支援的圖片資料類型')
      }

      console.log('📤 準備使用 liff.sendMessages 發送圖片...')

      // 發送圖片（使用 liff.sendMessages）
      const messages = []
      
      // 如果有文字，先發送文字訊息
      if (text && text.trim()) {
        messages.push({
          type: 'text',
          text: text
        })
      }
      
      // 發送圖片訊息
      messages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      })

      console.log('🚀 開始發送訊息...', {
        messageCount: messages.length,
        hasTextMessage: messages.some(m => m.type === 'text'),
        hasImageMessage: messages.some(m => m.type === 'image')
      })

      await liff.sendMessages(messages)
      console.log('✅ 圖片發送成功')
      
      // 如果是 Blob 生成的 URL，清理記憶體
      if (imageData instanceof Blob) {
        URL.revokeObjectURL(imageUrl)
        console.log('🧹 已清理 Blob URL 記憶體')
      }
      
    } catch (error) {
      console.error('❌ 發送圖片失敗:', error)
      
      // 提供更詳細的錯誤資訊
      const errorDetails = {
        message: error.message,
        liffAvailable: typeof liff !== 'undefined',
        liffInitialized: this.isInitialized,
        userLoggedIn: typeof liff !== 'undefined' ? liff.isLoggedIn() : false,
        userId: this.userId,
        environment: this.getEnvironment()
      }
      
      console.error('🔍 錯誤詳細資訊:', errorDetails)
      
      // 根據不同錯誤類型提供更好的用戶提示
      if (error.message.includes('LIFF SDK')) {
        throw new Error('系統初始化失敗，請重新整理頁面')
      } else if (error.message.includes('登入')) {
        throw new Error('請重新登入 LINE 後再試')
      } else if (error.message.includes('用戶 ID')) {
        throw new Error('無法識別用戶身份，請重新登入')
      } else {
        throw new Error(`發送失敗：${error.message}`)
      }
    }
  }

  /**
   * 開啟分享選擇器 (Share Target Picker)
   * @param {Array} messages - 要分享的訊息陣列
   * @returns {Promise<void>} 分享結果
   */
  async shareTargetPicker(messages) {
    try {
      // 檢查分享功能是否啟用
      if (!this.shareConfig.enabled) {
        console.log('⚠️ 分享功能已被停用')
        throw new Error('分享功能暫時不可用')
      }

      // 防止重複分享
      if (this.shareInProgress) {
        console.log('⚠️ 分享功能已在進行中，跳過重複分享')
        throw new Error('分享功能已在進行中，請稍後再試')
      }

      if (!this.isInitialized || typeof liff === 'undefined') {
        throw new Error('LIFF 尚未初始化')
      }

      this.shareInProgress = true
      console.log('🔗 準備分享訊息:', messages)
      console.log('🔧 使用分享配置:', this.shareConfig)

      // 根據 LINE 官方文檔：檢查 API 是否可用
      if (!liff.isApiAvailable('shareTargetPicker')) {
        throw new Error('shareTargetPicker API 在此環境中不可用')
      }

      // 驗證訊息格式
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('分享訊息格式錯誤：必須是非空陣列')
      }

      // 檢查每個訊息的格式
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        if (!message.type) {
          throw new Error(`訊息 ${i} 缺少 type 屬性`)
        }
      }

      // 使用官方 API 調用分享選擇器
      console.log('🚀 調用 liff.shareTargetPicker...')
      await liff.shareTargetPicker(messages)
      console.log('✅ 分享選擇器已開啟')
      
    } catch (error) {
      console.error('❌ 開啟分享選擇器失敗:', error)
      
      // 根據官方文檔提供更準確的錯誤信息
      if (error.message.includes('not available')) {
        throw new Error('分享功能在此環境中不可用，請在 LINE 應用內使用')
      } else {
        throw error
      }
    } finally {
      // 無論成功或失敗都重置分享狀態
      this.shareInProgress = false
    }
  }


  /**
   * 檢查 LIFF API 是否可用
   * @param {string} apiName - API 名稱
   * @returns {boolean} 是否可用
   */
  isApiAvailable(apiName) {
    if (!this.isInitialized || typeof liff === 'undefined') {
      return false
    }
    return liff.isApiAvailable(apiName)
  }

  /**
   * 檢查分享功能是否可用
   * @returns {boolean} 分享功能是否可用
   */
  checkShareTargetPickerAvailability() {
    if (!this.isInitialized || typeof liff === 'undefined') {
      return false
    }

    // 根據 LINE 官方文檔，使用 liff.isApiAvailable() 檢查
    return this.isApiAvailable('shareTargetPicker')
  }

  /**
   * 關閉 LIFF 應用
   */
  closeWindow() {
    try {
      if (!this.isInitialized || typeof liff === 'undefined') {
        console.warn('⚠️ LIFF 尚未初始化')
        return
      }

      if (!this.isInClient()) {
        console.warn('⚠️ 不在 LINE 應用內，無法使用 closeWindow 功能')
        return
      }

      liff.closeWindow()
      console.log('✅ LIFF 應用已關閉')
      
    } catch (error) {
      console.error('❌ 關閉 LIFF 應用失敗:', error)
    }
  }

  /**
   * 獲取當前 LIFF 狀態
   * @returns {Object} LIFF 狀態
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoggedIn: this.isLoggedIn(),
      userId: this.userId,
      userProfile: this.userProfile,
      environment: this.getEnvironment(),
      liffEnabled: window.endpoint?.enableLiff || false,
      // 檢查各種 LIFF API 是否可用 - 移除有問題的 API 檢查
      apiAvailability: {
        shareTargetPicker: this.checkShareTargetPickerAvailability(), // 使用自定義檢查
        // sendMessages 是基本功能，不需要檢查
        // bluetoothLeFunction: this.isApiAvailable('bluetoothLeFunction'),
        // subwindow: this.isApiAvailable('subwindow')
      }
    }
  }

  /**
   * 開發輔助功能
   * @returns {Object} 開發信息
   */
  getDevInfo() {
    const isLiffEnabled = window.endpoint?.enableLiff
    const isInClient = this.isInClient()
    const isLiffAvailable = typeof liff !== 'undefined'
    
    return {
      liffEnabled: isLiffEnabled,
      isInClient,
      isLiffAvailable,
      isBrowser: !isInClient,
      developmentMode: !isLiffEnabled,
      recommendations: {
        development: '🔧 開發模式：設置 enableLiff: false 使用模擬用戶',
        browser: '🌐 瀏覽器測試：使用開發模式或在 LINE 中開啟',
        line: '📱 LINE 應用測試：設置 enableLiff: true 並在 LINE 中開啟',
        production: '🚀 生產環境：確保 enableLiff: true 且 LIFF ID 正確'
      }
    }
  }

  /**
   * 將 Blob 轉換為 Data URL
   * @param {Blob} blob - 要轉換的 Blob 物件
   * @returns {Promise<string>} Data URL 字串
   */
  async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('無法讀取 Blob 資料'))
      reader.readAsDataURL(blob)
    })
  }
}

// 創建單例實例
export const liffService = new LiffService()
export default liffService

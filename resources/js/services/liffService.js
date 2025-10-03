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
        liffId,
        // 請求發送訊息的權限
        withLoginOnExternalBrowser: true
      })
      console.log('✅ LIFF SDK 初始化成功')
      
      if (!liff.isLoggedIn()) {
        console.log('用戶未登入 LIFF，重定向至登入頁面')
        
        // 檢查是否在 LINE 應用內
        const isInClient = liff.isInClient()
        
        if (isInClient) {
          // 在 LINE 應用內，執行登入重定向
          console.log('在 LINE 應用內，執行登入重定向')
          const redirectUrl = window.location.origin + window.location.pathname
          console.log('🔗 登入後重定向到:', redirectUrl)
          liff.login({ redirectUri: redirectUrl })
          return {
            success: false,
            isLoggedIn: false,
            message: '用戶未登入，已重定向至登入頁面'
          }
        } else {
          // 在瀏覽器中，嘗試 LINE 登入
          console.log('🌐 在瀏覽器中，嘗試 LINE 登入')
          console.log('💡 提示：建議設置 enableLiff: false 進行瀏覽器開發')
          
          const redirectUrl = window.location.origin + window.location.pathname
          console.log('🔗 登入後重定向到:', redirectUrl)
          liff.login({ redirectUri: redirectUrl })
          
          return {
            success: false,
            isLoggedIn: false,
            isFriend: false,
            userId: null,
            message: '在瀏覽器中嘗試 LINE 登入，已跳轉到登入頁面'
          }
        }
      }
      
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
  login(redirectUri = null) {
    if (!this.isInitialized || typeof liff === 'undefined') {
      console.warn('⚠️ LIFF 尚未初始化')
      return
    }

    if (redirectUri) {
      liff.login({ redirectUri })
    } else {
      liff.login()
    }
  }

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
   * 發送圖片到官方帳號（參考您提供的正確方式）
   * 
   * @param {Blob} imageBlob - 圖片 Blob
   * @param {string} fileName - 檔案名稱
   * @param {string} text - 可選的文字訊息
   * @param {string} eventType - 事件類型
   * @returns {Promise<void>} 發送結果
   */
  async sendImage(imageBlob, fileName, text = '', eventType = '') {
    try {
      // 檢查 LIFF 是否可用
      if (typeof liff === 'undefined') {
        throw new Error('LIFF 不可用,無法發送圖片')
      }

      // 檢查是否在 LINE 應用內
      if (!liff.isInClient()) {
        throw new Error('請在 LINE 應用內使用此功能')
      }

      // 檢查是否已登入
      if (!liff.isLoggedIn()) {
        throw new Error('請先登入LINE')
      }

      console.log('📤 準備發送圖片到官方帳號...', {
        fileName,
        blobSize: imageBlob.size,
        blobType: imageBlob.type,
        hasText: !!text
      })

      // 直接使用 Blob URL（不需要上傳到後端）
      const imageUrl = URL.createObjectURL(imageBlob)
      console.log('🔗 使用 Blob URL:', imageUrl)

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

      await liff.sendMessages(messages)
      console.log('✅ 圖片發送成功')
      
    } catch (error) {
      console.error('❌ 發送圖片失敗:', error)
      throw error
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
      // 檢查各種 LIFF API 是否可用
      apiAvailability: {
        shareTargetPicker: this.checkShareTargetPickerAvailability(), // 使用自定義檢查
        sendMessages: this.isApiAvailable('sendMessages'),
        bluetoothLeFunction: this.isApiAvailable('bluetoothLeFunction'),
        subwindow: this.isApiAvailable('subwindow')
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
}

// 創建單例實例
export const liffService = new LiffService()
export default liffService

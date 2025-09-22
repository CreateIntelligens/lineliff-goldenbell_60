/**
 * API 服務模組
 * 處理與金鐘60圖片生成相關的API調用
 */

import { configUtils, ERROR_MESSAGES, HTTP_STATUS } from '../config/config.js'
import { liffService } from './liffService.js'

class ApiService {
  constructor() {
    this.baseURL = null
    this.headers = {}
    this.timeout = 30000
    console.log('📝 API 服務已初始化')
  }

  /**
   * 初始化 API 服務配置
   */
  init() {
    try {
      const config = configUtils.get('api', {})
      this.baseURL = config.baseURL
      this.timeout = config.timeout || 30000
      this.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
      
      if (configUtils.isDebug()) {
        console.log('🔧 API 服務配置:', {
          baseURL: this.baseURL,
          timeout: this.timeout,
          headers: this.headers
        })
      }
      
      return true
    } catch (error) {
      console.error('❌ API 服務初始化失敗:', error)
      return false
    }
  }

  /**
   * 檢查 API 是否可用
   * @returns {boolean} API 是否可用
   */
  isApiAvailable() {
    return this.baseURL && this.baseURL.startsWith('https://')
  }

  /**
   * 建立HTTP請求
   * @param {string} method - HTTP方法
   * @param {string} endpoint - API端點
   * @param {Object} options - 請求選項
   * @returns {Promise<Response>} - 請求回應
   */
  async makeRequest(method, endpoint, options = {}) {
    if (!this.isApiAvailable()) {
      throw new Error('API 服務尚未設定或不可用')
    }

    const url = configUtils.getFullUrl(endpoint)
    const config = {
      method,
      headers: { ...this.headers },
      signal: AbortSignal.timeout(this.timeout),
      ...options
    }

    // 如果有 body 且不是 FormData，轉換為 JSON
    if (config.body && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
    }

    // 如果是 FormData，移除 Content-Type header
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type']
    }

    if (configUtils.isDebug()) {
      console.log(`🌐 ${method} ${url}`, config)
    }

    try {
      const response = await fetch(url, config)
      
      if (configUtils.isDebug()) {
        console.log(`📡 Response ${response.status}:`, response)
      }

      return response
    } catch (error) {
      console.error(`❌ 請求失敗 ${method} ${url}:`, error)
      throw error
    }
  }

  /**
   * 處理API回應
   * @param {Response} response - fetch 回應
   * @returns {Promise<Object>} - 處理後的資料
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    let data
    try {
      data = isJson ? await response.json() : await response.text()
    } catch (error) {
      console.error('❌ 解析回應資料失敗:', error)
      throw new Error('回應資料格式錯誤')
    }

    if (!response.ok) {
      const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.default
      const apiError = data?.message || errorMessage
      
      console.error(`❌ API 錯誤 ${response.status}:`, apiError)
      throw new Error(apiError)
    }

    return data
  }

  /**
   * 獲取用戶的LIFF用戶ID
   * @returns {Promise<string>} 用戶ID
   */
  async getUserId() {
    try {
      // 先嘗試直接從 liffService 獲取用戶ID
      const directUserId = liffService.getUserId()
      if (directUserId) {
        console.log('✅ 直接獲取用戶ID:', directUserId)
        return directUserId
      }

      // 如果沒有，嘗試獲取用戶資料
      const profile = await liffService.getProfile()
      if (profile && profile.userId) {
        console.log('✅ 從用戶資料獲取ID:', profile.userId)
        return profile.userId
      }

      throw new Error('無法從 LIFF 服務獲取用戶ID')
    } catch (error) {
      console.error('❌ 無法獲取用戶ID:', error)
      
      // 開發模式下的後備機制
      if (!window.endpoint?.enableLiff) {
        const fallbackUserId = 'dev_user_' + Date.now()
        console.log('🔄 使用後備用戶ID (開發模式):', fallbackUserId)
        return fallbackUserId
      }
      
      throw new Error('無法獲取用戶資訊')
    }
  }

  /**
   * 獲取用戶生成圖片歷史紀錄
   * @param {string} eventType - 事件類型
   * @returns {Promise<Object>} 圖片歷史紀錄
   */
  async getImageHistory(eventType = '') {
    try {
      const userId = await this.getUserId()
      const params = new URLSearchParams({
        user_id: userId,
        event_type: eventType
      })

      const response = await this.makeRequest('GET', `/gba60/images?${params}`)
      return await this.handleResponse(response)
    } catch (error) {
      console.error('❌ 獲取圖片歷史失敗:', error)
      throw error
    }
  }

  /**
   * 儲存用戶生成的圖片及資料
   * @param {string} text - 應援文字
   * @param {Blob|File} imageBlob - 圖片檔案
   * @param {string} eventType - 事件類型
   * @returns {Promise<Object>} 儲存結果
   */
  async saveImage(text, imageBlob, eventType = '') {
    try {
      const userId = await this.getUserId()
      const formData = new FormData()
      
      formData.append('user_id', userId)
      formData.append('event_type', eventType)
      formData.append('text', text)
      formData.append('image', imageBlob, 'poster.png')

      const response = await this.makeRequest('POST', '/gba60/images', {
        body: formData
      })
      
      return await this.handleResponse(response)
    } catch (error) {
      console.error('❌ 儲存圖片失敗:', error)
      throw error
    }
  }

  /**
   * 獲取用戶生成圖片數量及剩餘可生成次數
   * @param {string} eventType - 事件類型
   * @returns {Promise<Object>} 生成次數資訊
   */
  async getImageCount(eventType = '') {
    try {
      const userId = await this.getUserId()
      const params = new URLSearchParams({
        user_id: userId,
        event_type: eventType
      })

      const response = await this.makeRequest('GET', `/gba60/images/count?${params}`)
      return await this.handleResponse(response)
    } catch (error) {
      console.error('❌ 獲取圖片數量失敗:', error)
      throw error
    }
  }

  /**
   * 查看單張圖片詳情
   * @param {string} imageId - 圖片ID
   * @param {string} userId - 用戶ID (可選，用於權限檢查)
   * @returns {Promise<Object>} 圖片詳情
   */
  async getImageDetail(imageId, userId = null) {
    try {
      let url = `/gba60/images/${imageId}`
      
      if (userId) {
        const params = new URLSearchParams({ user_id: userId })
        url += `?${params}`
      }

      const response = await this.makeRequest('GET', url)
      return await this.handleResponse(response)
    } catch (error) {
      console.error('❌ 獲取圖片詳情失敗:', error)
      throw error
    }
  }

  /**
   * 將canvas轉換為Blob
   * @param {HTMLCanvasElement} canvas - Canvas元素
   * @param {string} mimeType - 圖片格式
   * @param {number} quality - 圖片品質 (0-1)
   * @returns {Promise<Blob>} 圖片Blob
   */
  async canvasToBlob(canvas, mimeType = 'image/png', quality = 0.9) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas轉換失敗'))
        }
      }, mimeType, quality)
    })
  }

  /**
   * 從圖片URL創建Canvas並轉換為Blob
   * @param {string} imageUrl - 圖片URL
   * @param {string} text - 要覆蓋的文字
   * @returns {Promise<Blob>} 處理後的圖片Blob
   */
  async createPosterBlob(imageUrl, text) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // 設定 canvas 尺寸
          canvas.width = img.width
          canvas.height = img.height
          
          // 繪製背景圖
          ctx.drawImage(img, 0, 0)
          
          // 設定文字樣式
          ctx.fillStyle = 'white'
          ctx.font = 'bold 24px "Noto Serif HK", serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // 計算文字位置 (置中)
          const x = canvas.width / 2
          const y = canvas.height / 2
          
          // 繪製文字
          ctx.fillText(text, x, y)
          
          // 轉換為 Blob
          const blob = await this.canvasToBlob(canvas)
          resolve(blob)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('圖片載入失敗'))
      }
      
      img.src = imageUrl
    })
  }

}

// 創建單例實例
export const apiService = new ApiService()

// 初始化服務
apiService.init()

export default apiService

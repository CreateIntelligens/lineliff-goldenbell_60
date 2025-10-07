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
      
      // 智能後備機制：根據環境決定策略
      const hostname = window.location.hostname
      const isLiffEnvironment = hostname.includes('liff.line.me')
      const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1'
      
      if (!window.endpoint?.enableLiff || !isLiffEnvironment || isLocalDev) {
        // 開發模式或非 LIFF 環境，使用開發用戶ID
        const fallbackUserId = 'dev_user_' + Date.now()
        console.log('🔄 使用後備用戶ID:', fallbackUserId, '環境:', {
          hostname,
          isLiffEnvironment,
          enableLiff: window.endpoint?.enableLiff
        })
        return fallbackUserId
      } else {
        // LIFF 環境但無法獲取用戶ID，可能是權限問題
        const guestUserId = 'guest_user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        console.warn('⚠️ LIFF 環境但無法獲取用戶ID，使用訪客ID:', guestUserId)
        return guestUserId
      }
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

      console.log('📡 請求歷史記錄 API:', {
        endpoint: `/gba60/images?${params}`,
        userId: userId,
        eventType: eventType
      })

      const response = await this.makeRequest('GET', `/gba60/images?${params}`)
      const result = await this.handleResponse(response)
      
      console.log('📦 歷史記錄 API 回應:', {
        status: response.status,
        result: result,
        dataType: typeof result?.data,
        dataContent: result?.data
      })
      
      return result
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
  /**
   * 自動初始化用戶
   * @param {string} eventType - 事件類型
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initializeUser(eventType = '') {
    try {
      console.log('🔄 開始初始化用戶...')
      
      // 方法1：嘗試呼叫計數API（可能會自動創建用戶）
      try {
        await this.getImageCount(eventType)
        console.log('✅ 計數API呼叫成功')
      } catch (e) {
        console.log('⚠️ 計數API失敗:', e.message)
      }
      
      // 方法2：嘗試呼叫歷史記錄API（可能會自動創建用戶）
      try {
        await this.getImageHistory(eventType)
        console.log('✅ 歷史記錄API呼叫成功')
      } catch (e) {
        console.log('⚠️ 歷史記錄API失敗:', e.message)
      }
      
      return true
    } catch (error) {
      console.error('❌ 用戶初始化失敗:', error)
      return false
    }
  }

  async saveImage(text, imageBlob, eventType = '') {
    const userId = await this.getUserId()
    
    // 創建FormData的通用函數
    const createFormData = () => {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('event_type', eventType)
      formData.append('text', text)
      formData.append('image', imageBlob, 'poster.png')
      return formData
    }

    try {
      if (configUtils.isDebug()) {
        console.log('📤 儲存圖片請求參數:', {
          user_id: userId,
          event_type: eventType,
          text: text,
          image_size: imageBlob.size,
          image_type: imageBlob.type
        })
      }

      const response = await this.makeRequest('POST', '/gba60/images', {
        body: createFormData()
      })
      
      return await this.handleResponse(response)
      
    } catch (error) {
      console.error('❌ 儲存圖片失敗:', error)
      
      // 如果是422錯誤（用戶ID問題），嘗試自動初始化用戶
      if (error.message.includes('user id') || error.message.includes('user_id') || 
          error.message.includes('422') || error.message.includes('無效')) {
        
        console.log('🔄 檢測到用戶ID問題，嘗試自動初始化...')
        
        try {
          await this.initializeUser(eventType)
          
          // 等待一小段時間讓後端處理
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          console.log('🔄 重新嘗試儲存圖片...')
          const retryResponse = await this.makeRequest('POST', '/gba60/images', {
            body: createFormData()
          })
          
          const result = await this.handleResponse(retryResponse)
          console.log('✅ 重試成功！')
          return result
          
        } catch (retryError) {
          console.error('❌ 自動初始化後重試仍失敗:', retryError)
          
          // 如果所有自動修復都失敗，提供有用的錯誤信息
          const friendlyError = new Error(
            `儲存失敗：${retryError.message || '未知錯誤'}。請聯繫技術支援，用戶ID: ${userId}`
          )
          throw friendlyError
        }
      }
      
      // 其他類型的錯誤直接拋出
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
   * @param {string} eventType - 事件類型 (可選，用於判斷樣式)
   * @returns {Promise<Blob>} 處理後的圖片Blob
   */
  async createPosterBlob(imageUrl, text, eventType = '') {
    return new Promise((resolve, reject) => {
      console.log('🎯 開始生成圖片 Blob:', { imageUrl, text, eventType })
      
      const img = new Image()
      
      // 🔧 改善圖片載入設定，避免 CORS 問題
      const isLocalImage = imageUrl.startsWith(window.location.origin) || 
                          imageUrl.startsWith('/') || 
                          imageUrl.startsWith('./') ||
                          !imageUrl.startsWith('http')
      
      if (!isLocalImage) {
        img.crossOrigin = 'anonymous'
        console.log('🌐 外部圖片，設定 crossOrigin')
      } else {
        console.log('🏠 本地圖片，不設定 crossOrigin')
      }
      
      img.onload = async () => {
        try {
          console.log('✅ 圖片載入成功:', {
            width: img.width,
            height: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // 設定 canvas 尺寸
          canvas.width = img.width
          canvas.height = img.height
          
          console.log('📐 Canvas 尺寸設定:', { width: canvas.width, height: canvas.height })
          
          // 繪製背景圖
          ctx.drawImage(img, 0, 0)
          console.log('🖼️ 背景圖繪製完成')
          
          // 如果有文字，添加文字
          if (text && text.trim()) {
            // 🔧 根據圖片大小和事件類型動態計算字體大小
            const baseFontSize = Math.min(canvas.width, canvas.height) * 0.12  // 調整到圖片尺寸的12%
            const fontSize = Math.max(baseFontSize, 58)  // 最小65px（適中大小）
            
            console.log('🎨 文字渲染參數:', {
              canvasSize: `${canvas.width}x${canvas.height}`,
              baseFontSize,
              finalFontSize: fontSize,
              eventType,
              textLength: text.length
            })
            
            // 根據事件類型設定不同的文字樣式
            if (eventType === 'award_speech') {
              // 感言卡：黑色文字，左上角位置，旋轉
              ctx.fillStyle = '#000000'
              ctx.font = `bold ${fontSize}px "Noto Serif HK", serif`
              ctx.textAlign = 'left'
              ctx.textBaseline = 'top'
              
              // 感言卡位置和旋轉
              const x = canvas.width * 0.25  // 左側25%位置
              const y = canvas.height * 0.3   // 上方30%位置
              const maxWidth = canvas.width * 0.6  // 最大寬度60%
              
              ctx.save()
              ctx.translate(x, y)
              ctx.rotate(-7 * Math.PI / 180)  // -7度旋轉
              this.drawMultilineText(ctx, text, 0, 0, maxWidth, fontSize * 1.2)
              ctx.restore()
              
              console.log('✅ 感言卡文字渲染完成')
              
            } else {
              // 應援海報：白色文字，居中，有陰影
              ctx.fillStyle = 'white'
              ctx.font = `bold ${fontSize}px "Noto Serif HK", serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              
              // 添加文字陰影提高可讀性
              ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
              ctx.shadowBlur = 6
              ctx.shadowOffsetX = 3
              ctx.shadowOffsetY = 3
              
              // 居中位置
              const x = canvas.width / 2
              const y = canvas.height / 2
              const maxWidth = canvas.width * 0.8
              
              this.drawMultilineText(ctx, text, x, y, maxWidth, fontSize * 1.2)
              
              console.log('✅ 應援海報文字渲染完成')
            }
          } else {
            console.log('⚠️ 沒有文字，只生成背景圖片')
          }
          
          // 轉換為 Blob
          console.log('🔄 開始轉換為 Blob...')
          const blob = await this.canvasToBlob(canvas)
          console.log('✅ Blob 轉換完成:', { 
            size: blob.size, 
            type: blob.type,
            sizeKB: Math.round(blob.size / 1024) + 'KB'
          })
          
          resolve(blob)
        } catch (error) {
          console.error('❌ Canvas 處理失敗:', error)
          console.error('錯誤堆疊:', error.stack)
          reject(new Error(`Canvas 處理失敗: ${error.message}`))
        }
      }
      
      img.onerror = (event) => {
        console.error('❌ 圖片載入失敗:', {
          imageUrl,
          event,
          imgSrc: img.src,
          crossOrigin: img.crossOrigin
        })
        reject(new Error(`圖片載入失敗: ${imageUrl}`))
      }
      
      console.log('🔄 開始載入圖片:', imageUrl)
      img.src = imageUrl
    })
  }

  /**
   * 繪製多行文字（簡化版）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} text - 文字內容
   * @param {number} x - X 座標
   * @param {number} y - Y 座標
   * @param {number} maxWidth - 最大寬度
   * @param {number} lineHeight - 行高
   */
  drawMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('')
    const lines = []
    let currentLine = ''
    
    // 將文字分割成適合的行
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i]
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      
      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    
    // 計算起始 Y 位置（垂直置中）
    const totalHeight = lines.length * lineHeight
    const startY = y - (totalHeight / 2) + (lineHeight / 2)
    
    // 繪製每一行
    lines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight)
      ctx.fillText(line, x, lineY)
    })
  }

}

// 創建單例實例
export const apiService = new ApiService()

// 初始化服務
apiService.init()

export default apiService

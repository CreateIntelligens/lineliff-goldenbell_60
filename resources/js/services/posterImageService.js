/**
 * 海報圖片生成服務
 * 處理 Canvas 圖片生成、文字覆蓋、下載功能
 */

class PosterImageService {
  constructor() {
    this.defaultFont = '"Noto Serif HK", serif'
    this.defaultTextColor = 'white'
    this.defaultTextSize = 60  // 預設字體大小
  }

  /**
   * 生成包含文字的海報圖片並下載
   * @param {string} imageUrl - 背景圖片 URL
   * @param {string} text - 要覆蓋的文字
   * @param {string} fileName - 下載檔案名稱
   * @param {Object} options - 生成選項
   * @returns {Promise<void>}
   */
  async generateAndDownloadPoster(imageUrl, text, fileName, options = {}) {
    try {
      console.log('📥 開始生成海報圖片...', { imageUrl, text, fileName })
      
      // 創建 Canvas 和圖片
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      // 設定圖片跨域屬性
      img.crossOrigin = 'anonymous'
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // 設定 Canvas 尺寸
            canvas.width = img.width
            canvas.height = img.height
            
            // 繪製背景圖
            ctx.drawImage(img, 0, 0)
            
            // 如果有文字，繪製文字
            if (text && text.trim()) {
              await this.drawTextOnCanvas(ctx, text, canvas.width, canvas.height, options)
            }
            
            // 下載圖片
            await this.downloadCanvasAsImage(canvas, fileName)
            
            console.log('✅ 海報生成和下載完成')
            resolve()
            
          } catch (error) {
            console.error('❌ 生成海報失敗:', error)
            reject(error)
          }
        }
        
        img.onerror = () => {
          const error = new Error('圖片載入失敗')
          console.error('❌ 圖片載入失敗:', imageUrl)
          reject(error)
        }
        
        // 開始載入圖片
        img.src = imageUrl
      })
      
    } catch (error) {
      console.error('❌ 生成海報過程發生錯誤:', error)
      throw error
    }
  }

  /**
   * 在 Canvas 上繪製文字
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} text - 要繪製的文字
   * @param {number} canvasWidth - Canvas 寬度
   * @param {number} canvasHeight - Canvas 高度
   * @param {Object} options - 繪製選項
   */
  async drawTextOnCanvas(ctx, text, canvasWidth, canvasHeight, options = {}) {
    // 根據圖片大小動態調整字體大小
    const baseFontSize = Math.min(canvasWidth, canvasHeight) * 0.08  // 圖片尺寸的8%
    const fontSize = options.fontSize || Math.max(baseFontSize, 48)  // 最小48px
    
    const fontFamily = options.fontFamily || this.defaultFont
    const textColor = options.textColor || this.defaultTextColor
    const textAlign = options.textAlign || 'center'
    const textBaseline = options.textBaseline || 'middle'
    
    // 設定字體樣式
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline
    
    // 添加文字陰影效果，讓文字更清楚
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // 計算文字位置
    const x = options.x || canvasWidth / 2
    const y = options.y || canvasHeight / 2
    
    // 檢查文字是否需要換行
    const maxWidth = options.maxWidth || canvasWidth * 0.7  // 減少最大寬度讓文字更集中
    const lineHeight = options.lineHeight || fontSize * 1.3
    
    // 繪製文字（支援多行）
    this.drawMultilineText(ctx, text, x, y, maxWidth, lineHeight)
    
    // 清除陰影設定
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /**
   * 繪製多行文字
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
    
    // 計算起始 Y 位置（置中）
    const totalHeight = lines.length * lineHeight
    const startY = y - (totalHeight / 2) + (lineHeight / 2)
    
    // 繪製每一行
    lines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight)
      ctx.fillText(line, x, lineY)
    })
  }

  /**
   * 將 Canvas 轉換為圖片並下載
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {string} fileName - 檔案名稱
   * @param {string} mimeType - 圖片格式
   * @param {number} quality - 圖片品質
   * @returns {Promise<void>}
   */
  async downloadCanvasAsImage(canvas, fileName, mimeType = 'image/png', quality = 0.9) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas 轉換失敗'))
          return
        }
        
        try {
          // 創建下載連結
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          
          link.href = url
          link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
          
          // 觸發下載
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // 清理 URL
          URL.revokeObjectURL(url)
          
          resolve()
        } catch (error) {
          reject(error)
        }
      }, mimeType, quality)
    })
  }

  /**
   * 預載入字體（確保字體可用）
   * @param {string} fontFamily - 字體族名
   * @returns {Promise<boolean>}
   */
  async preloadFont(fontFamily = this.defaultFont) {
    try {
      // 創建隱藏的測試元素
      const testElement = document.createElement('div')
      testElement.style.fontFamily = fontFamily
      testElement.style.fontSize = '1px'
      testElement.style.opacity = '0'
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      testElement.textContent = 'test'
      
      document.body.appendChild(testElement)
      
      // 等待字體載入
      await document.fonts.ready
      
      document.body.removeChild(testElement)
      return true
    } catch (error) {
      console.warn('字體預載入失敗:', error)
      return false
    }
  }

  /**
   * 獲取文字度量信息
   * @param {string} text - 文字內容
   * @param {string} font - 字體設定
   * @returns {Object} 文字度量信息
   */
  getTextMetrics(text, font) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = font
    return ctx.measureText(text)
  }
}

// 創建單例實例
export const posterImageService = new PosterImageService()
export default posterImageService

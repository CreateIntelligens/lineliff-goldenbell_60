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
   * 生成包含文字的海報圖片 Blob
   * @param {string} imageUrl - 背景圖片 URL
   * @param {string} text - 要覆蓋的文字
   * @param {Object} options - 生成選項
   * @returns {Promise<Blob>} 圖片 Blob
   */
  async generatePosterBlob(imageUrl, text, options = {}) {
    try {
      console.log('📥 開始生成海報圖片 Blob...', { imageUrl, text })
      
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
            
            // 轉換為 Blob（預設改為 jpeg 並壓縮，以符合 LINE 分享限制並提高成功率）
            const mimeType = options.mimeType || 'image/jpeg'
            const quality = typeof options.quality === 'number' ? options.quality : 0.85
            const blob = await this.canvasToBlob(canvas, mimeType, quality)
            console.log('✅ 海報 Blob 生成完成', { size: blob.size, type: blob.type })
            resolve(blob)
            
          } catch (error) {
            console.error('❌ 生成海報 Blob 失敗:', error)
            reject(error)
          }
        }
        
        img.onerror = (event) => {
          const error = new Error(`圖片載入失敗: ${imageUrl}`)
          console.error('❌ 圖片載入失敗:', {
            imageUrl,
            event,
            imgSrc: img.src,
            imgComplete: img.complete,
            imgNaturalWidth: img.naturalWidth,
            imgNaturalHeight: img.naturalHeight,
            crossOrigin: img.crossOrigin,
            protocol: window.location.protocol
          })
          reject(error)
        }
        
        // 🔧 改善圖片載入邏輯
        console.log('🖼️ 載入背景圖片:', imageUrl)
        
        // 對本地圖片不設置 crossOrigin，避免 CORS 問題
        if (imageUrl.startsWith(window.location.origin) || 
            imageUrl.startsWith('/') || 
            !imageUrl.startsWith('http')) {
          console.log('🏠 本地圖片，移除 crossOrigin 設定')
          img.removeAttribute('crossOrigin')
        } else {
          console.log('🌐 外部圖片，保持 crossOrigin 設定')
        }
        
        img.src = imageUrl
      })
      
    } catch (error) {
      console.error('❌ 生成海報 Blob 失敗:', error)
      throw error
    }
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
        
        img.onerror = (event) => {
          const error = new Error(`圖片載入失敗: ${imageUrl}`)
          console.error('❌ 圖片載入失敗:', {
            imageUrl,
            event,
            imgSrc: img.src,
            imgComplete: img.complete,
            imgNaturalWidth: img.naturalWidth,
            imgNaturalHeight: img.naturalHeight
          })
          reject(error)
        }
        
        // 開始載入圖片
        console.log('🔄 開始載入圖片:', {
          imageUrl,
          crossOrigin: img.crossOrigin,
          protocol: window.location.protocol,
          isHttps: window.location.protocol === 'https:'
        })
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
    const rotation = options.rotation || 0  // 旋轉角度（度）
    
    // 設定字體樣式
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline
    
    // 不使用陰影效果，保持文字清晰
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 計算文字位置
    const x = options.x || canvasWidth / 2
    const y = options.y || canvasHeight / 2
    
    // 檢查文字是否需要換行
    const maxWidth = options.maxWidth || canvasWidth * 0.7  // 減少最大寬度讓文字更集中
    const lineHeight = options.lineHeight || fontSize * 1.3
    
    // 如果有旋轉角度，應用旋轉變換
    if (rotation !== 0) {
      ctx.save()  // 保存當前狀態
      ctx.translate(x, y)  // 移動到文字位置
      ctx.rotate(rotation * Math.PI / 180)  // 應用旋轉（轉換為弧度）
      
      // 繪製文字（支援多行），旋轉後的原點在 (0, 0)
      this.drawMultilineText(ctx, text, 0, 0, maxWidth, lineHeight, options)
      
      ctx.restore()  // 恢復狀態
    } else {
      // 繪製文字（支援多行）
      this.drawMultilineText(ctx, text, x, y, maxWidth, lineHeight, options)
    }
    
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
   * @param {Object} options - 繪製選項
   */
  drawMultilineText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
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
    
    // 計算起始 Y 位置
    const totalHeight = lines.length * lineHeight
    
    // 根據 textBaseline 調整起始位置
    let startY
    if (options.textBaseline === 'top' || ctx.textBaseline === 'top') {
      // 如果是 top baseline，從指定 Y 位置開始
      startY = y + (lineHeight / 2)
    } else {
      // 預設為置中
      startY = y - (totalHeight / 2) + (lineHeight / 2)
    }
    
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
      try {
        console.log('🔄 開始轉換 Canvas 為 Blob...')
        
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('❌ Canvas 轉換失敗：無法生成 Blob')
            reject(new Error('Canvas 轉換失敗'))
            return
          }
          
          console.log('✅ Canvas 轉換成功，Blob 大小:', blob.size, 'bytes')
          
          try {
            // 檢查是否在 LIFF 環境中
            const isInLiff = window.liff && window.liff.isInClient && window.liff.isInClient()
            console.log('🔍 環境檢查 - 是否在 LIFF 中:', isInLiff)
            console.log('🔍 User Agent:', navigator.userAgent)
            
            // 檢查是否支援下載功能
            const isDownloadSupported = 'download' in document.createElement('a')
            console.log('🔍 是否支援下載屬性:', isDownloadSupported)
            
            // 創建下載連結
            const url = URL.createObjectURL(blob)
            console.log('✅ 物件 URL 創建成功:', url)
            
            const link = document.createElement('a')
            link.href = url
            link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
            
            // 添加更多屬性來提高相容性
            link.style.display = 'none'
            link.setAttribute('target', '_blank')
            
            console.log('🔗 下載連結屬性:', {
              href: link.href,
              download: link.download,
              target: link.target
            })
            
            // 觸發下載
            document.body.appendChild(link)
            console.log('✅ 連結已加入 DOM')
            
            // 嘗試觸發下載
            try {
              link.click()
              console.log('✅ 下載點擊事件已觸發')
            } catch (clickError) {
              console.error('❌ 點擊事件失敗:', clickError)
              
              // 備用方案：嘗試手動觸發事件
              const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              })
              link.dispatchEvent(event)
              console.log('🔄 嘗試手動觸發點擊事件')
            }
            
            // 清理
            setTimeout(() => {
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              console.log('🧹 清理完成')
            }, 1000)
            
            // 如果是 LIFF 環境，提供額外的備用方案
            if (isInLiff) {
              console.log('💡 LIFF 環境提示：如果下載沒有開始，可能是環境限制')
              
              // 備用方案：開啟新視窗顯示圖片，讓用戶手動保存
              setTimeout(() => {
                try {
                  const newWindow = window.open()
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head>
                          <title>金鐘60應援海報</title>
                          <style>
                            body { margin: 0; padding: 20px; text-align: center; background: #000; color: white; }
                            img { max-width: 100%; height: auto; }
                            .tip { margin-top: 20px; font-size: 14px; }
                          </style>
                        </head>
                        <body>
                          <h3>您的金鐘60應援海報</h3>
                          <img src="${url}" alt="金鐘60應援海報" />
                          <div class="tip">
                            <p>長按圖片選擇「儲存到照片」</p>
                            <p>或點擊右上角分享按鈕保存</p>
                          </div>
                        </body>
                      </html>
                    `)
                    newWindow.document.close()
                    console.log('📱 已開啟新視窗顯示圖片，供手動保存')
                  } else {
                    console.warn('⚠️ 無法開啟新視窗，可能被瀏覽器阻擋')
                  }
                } catch (windowError) {
                  console.error('❌ 開啟新視窗失敗:', windowError)
                }
              }, 500)
            }
            
            resolve()
            
          } catch (error) {
            console.error('❌ 下載過程發生錯誤:', error)
            reject(error)
          }
        }, mimeType, quality)
        
      } catch (error) {
        console.error('❌ downloadCanvasAsImage 整體錯誤:', error)
        reject(error)
      }
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
   * 將 Canvas 轉換為 Blob
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {string} mimeType - MIME 類型
   * @param {number} quality - 圖片品質
   * @returns {Promise<Blob>} Blob 物件
   */
  canvasToBlob(canvas, mimeType = 'image/png', quality = 0.9) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas 轉換為 Blob 失敗'))
            return
          }
          resolve(blob)
        }, mimeType, quality)
      } catch (error) {
        reject(error)
      }
    })
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
